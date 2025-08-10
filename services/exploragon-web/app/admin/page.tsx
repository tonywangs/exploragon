"use client";

import React, { useEffect, useRef, useState } from "react";
import { Task, HexagonData } from "@/lib/types";
import { SF_BBOX, DEFAULT_CENTER, HEX_RADIUS_M } from "@/lib/constants";
import { drawFlatToppedHexGrid } from "@/lib/hexagon-utils";
import {
  loadGoogleMaps,
  createMap,
  loadGeoJSON,
  createPolygonFromGeoJSON,
  fitMapToBounds,
} from "@/lib/map-utils";
import { TaskModal } from "@/lib/components/TaskModal";
import { getActiveUsers, ActiveUsersDict } from "@/lib/redis";

function generatePlayerColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

function createPlayerMarker(
  google: typeof window.google,
  map: google.maps.Map,
  username: string,
  lat: number,
  lng: number,
): google.maps.Marker {
  const color = generatePlayerColor(username);
  
  const marker = new google.maps.Marker({
    position: { lat, lng },
    map,
    title: username,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: color,
      fillOpacity: 0.8,
      strokeColor: "#ffffff",
      strokeWeight: 2,
    },
  });

  const infoWindow = new google.maps.InfoWindow({
    content: `<div style="font-weight: bold; color: ${color};">${username}</div>`,
  });

  marker.addListener("click", () => {
    infoWindow.open(map, marker);
  });

  return marker;
}

export default function GoogleHexGridMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [, setHexagons] = useState<HexagonData[]>([]);
  const playerMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map());

  const updatePlayerMarkers = async (
    google: typeof window.google,
    map: google.maps.Map,
  ) => {
    try {
      const activeUsers = await getActiveUsers();
      const activeUsernames = new Set(Object.keys(activeUsers));
      
      // Remove markers for users no longer active
      for (const [username, marker] of playerMarkersRef.current.entries()) {
        if (!activeUsernames.has(username)) {
          marker.setMap(null);
          playerMarkersRef.current.delete(username);
        }
      }
      
      // Update or create markers for active users
      Object.values(activeUsers).forEach((user) => {
        const existingMarker = playerMarkersRef.current.get(user.username);
        
        if (existingMarker) {
          // Update position of existing marker
          existingMarker.setPosition({
            lat: user.coords.latitude,
            lng: user.coords.longitude,
          });
        } else {
          // Create new marker for new user
          const newMarker = createPlayerMarker(
            google,
            map,
            user.username,
            user.coords.latitude,
            user.coords.longitude,
          );
          playerMarkersRef.current.set(user.username, newMarker);
        }
      });
    } catch (error) {
      console.error("Failed to update player markers:", error);
    }
  };

  useEffect(() => {
    let map: google.maps.Map | null = null;
    const landPolygons: google.maps.Polygon[] = [];
    let cancelled = false;
    let intervalId: NodeJS.Timeout;

    async function init() {
      const google = await loadGoogleMaps(
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      );
      if (cancelled || !mapRef.current) return;

      map = createMap(mapRef.current, google, DEFAULT_CENTER);

      const geojson = (await loadGeoJSON("/sf-coastline.geojson")) as any;
      const features =
        geojson?.type === "FeatureCollection"
          ? (geojson.features ?? [])
          : geojson?.type === "Feature"
            ? [geojson]
            : [];

      for (const feature of features) {
        if (feature?.geometry) {
          const polygons = createPolygonFromGeoJSON(
            google,
            feature.geometry,
            map,
          );
          landPolygons.push(...polygons);
        }
      }

      fitMapToBounds(map, google, SF_BBOX);

      const hexagonData = drawFlatToppedHexGrid(
        google,
        map,
        SF_BBOX,
        HEX_RADIUS_M,
        landPolygons,
        setSelectedTask,
      );
      setHexagons(hexagonData);

      await updatePlayerMarkers(google, map);
      
      intervalId = setInterval(() => {
        if (map) {
          updatePlayerMarkers(google, map);
        }
      }, 1000);
    }

    init();

    return () => {
      cancelled = true;
      landPolygons.forEach((p) => p.setMap(null));
      playerMarkersRef.current.forEach((marker) => marker.setMap(null));
      playerMarkersRef.current.clear();
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100vh",
          borderRadius: 8,
          overflow: "hidden",
        }}
      />

      <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </>
  );
}
