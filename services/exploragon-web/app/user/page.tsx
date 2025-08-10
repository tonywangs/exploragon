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
  const [currentLocation, setCurrentLocation] = useState<Coords | null>(null);
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
            scale: 15,
            fillColor: "#10b981",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 5,
          },
          animation: google.maps.Animation.BOUNCE,
          zIndex: 1000,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="font-weight: bold; color: #10b981;">${username} (You)</div>`,
        });

        userMarkerRef.current.addListener("click", () => {
          infoWindow.open(map, userMarkerRef.current);
        });

        // Pan to user's location when marker is first created
        map.panTo({ lat: coords.latitude, lng: coords.longitude });
        
        // Stop bouncing after 3 seconds
        setTimeout(() => {
          if (userMarkerRef.current) {
            userMarkerRef.current.setAnimation(null);
          }
        }, 3000);
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
            setCurrentLocation(coords);
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

  // Simple map initialization copied from admin page
  useEffect(() => {
    if (!isUsernameSet) return;

    let map: google.maps.Map | null = null;
    const landPolygons: google.maps.Polygon[] = [];
    let cancelled = false;

    async function init() {
      try {
        setLoadingStep("Loading Google Maps...");
        const google = await loadGoogleMaps(
          process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        );
        if (cancelled || !mapRef.current) return;

        setLoadingStep("Creating map...");
        map = createMap(mapRef.current, google, DEFAULT_CENTER, 12, isMobile);
        mapInstanceRef.current = map;
        googleInstanceRef.current = google;

        setLoadingStep("Loading coastline...");
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

        setLoadingStep("Drawing hexagons...");
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

        // Load user history
        loadVisitedHexagons();

        setMapLoading(false);
        
        // Create initial user marker at default center
        const defaultCoords: Coords = {
          latitude: DEFAULT_CENTER.lat,
          longitude: DEFAULT_CENTER.lng
        };
        updateUserMarker(defaultCoords, map, google);
        
        // Start location sharing
        if (!watchId) {
          startSharing(map, google);
        }
      } catch (error) {
        console.error("Error initializing map:", error);
        setMapError(
          "Failed to load map. Please check your internet connection and try again.",
        );
        setMapLoading(false);
      }
    }

    init();

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
      <div className="min-h-screen bg-terminal-primary flex flex-col items-center justify-center gap-8 p-6">
        <div className="matrix-bg"></div>
        
        <div className="relative z-10 max-w-2xl w-full">
          {/* Login */}
          <div className="animate-fadeInUp space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold text-accent-primary">Welcome to Exploragon</h1>
              <div className="text-terminal-secondary">
                Ready to explore San Francisco? Enter your username to begin.
              </div>
            </div>
            
            <div className="space-y-4 max-w-sm mx-auto">
              <input
                ref={usernameInputRef}
                type="text"
                placeholder="Enter your username"
                className="terminal-input w-full text-center"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUsernameSubmit();
                  }
                }}
              />
              
              <button
                className="terminal-button-primary w-full"
                onClick={handleUsernameSubmit}
              >
                ► START EXPLORING
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-xs max-w-xs mx-auto">
              <div className="flex flex-col items-center gap-1">
                <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse"></div>
                <span className="text-terminal-secondary">GPS</span>
                <span className="status-online text-xs">ONLINE</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-2 h-2 bg-accent-secondary rounded-full animate-pulse"></div>
                <span className="text-terminal-secondary">AI</span>
                <span className="status-online text-xs">READY</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse"></div>
                <span className="text-terminal-secondary">NET</span>
                <span className="status-online text-xs">CONNECTED</span>
              </div>
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
        <div className="absolute inset-0 modal-overlay flex items-center justify-center z-50">
          <div className="terminal-container max-w-sm mx-4">
            <div className="terminal-header">
              <div className="terminal-dots"></div>
              <span className="text-accent-primary">map_loader.sh</span>
            </div>
            
            <div className="p-6 text-center">
              <div className="command-prompt mb-4">
                ./initialize_map_data.sh
              </div>
              
              <div className="pl-4 space-y-4">
                <div className="loading-spinner mx-auto"></div>
                
                <div className="text-accent-primary text-sm">
                  LOADING_MAP_SYSTEM
                </div>
                <div className="text-terminal-secondary text-xs">
                  {loadingStep}
                </div>
                
                <div className="flex justify-center gap-2 mt-4">
                  <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-accent-secondary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {mapError && (
        <div className="absolute inset-0 modal-overlay flex items-center justify-center z-50">
          <div className="terminal-container max-w-sm mx-4">
            <div className="terminal-header">
              <div className="terminal-dots"></div>
              <span className="text-accent-secondary">error_handler.sh</span>
            </div>
            
            <div className="p-6">
              <div className="command-prompt mb-4">
                ./diagnose_system_error.sh
              </div>
              
              <div className="pl-4 space-y-4">
                <div className="text-accent-secondary text-sm font-bold">
                  [ERROR] MAP_LOADING_FAILED
                </div>
                <div className="text-terminal-secondary text-xs">
                  {mapError}
                </div>
                
                <div className="border-t border-accent-primary/20 pt-4">
                  <button
                    onClick={() => {
                      setMapError(null);
                      setMapLoading(true);
                      window.location.reload();
                    }}
                    className="terminal-button w-full"
                  >
                    [R] RETRY_CONNECTION
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GPS Error notification */}
      {gpsError && !mapLoading && (
        <div className="absolute top-6 left-6 right-6 z-40">
          <div className="terminal-container">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-accent-secondary">[WARN]</div>
                <div className="flex-1">
                  <div className="text-accent-secondary text-sm font-semibold">
                    GPS_ACCESS_ERROR
                  </div>
                  <div className="text-terminal-secondary text-xs">
                    {gpsError}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exploration progress indicator */}
      {!mapLoading && !mapError && visitedHexagons.size > 0 && (
        <div className="absolute bottom-6 left-6 z-40">
          <div className="terminal-container">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-accent-primary">[GPS]</div>
                <div>
                  <div className="text-sm">
                    <span className="text-accent-primary font-mono font-bold">
                      {visitedHexagons.size.toString().padStart(3, '0')}
                    </span>
                    <span className="text-terminal-secondary ml-2">hexagons_explored</span>
                  </div>
                  <div className="text-terminal-secondary text-xs opacity-70">
                    tracking active • position logged
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal 
        task={selectedTask} 
        onClose={() => setSelectedTask(null)} 
        userLocation={currentLocation}
      />
    </div>
  );
}
