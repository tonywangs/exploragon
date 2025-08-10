"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Coords, Task, HexagonData } from "@/lib/types";
import { GPSManager, startWatching, fetchActiveUsers } from "@/lib/gps-utils";
import { SF_BBOX, DEFAULT_CENTER, HEX_RADIUS_M } from "@/lib/constants";
import {
  drawFlatToppedHexGrid,
  drawCompleteHexGrid,
  findHexagonForCoordinate,
} from "@/lib/hexagon-utils";
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

  // Memoize expensive mobile detection
  const isMobile = useMemo(
    () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ),
    [],
  );

  // Map-related state
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [, setHexagons] = useState<HexagonData[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  // Loading and error states
  const [mapLoading, setMapLoading] = useState<boolean>(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>("Preparing map...");

  const updateUserMarker = useCallback(
    (coords: Coords, map: google.maps.Map, google: typeof window.google) => {
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
    },
    [username],
  );

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

  // Function to add newly visited hexagon
  const addVisitedHexagon = useCallback((coords: Coords) => {
    if (!googleInstanceRef.current) return;

    const hexCoord = findHexagonForCoordinate(
      googleInstanceRef.current,
      { lat: coords.latitude, lng: coords.longitude },
      SF_BBOX,
      HEX_RADIUS_M,
    );

    if (hexCoord) {
      const hexKey = `${hexCoord.row}-${hexCoord.col}`;
      setVisitedHexagons((prev) => {
        if (!prev.has(hexKey)) {
          const newSet = new Set([...prev, hexKey]);
          // Highlight the hexagon
          requestAnimationFrame(() => {
            const gridPolygon = completeGridPolygonsRef.current.get(hexKey);
            const taskPolygon = taskHexagonPolygonsRef.current.get(hexKey);

            if (gridPolygon) {
              gridPolygon.setOptions({
                fillColor: "#3b82f6", // Blue for visited
                fillOpacity: 0.5,
                strokeColor: "#1d4ed8",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                visible: true,
              });
            }

            if (taskPolygon) {
              taskPolygon.setOptions({
                fillColor: "#10b981", // Green for visited tasks
                fillOpacity: 0.7,
                strokeWeight: 3,
              });
            }
          });
          return newSet;
        }
        return prev;
      });
    }
  }, []);

  const sendUpdate = useCallback(
    async (
      coords: Coords,
      map?: google.maps.Map,
      google?: typeof window.google,
    ) => {
      const gpsManager = new GPSManager(usernameRef, setLastSent, setStatusMsg);
      await gpsManager.sendUpdate(coords);

      if (map && google) {
        updateUserMarker(coords, map, google);
        // Track visited hexagon in real-time
        addVisitedHexagon(coords);
      }
    },
    [updateUserMarker, addVisitedHexagon],
  );

  const startSharing = useCallback(
    (map?: google.maps.Map, google?: typeof window.google) => {
      if (!("geolocation" in navigator)) {
        setGpsError("Geolocation not supported on this device");
        setStatusMsg("Geolocation not supported");
        return;
      }
      if (watchId !== null) return;

      // Clear any previous GPS errors
      setGpsError(null);

      try {
        const id = startWatching(
          (coords) => {
            setLastCoords(coords);
            setStatusMsg("Sharing location");
            setGpsError(null); // Clear error on successful location
            void sendUpdate(coords, map, google);
          },
          (err) => {
            const errorMsg = `GPS Error: ${err.message}`;
            setGpsError(errorMsg);
            setStatusMsg(errorMsg);
          },
        );
        setWatchId(id);
        setStatusMsg("Starting location sharing...");
      } catch (error) {
        const errorMsg = "Failed to start location sharing";
        setGpsError(errorMsg);
        setStatusMsg(errorMsg);
      }
    },
    [sendUpdate, watchId],
  );

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

  // Visited hexagons tracking
  const completeGridPolygonsRef = useRef<Map<string, google.maps.Polygon>>(
    new Map(),
  );
  const taskHexagonPolygonsRef = useRef<Map<string, google.maps.Polygon>>(
    new Map(),
  );
  const [visitedHexagons, setVisitedHexagons] = useState<Set<string>>(
    new Set(),
  );

  // Function to load and display user's visited hexagons
  const loadVisitedHexagons = useCallback(async () => {
    if (!username || !googleInstanceRef.current) return;

    try {
      const response = await fetch(`/api/users-with-history`);
      const data = await response.json();

      if (data.ok && data.data[username]) {
        const { history } = data.data[username];
        const newVisitedHexagons = new Set<string>();

        history.forEach((record: any) => {
          const hexCoord = findHexagonForCoordinate(
            googleInstanceRef.current!,
            { lat: record.coords.latitude, lng: record.coords.longitude },
            SF_BBOX,
            HEX_RADIUS_M,
          );

          if (hexCoord) {
            const hexKey = `${hexCoord.row}-${hexCoord.col}`;
            newVisitedHexagons.add(hexKey);

            // Highlight the hexagon
            const gridPolygon = completeGridPolygonsRef.current.get(hexKey);
            const taskPolygon = taskHexagonPolygonsRef.current.get(hexKey);

            if (gridPolygon) {
              gridPolygon.setOptions({
                fillColor: "#3b82f6", // Blue for visited
                fillOpacity: 0.5,
                strokeColor: "#1d4ed8",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                visible: true,
              });
            }

            if (taskPolygon) {
              taskPolygon.setOptions({
                fillColor: "#10b981", // Green for visited tasks
                fillOpacity: 0.7,
                strokeWeight: 3,
              });
            }
          }
        });

        setVisitedHexagons(newVisitedHexagons);
      }
    } catch (error) {
      console.error("Failed to load visited hexagons:", error);
    }
  }, [username]);

  // Performance optimized map initialization
  useEffect(() => {
    if (!isUsernameSet) return;

    let map: google.maps.Map | null = null;
    let google: typeof window.google | null = null;
    const landPolygons: google.maps.Polygon[] = [];
    let cancelled = false;

    async function initMap() {
      try {
        setLoadingStep("Loading Google Maps...");
        google = await loadGoogleMaps(
          process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        );
        if (cancelled || !mapRef.current) return;

        setLoadingStep("Creating map...");
        map = createMap(mapRef.current, google, DEFAULT_CENTER, 12, isMobile);
        mapInstanceRef.current = map;
        googleInstanceRef.current = google;

        // Show map immediately for instant feedback
        setMapLoading(false);
        
        // Start location sharing immediately for better UX
        if (!watchId) {
          startSharing(map!, google!);
        }

        // Load features progressively without blocking
        const loadFeatures = async () => {
          try {
            if (cancelled) return;

            // Load coastline in background (non-blocking)
            const coastlinePromise = loadGeoJSON("/sf-coastline.geojson")
              .then((geojson: any) => {
                if (cancelled) return;
                const features =
                  geojson?.type === "FeatureCollection"
                    ? (geojson.features ?? [])
                    : geojson?.type === "Feature"
                      ? [geojson]
                      : [];

                for (const feature of features) {
                  if (feature?.geometry && !cancelled && google && map) {
                    const polygons = createPolygonFromGeoJSON(
                      google,
                      feature.geometry,
                      map,
                    );
                    landPolygons.push(...polygons);
                  }
                }

                if (!cancelled && google && map) {
                  fitMapToBounds(map, google, SF_BBOX);
                }
              })
              .catch((error) => {
                console.warn("Coastline loading failed, continuing without:", error);
              });

            // Draw only task hexagons initially (much faster)
            const maxHexagons = isMobile ? 30 : 100; // Reduced for faster initial load

            const hexagonData = drawFlatToppedHexGrid(
              google!,
              map!,
              SF_BBOX,
              HEX_RADIUS_M,
              [], // Start without coastline mask for speed
              setSelectedTask,
              taskHexagonPolygonsRef,
              maxHexagons,
            );
            setHexagons(hexagonData);

            // Load complete grid lazily after initial render
            (typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : setTimeout)(() => {
              if (cancelled || !google || !map) return;
              drawCompleteHexGrid(
                google,
                map,
                SF_BBOX,
                HEX_RADIUS_M,
                landPolygons,
                completeGridPolygonsRef,
              );
            }, { timeout: 2000 });

            // Load user history in background
            (typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : setTimeout)(() => {
              if (!cancelled) {
                loadVisitedHexagons();
              }
            }, { timeout: 3000 });

            // Wait for coastline to finish
            await coastlinePromise;
          } catch (error) {
            console.error("Error loading map features:", error);
            // Map still works without additional features
          }
        };

        // Start loading features without blocking
        loadFeatures();
      } catch (error) {
        console.error("Error initializing map:", error);
        setMapError(
          "Failed to load map. Please check your internet connection and try again.",
        );
        setMapLoading(false);
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
      // Clean up hexagon polygons
      completeGridPolygonsRef.current.forEach((polygon) =>
        polygon.setMap(null),
      );
      completeGridPolygonsRef.current.clear();
      taskHexagonPolygonsRef.current.forEach((polygon) => polygon.setMap(null));
      taskHexagonPolygonsRef.current.clear();

      mapInstanceRef.current = null;
      googleInstanceRef.current = null;
    };
  }, [isUsernameSet, watchId, startSharing, loadVisitedHexagons, isMobile]);

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
      <input ref={usernameRef} type="hidden" value={username} readOnly />

      {/* Map container */}
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />

      {/* Loading overlay */}
      {mapLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <div className="text-center">
              <div className="mb-4">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Loading Game
              </h3>
              <p className="text-sm text-gray-600 mb-1">{loadingStep}</p>
              <div className="text-xs text-gray-400">
                Please wait while we prepare your map...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {mapError && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4 border-l-4 border-red-500">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Map Loading Failed
              </h3>
              <p className="text-sm text-red-600 mb-4">{mapError}</p>
              <button
                onClick={() => {
                  setMapError(null);
                  setMapLoading(true);
                  window.location.reload();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GPS Error notification */}
      {gpsError && !mapLoading && (
        <div className="absolute top-4 left-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 p-3 rounded shadow-lg z-40">
          <div className="flex items-center">
            <div className="text-yellow-600 mr-2">⚠️</div>
            <div>
              <p className="text-sm text-yellow-800 font-medium">
                Location Issue
              </p>
              <p className="text-xs text-yellow-700">{gpsError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Exploration progress indicator */}
      {!mapLoading && !mapError && visitedHexagons.size > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 z-40">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <div className="text-sm">
              <span className="font-medium text-gray-800">
                {visitedHexagons.size}
              </span>
              <span className="text-gray-600 ml-1">areas explored</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Blue hexagons show where you&apos;ve been
          </div>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
}
