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
import {
  getActiveUsers,
  ActiveUsersDict,
  UserLocationHistoryRecord,
} from "@/lib/redis";
import {
  findHexagonForCoordinate,
  drawCompleteHexGrid,
} from "@/lib/hexagon-utils";

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
  onPlayerClick: (username: string) => void,
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
    content: `<div style="font-weight: bold; color: ${color};">${username}<br/><small>Click to show history</small></div>`,
  });

  marker.addListener("click", () => {
    infoWindow.open(map, marker);
    onPlayerClick(username);
  });

  return marker;
}

export default function GoogleHexGridMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [, setHexagons] = useState<HexagonData[]>([]);
  const playerMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const taskHexagonPolygonsRef = useRef<Map<string, google.maps.Polygon>>(
    new Map(),
  );
  const completeGridPolygonsRef = useRef<Map<string, google.maps.Polygon>>(
    new Map(),
  );
  const [selectedPlayerHistory, setSelectedPlayerHistory] = useState<
    UserLocationHistoryRecord[] | null
  >(null);
  const [selectedPlayerName, setSelectedPlayerName] = useState<string | null>(
    null,
  );
  const historyMarkersRef = useRef<google.maps.Marker[]>([]);
  const historyPathRef = useRef<google.maps.Polyline | null>(null);
  const [showCompleteGrid, setShowCompleteGrid] = useState<boolean>(false);

  const clearPlayerHistory = () => {
    // Clear history markers
    historyMarkersRef.current.forEach((marker) => marker.setMap(null));
    historyMarkersRef.current = [];

    // Clear history path
    if (historyPathRef.current) {
      historyPathRef.current.setMap(null);
      historyPathRef.current = null;
    }

    // Reset task hexagon colors
    taskHexagonPolygonsRef.current.forEach((polygon) => {
      polygon.setOptions({
        fillColor: "#fca5a5",
        fillOpacity: 0.3,
      });
    });

    // Reset complete grid hexagon colors
    completeGridPolygonsRef.current.forEach((polygon) => {
      polygon.setOptions({
        fillColor: "#f9fafb",
        fillOpacity: 0.1,
      });
    });

    setSelectedPlayerHistory(null);
    setSelectedPlayerName(null);
  };

  const showPlayerHistory = async (
    username: string,
    google: typeof window.google,
    map: google.maps.Map,
  ) => {
    try {
      // Clear previous history
      clearPlayerHistory();

      // Fetch user history
      const response = await fetch(`/api/users-with-history`);
      const data = await response.json();

      if (data.ok && data.data[username]) {
        const { history } = data.data[username];
        setSelectedPlayerHistory(history);
        setSelectedPlayerName(username);

        const playerColor = generatePlayerColor(username);

        // Create history markers for path
        const pathCoords: google.maps.LatLng[] = [];
        history.forEach((record, index) => {
          const marker = new google.maps.Marker({
            position: {
              lat: record.coords.latitude,
              lng: record.coords.longitude,
            },
            map,
            title: `${username} - ${new Date(record.timestamp).toLocaleTimeString()}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 3,
              fillColor: playerColor,
              fillOpacity: 0.6,
              strokeColor: "#ffffff",
              strokeWeight: 1,
            },
            zIndex: 1000 + index,
          });

          historyMarkersRef.current.push(marker);
          pathCoords.push(
            new google.maps.LatLng(
              record.coords.latitude,
              record.coords.longitude,
            ),
          );

          // Find and highlight hexagon
          const hexCoord = findHexagonForCoordinate(
            google,
            { lat: record.coords.latitude, lng: record.coords.longitude },
            SF_BBOX,
            HEX_RADIUS_M,
          );

          if (hexCoord) {
            const hexKey = `${hexCoord.row}-${hexCoord.col}`;

            // Highlight task hexagon if it exists
            const taskPolygon = taskHexagonPolygonsRef.current.get(hexKey);
            if (taskPolygon) {
              taskPolygon.setOptions({
                fillColor: playerColor,
                fillOpacity: 0.8,
                strokeWeight: 3,
              });
            }

            // Highlight complete grid hexagon if it exists
            const gridPolygon = completeGridPolygonsRef.current.get(hexKey);
            if (gridPolygon) {
              gridPolygon.setOptions({
                fillColor: playerColor,
                fillOpacity: 0.4,
                strokeColor: playerColor,
                strokeOpacity: 0.8,
                strokeWeight: 2,
              });
            }
          }
        });

        // Draw path
        if (pathCoords.length > 1) {
          historyPathRef.current = new google.maps.Polyline({
            path: pathCoords,
            geodesic: true,
            strokeColor: playerColor,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            map,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch player history:", error);
    }
  };

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
            (username) => showPlayerHistory(username, google, map),
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

      // Draw the complete hexagon grid first (behind everything)
      drawCompleteHexGrid(
        google,
        map,
        SF_BBOX,
        HEX_RADIUS_M,
        landPolygons,
        completeGridPolygonsRef,
      );

      // Draw task hexagons on top
      const hexagonData = drawFlatToppedHexGrid(
        google,
        map,
        SF_BBOX,
        HEX_RADIUS_M,
        landPolygons,
        setSelectedTask,
        taskHexagonPolygonsRef,
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

      // Clean up history visualizations
      clearPlayerHistory();

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

      {selectedPlayerName && (
        <div className="absolute top-4 left-4 bg-white shadow-lg rounded-lg p-4 z-10 max-w-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">
                {selectedPlayerName}&apos;s History
              </h3>
              <p className="text-sm text-gray-600">
                {selectedPlayerHistory?.length || 0} location points
              </p>
            </div>
            <button
              onClick={clearPlayerHistory}
              className="ml-4 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            >
              Clear
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <div style={{ color: generatePlayerColor(selectedPlayerName) }}>
              ● Movement path and exploration area
            </div>
            <div className="text-gray-400">
              Enable &#34;Show Complete Grid&#34; to see all explored hexagons
            </div>
          </div>
        </div>
      )}

      {/* Grid toggle control */}
      <div className="absolute top-4 right-4 bg-white shadow-lg rounded-lg p-3 z-10">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showCompleteGrid}
            onChange={(e) => {
              setShowCompleteGrid(e.target.checked);
              // Toggle grid visibility
              completeGridPolygonsRef.current.forEach((polygon) => {
                polygon.setVisible(e.target.checked);
              });
            }}
            className="rounded"
          />
          <span className="text-gray-700">Show Complete Grid</span>
        </label>
        <div className="text-xs text-gray-500 mt-1">
          View all hexagons where players can move
        </div>
      </div>

      <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </>
  );
}
