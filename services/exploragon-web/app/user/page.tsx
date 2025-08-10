"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Coords, Task, HexagonData } from "@/lib/types";
import { GPSManager, startWatching, fetchActiveUsers } from "@/lib/gps-utils";
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

export default function UserPage() {
  const [username, setUsername] = useState<string>("");
  const [isUsernameSet, setIsUsernameSet] = useState<boolean>(false);
  const usernameInputRef = useRef<HTMLInputElement | null>(null);
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [, setLastSent] = useState<string | null>(null);
  const [, setLastCoords] = useState<Coords | null>(null);
  const [, setStatusMsg] = useState<string>("Choose username to begin");
  const [, setActiveUsers] = useState<Record<string, unknown>>({});
  
  // Map-related state
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [, setHexagons] = useState<HexagonData[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  const updateUserMarker = useCallback((coords: Coords, map: google.maps.Map, google: typeof window.google) => {
    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition({
        lat: coords.latitude,
        lng: coords.longitude,
      });
    } else {
      userMarkerRef.current = new google.maps.Marker({
        position: { lat: coords.latitude, lng: coords.longitude },
        map,
        title: `${username} (You)`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="font-weight: bold; color: #2563eb;">${username} (You)</div>`,
      });

      userMarkerRef.current.addListener("click", () => {
        infoWindow.open(map, userMarkerRef.current);
      });
    }
  }, [username]);

  const handleUsernameSubmit = useCallback(() => {
    const inputUsername = usernameInputRef.current?.value?.trim();
    if (!inputUsername) {
      alert("Please enter a username");
      return;
    }
    setUsername(inputUsername);
    setIsUsernameSet(true);
    setStatusMsg("Loading map...");
  }, []);

  const sendUpdate = useCallback(async (coords: Coords, map?: google.maps.Map, google?: typeof window.google) => {
    const gpsManager = new GPSManager(usernameRef, setLastSent, setStatusMsg);
    await gpsManager.sendUpdate(coords);
    
    if (map && google) {
      updateUserMarker(coords, map, google);
    }
  }, [updateUserMarker]);

  const startSharing = useCallback((map?: google.maps.Map, google?: typeof window.google) => {
    if (!("geolocation" in navigator)) {
      setStatusMsg("Geolocation not supported");
      return;
    }
    if (watchId !== null) return;

    const id = startWatching(
      (coords) => {
        setLastCoords(coords);
        setStatusMsg("Sharing location");
        void sendUpdate(coords, map, google);
      },
      (err) => setStatusMsg(`Error: ${err.message}`),
    );
    setWatchId(id);
    setStatusMsg("Starting location sharing...");
  }, [sendUpdate, watchId]);


  useEffect(() => {
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  useEffect(() => {
    if (!isUsernameSet) return;
    
    const interval = setInterval(async () => {
      const users = await fetchActiveUsers();
      if (users) setActiveUsers(users);
    }, 4000);
    return () => clearInterval(interval);
  }, [isUsernameSet]);


  // Store map instances for sharing functionality
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const googleInstanceRef = useRef<typeof window.google | null>(null);

  // Initialize map when username is set
  useEffect(() => {
    if (!isUsernameSet) return;
    
    let map: google.maps.Map | null = null;
    let google: typeof window.google | null = null;
    const landPolygons: google.maps.Polygon[] = [];
    let cancelled = false;

    async function initMap() {
      google = await loadGoogleMaps(
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      );
      if (cancelled || !mapRef.current) return;

      map = createMap(mapRef.current, google, DEFAULT_CENTER);
      mapInstanceRef.current = map;
      googleInstanceRef.current = google;

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
      
      // Auto-start location sharing
      if (!watchId) {
        startSharing(map, google);
      }
    }

    initMap();

    return () => {
      cancelled = true;
      landPolygons.forEach((p) => p.setMap(null));
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }
      mapInstanceRef.current = null;
      googleInstanceRef.current = null;
    };
  }, [isUsernameSet, watchId, startSharing]);

  if (!isUsernameSet) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to Exploragon</h1>
          <p className="text-gray-600">Choose a username to start playing</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                ref={usernameInputRef}
                type="text"
                placeholder="Enter your username"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUsernameSubmit();
                  }
                }}
              />
            </div>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              onClick={handleUsernameSubmit}
            >
              Start Playing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      {/* Hidden input for GPS manager */}
      <input
        ref={usernameRef}
        type="hidden"
        value={username}
        readOnly
      />
      
      {/* Map container */}
      <div
        ref={mapRef}
        className="absolute inset-0 w-full h-full"
      />


      {/* Task Modal */}
      <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
}
