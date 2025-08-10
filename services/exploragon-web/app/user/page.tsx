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
    () => typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
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
            setTimeout(() => {
              if (cancelled || !google || !map) return;
              drawCompleteHexGrid(
                google,
                map,
                SF_BBOX,
                HEX_RADIUS_M,
                landPolygons,
                completeGridPolygonsRef,
              );
            }, 2000);

            // Load user history in background
            setTimeout(() => {
              if (!cancelled) {
                loadVisitedHexagons();
              }
            }, 3000);

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
      <div className="min-h-screen bg-slate-900 hex-pattern flex flex-col items-center justify-center gap-8 p-6">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
        
        <div className="relative z-10 text-center space-y-6">
          {/* Logo and Title */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <svg className="w-9 h-9 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Welcome to 
                <span className="block bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Exploragon
                </span>
              </h1>
              <p className="text-lg text-slate-400">Choose a username to start your San Francisco adventure</p>
            </div>
          </div>

          {/* Username Form */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 w-full max-w-md mx-auto shadow-2xl">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300 text-left">
                  Explorer Username
                </label>
                <input
                  ref={usernameInputRef}
                  type="text"
                  placeholder="Enter your explorer name"
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUsernameSubmit();
                    }
                  }}
                />
              </div>
              <button
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] flex items-center justify-center gap-2"
                onClick={handleUsernameSubmit}
              >
                <span>Start Exploring</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
            <div className="bg-slate-800/30 backdrop-blur-lg border border-slate-700/30 rounded-xl p-4 text-center">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <h3 className="text-white font-medium text-sm">Interactive Map</h3>
              <p className="text-slate-400 text-xs mt-1">Hexagon-based exploration</p>
            </div>
            
            <div className="bg-slate-800/30 backdrop-blur-lg border border-slate-700/30 rounded-xl p-4 text-center">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </div>
              <h3 className="text-white font-medium text-sm">Photo Challenges</h3>
              <p className="text-slate-400 text-xs mt-1">AI-verified submissions</p>
            </div>
            
            <div className="bg-slate-800/30 backdrop-blur-lg border border-slate-700/30 rounded-xl p-4 text-center">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-white font-medium text-sm">Earn Points</h3>
              <p className="text-slate-400 text-xs mt-1">Climb the leaderboard</p>
            </div>
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
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-sm mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin mx-auto"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Loading Game
              </h3>
              <p className="text-slate-300 mb-2">{loadingStep}</p>
              <div className="text-xs text-slate-500">
                Preparing your San Francisco adventure...
              </div>
              
              {/* Progress indicators */}
              <div className="flex justify-center gap-2 mt-4">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {mapError && (
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 max-w-sm mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Map Loading Failed
              </h3>
              <p className="text-slate-300 mb-6">{mapError}</p>
              <button
                onClick={() => {
                  setMapError(null);
                  setMapLoading(true);
                  window.location.reload();
                }}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:scale-105"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GPS Error notification */}
      {gpsError && !mapLoading && (
        <div className="absolute top-6 left-6 right-6 bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-4 shadow-lg z-40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-yellow-300 font-medium">
                Location Access Issue
              </p>
              <p className="text-xs text-yellow-400/80">{gpsError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Exploration progress indicator */}
      {!mapLoading && !mapError && visitedHexagons.size > 0 && (
        <div className="absolute bottom-6 left-6 bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 shadow-lg z-40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <div className="text-sm">
                <span className="font-semibold text-white">
                  {visitedHexagons.size}
                </span>
                <span className="text-slate-300 ml-1">areas explored</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Blue hexagons show your journey
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
}
