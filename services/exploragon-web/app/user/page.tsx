"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

type BBox = [lngMin: number, latMin: number, lngMax: number, latMax: number];

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  location: string;
  difficulty: "easy" | "medium" | "hard";
  coordinates: { lat: number; lng: number };
}

interface HexagonData {
  id: string;
  center: { lat: number; lng: number };
  task?: Task;
  completed?: boolean;
}

// San Francisco bounding box (approx)
const SF_BBOX: BBox = [-122.5149, 37.7081, -122.3569, 37.8324];

// Hex configuration
const HEX_RADIUS_M = 100; // meters
const DX = 1.73 * HEX_RADIUS_M; // horizontal spacing for flat-topped
const DY = Math.sqrt(2.25) * HEX_RADIUS_M; // vertical spacing

// Initial map center
const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 };

// Helper function to create a task at specific coordinates
function createTask(
  id: string,
  title: string,
  description: string,
  location: string,
  points: number,
  difficulty: "easy" | "medium" | "hard",
  lat: number,
  lng: number,
): Task {
  return {
    id,
    title,
    description,
    points,
    location,
    difficulty,
    coordinates: { lat, lng },
  };
}

// Tasks with specific coordinates - these will be automatically assigned to the correct hexagons
// Use createTask() helper function to easily add new tasks by coordinates
const TASKS_BY_LOCATION: Task[] = [
  createTask(
    "ggp-bison-1",
    "Photo with the Bisons",
    "Take a selfie with the American bison paddock in the background",
    "Bison Paddock",
    25,
    "easy",
    37.7705,
    -122.4923,
  ),
  createTask(
    "ggp-windmill-1",
    "Dutch Windmill Challenge",
    "Do a traditional Dutch dance pose in front of the Dutch Windmill",
    "Dutch Windmill",
    30,
    "medium",
    37.7713,
    -122.5103,
  ),
  createTask(
    "ggp-japanese-1",
    "Tea Garden Meditation",
    "Record a 30-second meditation video at the Japanese Tea Garden entrance",
    "Japanese Tea Garden",
    35,
    "medium",
    37.7701,
    -122.47,
  ),
  createTask(
    "ggp-carousel-1",
    "Carousel Excitement",
    "Capture your best excited face while riding the historic carousel",
    "Koret Children's Quarter",
    20,
    "easy",
    37.7687,
    -122.4569,
  ),
  createTask(
    "ggp-conservatory-1",
    "Botanical Beauty",
    "Take a creative photo showcasing the Conservatory of Flowers architecture",
    "Conservatory of Flowers",
    40,
    "hard",
    37.7735,
    -122.4606,
  ),
  createTask(
    "ggp-haight-1",
    "Hippie Spirit",
    "Strike a peace sign pose near the Haight-Ashbury entrance to the park",
    "Haight Street Entrance",
    15,
    "easy",
    37.7697,
    -122.4545,
  ),
  createTask(
    "pier39-sealions",
    "Sea Lion Impression",
    "Do your best sea lion bark and pose at Pier 39",
    "Pier 39",
    45,
    "medium",
    37.8087,
    -122.4098,
  ),
  createTask(
    "lombard-street",
    "Crookedest Street Photo",
    "Take a creative photo on the famous winding Lombard Street",
    "Lombard Street",
    35,
    "hard",
    37.8021,
    -122.4187,
  ),
];

// Function to find which hexagon contains a given coordinate
function findHexagonForCoordinate(
  google: typeof window.google,
  coord: { lat: number; lng: number },
  bbox: BBox,
  radiusM: number,
): { row: number; col: number } | null {
  const spherical = google.maps.geometry.spherical;
  const sw = new google.maps.LatLng(bbox[1], bbox[0]);
  const target = new google.maps.LatLng(coord.lat, coord.lng);

  let row = 0;
  const latMax = bbox[3];
  const lngMax = bbox[2];

  for (;;) {
    const rowOrigin = spherical.computeOffset(sw, row * DY, 0);
    if (rowOrigin.lat() > latMax) break;

    const rowOffsetM = row % 2 === 0 ? 0 : DX / 2;
    let col = 0;

    for (;;) {
      const baseEastM = rowOffsetM + col * DX;
      const center = spherical.computeOffset(rowOrigin, baseEastM, 90);
      if (center.lng() > lngMax) break;

      // Check if the target coordinate is within this hexagon's radius
      const distance = spherical.computeDistanceBetween(center, target);
      if (distance <= radiusM) {
        return { row, col };
      }

      col += 1;
    }
    row += 1;
  }

  return null;
}

export default function GoogleHexGridMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [hexagons, setHexagons] = useState<HexagonData[]>([]);

  useEffect(() => {
    let map: google.maps.Map | null = null;
    let landPolygons: google.maps.Polygon[] = [];

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      version: "weekly",
      libraries: ["geometry"], // for spherical + poly utilities
    });

    let cancelled = false;

    async function init() {
      const google = await loader.load();
      if (cancelled || !mapRef.current) return;

      map = new google.maps.Map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: 12,
        mapTypeId: "terrain",
        gestureHandling: "greedy",
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Load and build polygons (one per polygon/sub-polygon)
      const geojson = await fetch("/sf-coastline.geojson").then((r) =>
        r.json(),
      );
      const features: any[] =
        geojson?.type === "FeatureCollection"
          ? (geojson.features ?? [])
          : geojson?.type === "Feature"
            ? [geojson]
            : [];

      const toLatLngs = (ring: number[][]) =>
        ring.map(([lng, lat]) => ({ lat, lng }));

      for (const f of features) {
        const g = f?.geometry;
        if (!g || !g.type || !g.coordinates) continue;

        if (g.type === "Polygon") {
          // One polygon with possibly inner holes
          const rings: number[][][] = g.coordinates;
          const paths = rings.map(toLatLngs);
          landPolygons.push(
            new google.maps.Polygon({
              paths,
              strokeColor: "#0b7285",
              strokeOpacity: 0.6,
              strokeWeight: 1,
              fillColor: "#74c0fc",
              fillOpacity: 0.08,
              geodesic: true,
              map,
            }),
          );
        } else if (g.type === "MultiPolygon") {
          // Multiple polygons (each can have holes)
          const polys: number[][][][] = g.coordinates;
          for (const rings of polys) {
            const paths = rings.map(toLatLngs);
            landPolygons.push(
              new google.maps.Polygon({
                paths,
                strokeColor: "#0b7285",
                strokeOpacity: 0.6,
                strokeWeight: 1,
                fillColor: "#74c0fc",
                fillOpacity: 0.08,
                geodesic: true,
                map,
              }),
            );
          }
        }
      }

      // Fit map to bbox
      const bounds = new google.maps.LatLngBounds(
        { lat: SF_BBOX[1], lng: SF_BBOX[0] },
        { lat: SF_BBOX[3], lng: SF_BBOX[2] },
      );
      map.fitBounds(bounds);

      // Draw the hex grid, clipping to union of all polygons
      const hexagonData = drawFlatToppedHexGrid(
        google,
        map,
        SF_BBOX,
        HEX_RADIUS_M,
        landPolygons,
        setSelectedTask,
      );
      setHexagons(hexagonData);
    }

    init();

    return () => {
      cancelled = true;
      map = null;
      // remove polygons if needed
      landPolygons.forEach((p) => p.setMap(null));
      landPolygons = [];
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

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedTask.title}
              </h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <span
                className={`inline-block px-2 py-1 rounded text-sm ${
                  selectedTask.difficulty === "easy"
                    ? "bg-green-100 text-green-800"
                    : selectedTask.difficulty === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {selectedTask.difficulty.charAt(0).toUpperCase() +
                  selectedTask.difficulty.slice(1)}
              </span>
              <span className="ml-2 font-semibold text-blue-600">
                {selectedTask.points} points
              </span>
            </div>

            <p className="text-gray-600 mb-3">{selectedTask.description}</p>
            <p className="text-sm text-gray-500 mb-4">
              📍 {selectedTask.location}
            </p>

            <div className="flex gap-2">
              <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
                Start Challenge
              </button>
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Draw a flat-topped hex grid over the given bbox, clipping to any of the polygons.
 */
function drawFlatToppedHexGrid(
  google: typeof window.google,
  map: google.maps.Map,
  bbox: BBox,
  radiusM: number,
  maskPolys: google.maps.Polygon[] | null,
  onHexClick: (task: Task) => void,
): HexagonData[] {
  const spherical = google.maps.geometry.spherical;

  const sw = new google.maps.LatLng(bbox[1], bbox[0]);
  const latMax = bbox[3];
  const lngMax = bbox[2];

  const isInsideAny = (pt: google.maps.LatLng) => {
    if (!maskPolys || maskPolys.length === 0) return true;
    return maskPolys.some((poly) =>
      google.maps.geometry.poly.containsLocation(pt, poly),
    );
  };

  // Precompute hex vertex bearings for flat-topped hex (0°, 60°, 120°, ...)
  const bearings = [0, 60, 120, 180, 240, 300];
  const hexagonData: HexagonData[] = [];

  // Create a map to store tasks by their hexagon coordinates
  const tasksByHexagon = new Map<string, Task>();

  // First pass: find hexagon coordinates for each task
  for (const task of TASKS_BY_LOCATION) {
    const hexCoord = findHexagonForCoordinate(
      google,
      task.coordinates,
      bbox,
      radiusM,
    );
    if (hexCoord) {
      const hexKey = `${hexCoord.row}-${hexCoord.col}`;
      tasksByHexagon.set(hexKey, task);
    }
  }

  // Second pass: only create hexagons that have tasks
  let row = 0;
  // Start at south-west corner
  for (;;) {
    // Move north by row * DY
    const rowOrigin = spherical.computeOffset(sw, row * DY, 0);
    if (rowOrigin.lat() > latMax) break;

    // Horizontal offset for every other row (staggered grid)
    const rowOffsetM = row % 2 === 0 ? 0 : DX / 2;

    // Now step east across the row
    let col = 0;
    for (;;) {
      const baseEastM = rowOffsetM + col * DX;
      const center = spherical.computeOffset(rowOrigin, baseEastM, 90);
      if (center.lng() > lngMax) break;

      if (isInsideAny(center)) {
        // Check if this hexagon has a task
        const hexKey = `${row}-${col}`;
        const task = tasksByHexagon.get(hexKey);

        // Only create hexagons that have tasks
        if (task) {
          // Build hexagon vertices around this center
          const path = bearings.map((bearing) =>
            spherical.computeOffset(center, radiusM, bearing),
          );

          // Create hexagon data
          const hexData: HexagonData = {
            id: `hex-${row}-${col}`,
            center: { lat: center.lat(), lng: center.lng() },
            task,
            completed: false,
          };
          hexagonData.push(hexData);

          // Style hexagons with tasks
          const strokeColor = "#dc2626";
          const fillColor = "#fca5a5";
          const fillOpacity = 0.3;

          const polygon = new google.maps.Polygon({
            paths: path,
            strokeColor,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor,
            fillOpacity,
            clickable: true,
            map,
          });

          // Add click handler
          polygon.addListener("click", () => {
            onHexClick(task);
          });
        }
      }

      col += 1;
    }

    row += 1;
  }

  return hexagonData;
}
