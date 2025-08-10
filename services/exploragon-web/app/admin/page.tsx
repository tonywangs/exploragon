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

        history.forEach((record) => {
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
          <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md border border-slate-700/50 shadow-2xl rounded-2xl p-5 transition-all duration-300 hover:shadow-cyan-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-lg">
                  {selectedPlayerName}&apos;s History
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <p className="text-sm text-slate-300">
                    {selectedPlayerHistory?.length || 0} data points
                  </p>
                </div>
              </div>
              <button
                onClick={clearPlayerHistory}
                className="ml-4 px-4 py-2 bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 rounded-xl text-red-300 text-sm font-medium transition-all duration-200 hover:scale-105"
              >
                Clear
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2" style={{ color: generatePlayerColor(selectedPlayerName) }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: generatePlayerColor(selectedPlayerName) }}></div>
                <span className="text-xs font-medium">Movement path and exploration area</span>
              </div>
              <div className="text-slate-400 text-xs pl-5">
                Enable &quot;Show Complete Grid&quot; to see all explored hexagons
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid toggle control */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md border border-slate-700/50 shadow-2xl rounded-2xl p-4 transition-all duration-300 hover:shadow-cyan-500/20">
          <label className="flex items-center gap-3 text-sm cursor-pointer group">
            <div className="relative">
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
                className="sr-only"
              />
              <div className={`w-12 h-6 rounded-full border-2 transition-all duration-300 ${showCompleteGrid ? 'bg-gradient-to-r from-cyan-500 to-blue-500 border-cyan-400' : 'bg-slate-700 border-slate-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${showCompleteGrid ? 'translate-x-6' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </div>
            <span className="text-slate-200 font-medium group-hover:text-cyan-300 transition-colors duration-200">Show Complete Grid</span>
          </label>
          <div className="text-xs text-slate-400 mt-2 pl-15">
            View all hexagons where players can move
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="absolute bottom-4 right-4 z-10 w-80 max-h-96">
        <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md border border-slate-700/50 shadow-2xl rounded-2xl p-5 transition-all duration-300 hover:shadow-cyan-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-pulse"></div>
              <h3 className="font-bold text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-lg">
                Exploration Leaderboard
              </h3>
            </div>
            <div className="px-3 py-1 bg-slate-800/80 border border-slate-600/50 rounded-full">
              <div className="text-xs text-cyan-300 font-mono">
                LIVE • 5s
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-800/50 border border-slate-600/30 rounded-xl p-3">
              <div className="text-xs text-slate-400 uppercase tracking-wide">Total Players</div>
              <div className="text-xl font-bold text-cyan-300 font-mono">{leaderboardStats.totalUsers}</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-600/30 rounded-xl p-3">
              <div className="text-xs text-slate-400 uppercase tracking-wide">Active Areas</div>
              <div className="text-xl font-bold text-blue-300 font-mono">{leaderboardStats.totalUniqueHexagons}</div>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
            {leaderboard.map((entry, index) => (
              <div 
                key={entry.username}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-800/60 to-slate-700/60 hover:from-slate-700/80 hover:to-slate-600/80 border border-slate-600/30 hover:border-cyan-500/30 p-3 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-lg"
                onClick={() => {
                  // Clear any existing history first
                  clearPlayerHistory();
                  // Show this player's history by calling the existing function
                  const map = (mapRef.current as any)?._map;
                  if (window.google && map) {
                    showPlayerHistory(entry.username, window.google, map);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900' :
                      index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-gray-800' :
                      index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-800 text-amber-100' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <div 
                        className="font-bold text-sm group-hover:text-cyan-300 transition-colors duration-200"
                        style={{ color: generatePlayerColor(entry.username) }}
                      >
                        {entry.username}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {entry.lastActive ? 
                          `${new Date(entry.lastActive).toLocaleDateString()}` : 
                          'INACTIVE'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-cyan-300 font-mono">
                      {entry.hexagonsExplored}
                    </div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">areas</div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-8">
                <div className="w-12 h-12 bg-slate-700 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-slate-500 border-t-cyan-400 rounded-full animate-spin"></div>
                </div>
                Scanning for players...
              </div>
            )}
          </div>
        </div>
      </div>

      <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </>
  );
}
