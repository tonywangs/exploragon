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

interface LeaderboardEntry {
  username: string;
  hexagonsExplored: number;
  lastActive: string | null;
  totalPoints: number;
}
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardStats, setLeaderboardStats] = useState<{
    totalUsers: number;
    totalUniqueHexagons: number;
  }>({ totalUsers: 0, totalUniqueHexagons: 0 });

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

        // Create simplified path with only start and end markers
        const pathCoords: google.maps.LatLng[] = [];
        const visitedHexagons = new Set<string>();

        history.forEach((record: UserLocationHistoryRecord) => {
          pathCoords.push(
            new google.maps.LatLng(
              record.coords.latitude,
              record.coords.longitude,
            ),
          );

          // Find and collect unique hexagons for highlighting
          const hexCoord = findHexagonForCoordinate(
            google,
            { lat: record.coords.latitude, lng: record.coords.longitude },
            SF_BBOX,
            HEX_RADIUS_M,
          );

          if (hexCoord) {
            visitedHexagons.add(`${hexCoord.row}-${hexCoord.col}`);
          }
        });

        // Highlight all visited hexagons
        visitedHexagons.forEach((hexKey) => {
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
        });

        // Create only start and end markers for better performance
        if (pathCoords.length > 0) {
          // Start marker
          const startMarker = new google.maps.Marker({
            position: pathCoords[0],
            map,
            title: `${username} - Journey Start`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: playerColor,
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            },
            zIndex: 2000,
          });
          historyMarkersRef.current.push(startMarker);

          // End marker (if different from start)
          if (pathCoords.length > 1) {
            const endMarker = new google.maps.Marker({
              position: pathCoords[pathCoords.length - 1],
              map,
              title: `${username} - Current Position`,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: playerColor,
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3,
              },
              zIndex: 2001,
            });
            historyMarkersRef.current.push(endMarker);
          }

          // Draw simplified path
          historyPathRef.current = new google.maps.Polyline({
            path: pathCoords,
            geodesic: true,
            strokeColor: playerColor,
            strokeOpacity: 0.7,
            strokeWeight: 3,
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
    let leaderboardInterval: NodeJS.Timeout;

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

      // Fetch leaderboard initially and then every 5 seconds
      const fetchLeaderboard = async () => {
        try {
          const response = await fetch('/api/leaderboard');
          const data = await response.json();
          if (data.ok) {
            setLeaderboard(data.leaderboard);
            setLeaderboardStats({
              totalUsers: data.totalUsers,
              totalUniqueHexagons: data.totalUniqueHexagons
            });
          }
        } catch (error) {
          console.error('Failed to fetch leaderboard:', error);
        }
      };

      fetchLeaderboard();
      const leaderboardInterval = setInterval(fetchLeaderboard, 5000);
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
        <div className="absolute top-4 left-4 z-10 max-w-sm">
          <div className="terminal-container">
            <div className="terminal-header">
              <div className="terminal-dots"></div>
              <span className="text-accent-primary">player_trace.sh</span>
              <button
                onClick={clearPlayerHistory}
                className="ml-auto text-xs text-accent-secondary hover:text-text-primary transition-colors"
              >
                [X]
              </button>
            </div>
            
            <div className="p-4">
              <div className="command-prompt mb-3">
                ./trace_user.sh {selectedPlayerName}
              </div>
              
              <div className="pl-4 space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-accent-secondary">USER:</span>
                  <span className="text-accent-primary font-semibold">{selectedPlayerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent-secondary">DATAPOINTS:</span>
                  <span className="text-terminal-primary">{selectedPlayerHistory?.length || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent-secondary">PATH_COLOR:</span>
                  <div 
                    className="w-3 h-3 rounded border border-accent-primary/50" 
                    style={{ backgroundColor: generatePlayerColor(selectedPlayerName) }}
                  ></div>
                </div>
                <div className="text-terminal-secondary text-xs pt-2 border-t border-accent-primary/20">
                  Movement path and hexagon exploration areas now visible on map
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid toggle control */}
      <div className="absolute top-4 right-4 z-10">
        <div className="terminal-container">
          <div className="terminal-header">
            <div className="terminal-dots"></div>
            <span className="text-accent-primary">grid_toggle.sh</span>
          </div>
          
          <div className="p-4">
            <div className="command-prompt mb-3">
              ./toggle_hex_grid.sh
            </div>
            
            <div className="pl-4">
              <label className="flex items-center gap-3 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCompleteGrid}
                  onChange={(e) => {
                    setShowCompleteGrid(e.target.checked);
                    completeGridPolygonsRef.current.forEach((polygon) => {
                      polygon.setVisible(e.target.checked);
                    });
                  }}
                  className="sr-only"
                />
                <div className={`relative w-8 h-4 rounded border transition-all duration-300 ${
                  showCompleteGrid 
                    ? 'bg-accent-primary border-accent-primary' 
                    : 'bg-terminal-primary border-accent-primary/30'
                }`}>
                  <div className={`absolute w-2 h-2 bg-terminal-primary rounded-full top-0.5 transition-transform duration-300 ${
                    showCompleteGrid ? 'translate-x-4' : 'translate-x-0.5'
                  }`}></div>
                </div>
                <span className={`transition-colors duration-200 ${
                  showCompleteGrid ? 'text-accent-primary' : 'text-terminal-secondary'
                }`}>
                  COMPLETE_GRID: {showCompleteGrid ? 'ON' : 'OFF'}
                </span>
              </label>
              <div className="text-terminal-secondary text-xs mt-2 opacity-70">
                Show all navigable hexagon areas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Leaderboard */}
      <div className="absolute bottom-4 right-4 z-10 w-80" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
        <div className="terminal-container h-full flex flex-col">
          <div className="terminal-header">
            <div className="terminal-dots"></div>
            <span className="text-accent-primary">leaderboard.sh</span>
            <div className="ml-auto text-xs text-terminal-secondary status-online">LIVE</div>
          </div>
          
          <div className="p-4 flex-1 flex flex-col">
            <div className="command-prompt mb-4">
              ./get_player_stats.sh --realtime
            </div>
            
            <div className="pl-4 space-y-4 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-terminal-secondary border border-accent-primary/20 rounded p-2">
                  <div className="text-accent-secondary">ACTIVE_USERS:</div>
                  <div className="text-accent-primary font-mono text-lg">{leaderboardStats.totalUsers.toString().padStart(3, '0')}</div>
                </div>
                <div className="bg-terminal-secondary border border-accent-primary/20 rounded p-2">
                  <div className="text-accent-secondary">HEXAGONS:</div>
                  <div className="text-accent-primary font-mono text-lg">{leaderboardStats.totalUniqueHexagons.toString().padStart(3, '0')}</div>
                </div>
              </div>
              
              <div className="text-accent-secondary text-xs mb-2">RANKING_TABLE:</div>

              <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs min-h-0">
                {leaderboard.map((entry, index) => (
                  <div 
                    key={entry.username}
                    className="group relative p-2 border border-accent-primary/20 rounded hover:border-accent-primary/40 bg-terminal-secondary/50 cursor-pointer transition-all duration-200 hover:bg-accent-primary/5"
                    onClick={() => {
                      clearPlayerHistory();
                      const map = (mapRef.current as any)?._map;
                      if (window.google && map) {
                        showPlayerHistory(entry.username, window.google, map);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                          index === 0 ? 'bg-accent-primary text-terminal-primary' :
                          index === 1 ? 'bg-accent-secondary text-terminal-primary' :
                          index === 2 ? 'bg-terminal-secondary text-accent-primary border border-accent-primary' :
                          'bg-terminal-primary text-terminal-secondary border border-accent-primary/30'
                        }`}>
                          {(index + 1).toString().padStart(2, '0')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div 
                            className="font-semibold text-xs truncate group-hover:text-accent-primary transition-colors"
                            style={{ color: generatePlayerColor(entry.username) }}
                          >
                            {entry.username}
                          </div>
                          <div className="text-terminal-secondary text-xs opacity-70">
                            {entry.lastActive ? 
                              new Date(entry.lastActive).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : 
                              'OFFLINE'
                            }
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-accent-primary font-bold">
                          {entry.hexagonsExplored.toString().padStart(3, '0')}
                        </div>
                        <div className="text-terminal-secondary text-xs">hex</div>
                      </div>
                    </div>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <div className="text-center text-terminal-secondary py-6">
                    <div className="loading-spinner mx-auto mb-3"></div>
                    <div className="text-xs">scanning_for_active_users...</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} userLocation={null} />
    </>
  );
}
