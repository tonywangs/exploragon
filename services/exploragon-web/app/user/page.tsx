"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import mapboxgl from "mapbox-gl";

// San Francisco bounding box roughly (lngMin, latMin, lngMax, latMax)
const SF_BBOX = [-122.5149, 37.7081, -122.3569, 37.8324];

// Hexagon grid configuration
const HEXAGON_SIZE = 0.002; // Adjusted size for pointy-topped hexagons

// Function to generate hexagon vertices around a center point
function generateHexagonVertices(
  centerLng: number,
  centerLat: number,
  size: number,
) {
  const vertices = [];
  // Start at 30 degrees (π/6) for pointy-topped hexagons instead of 0 degrees for flat-topped
  for (let i = 0; i < 6; i++) {
    // Rotate by 60 degrees (π/3) each step, starting at π/6
    const angle = (Math.PI / 6) + (i * Math.PI) / 3;
    const lng = centerLng + size * Math.cos(angle);
    const lat = centerLat + size * Math.sin(angle);
    vertices.push([lng, lat]);
  }
  // Close the polygon by returning to the first vertex
  vertices.push(vertices[0]);
  return vertices;
}

// Function to check if a point is on land (not in the ocean)
// This is a simplified check - in a real app, you would use more accurate data
function isPointOnLand(lng: number, lat: number): boolean {
  // Define a simplified polygon for San Francisco land area
  // These are approximate coordinates that exclude most of the ocean
  const sfLandPolygon = [
    [-122.5149, 37.8080], // Northwest corner
    [-122.3569, 37.8324], // Northeast corner
    [-122.3569, 37.7081], // Southeast corner
    [-122.5149, 37.7081], // Southwest corner
  ];

  // Check if the point is within the bounding box
  const inBoundingBox = 
    lng >= sfLandPolygon[3][0] && lng <= sfLandPolygon[1][0] &&
    lat >= sfLandPolygon[2][1] && lat <= sfLandPolygon[1][1];

  if (!inBoundingBox) return false;

  // Exclude specific water areas (simplified)
  // Golden Gate area
  if (lng < -122.48 && lat > 37.78) return false;

  // Bay area east of the city
  if (lng > -122.38 && lat < 37.81) return false;

  // Ocean Beach area
  if (lng < -122.50) return false;

  return true;
}

// Function to generate hexagon grid centers using offset coordinates
function generateHexagonGrid(bbox: number[], hexSize: number) {
  const [lngMin, latMin, lngMax, latMax] = bbox;
  const hexagons = [];

  // Calculate hexagon spacing for pointy-topped hexagons
  // For pointy-topped hexagons:
  // - Width is 2 * size
  // - Height is sqrt(3) * size
  // - Horizontal spacing between centers is 1.5 * size
  // - Vertical spacing between centers is sqrt(3) * size
  const hexWidth = hexSize * 2;
  const hexHeight = hexSize * Math.sqrt(3);
  const horizontalSpacing = hexSize * 1.5;
  const verticalSpacing = hexHeight;

  let row = 0;
  let currentLat = latMin;

  while (currentLat < latMax) {
    let col = 0;
    let currentLng = lngMin;

    // Offset every other column for pointy-topped hexagon tessellation
    if (row % 2 === 1) {
      currentLng += horizontalSpacing / 2;
    }

    while (currentLng < lngMax) {
      if (
        currentLng >= lngMin &&
        currentLng <= lngMax &&
        currentLat >= latMin &&
        currentLat <= latMax &&
        isPointOnLand(currentLng, currentLat) // Only add hexagons on land
      ) {
        const vertices = generateHexagonVertices(
          currentLng,
          currentLat,
          hexSize,
        );

        // Calculate points based on location - more points for popular areas
        let points = Math.floor(Math.random() * 30) + 10; // Base points
        let task = `Take a selfie at this location and share it!`; // Default task

        // Assign specific tasks and points for popular areas

        // Fisherman's Wharf / Pier 39 area
        if (currentLng > -122.42 && currentLng < -122.40 && 
            currentLat > 37.805 && currentLat < 37.815) {
          points += 50;
          task = `Record a video of yourself doing a sea lion call at Pier 39!`;
        }

        // Golden Gate Park
        else if (currentLng > -122.51 && currentLng < -122.45 && 
            currentLat > 37.765 && currentLat < 37.775) {
          points += 40;
          task = `Find a bison in Golden Gate Park and take a photo with it in the background.`;
        }

        // Downtown / Union Square
        else if (currentLng > -122.41 && currentLng < -122.39 && 
            currentLat > 37.785 && currentLat < 37.795) {
          points += 30;
          task = `Take a photo with the heart sculpture in Union Square.`;
        }

        // Chinatown
        else if (currentLng > -122.41 && currentLng < -122.40 && 
            currentLat > 37.79 && currentLat < 37.80) {
          points += 35;
          task = `Record yourself saying "Hello" in Mandarin at the Dragon Gate.`;
        }

        // Golden Gate Bridge
        else if (currentLng > -122.48 && currentLng < -122.46 && 
            currentLat > 37.80 && currentLat < 37.82) {
          points += 45;
          task = `Take a panoramic photo of the Golden Gate Bridge.`;
        }

        // Alcatraz
        else if (currentLng > -122.43 && currentLng < -122.41 && 
            currentLat > 37.825 && currentLat < 37.83) {
          points += 55;
          task = `Do your best prison break pose with Alcatraz in the background.`;
        }

        // Lombard Street
        else if (currentLng > -122.42 && currentLng < -122.41 && 
            currentLat > 37.80 && currentLat < 37.81) {
          points += 35;
          task = `Take a video walking down the "crookedest street in the world".`;
        }

        // Painted Ladies / Alamo Square
        else if (currentLng > -122.44 && currentLng < -122.43 && 
            currentLat > 37.775 && currentLat < 37.78) {
          points += 30;
          task = `Recreate the Full House opening scene at Alamo Square.`;
        }

        hexagons.push({
          id: `hex-${row}-${col}`,
          center: [currentLng, currentLat],
          vertices: vertices,
          points: points,
          task: task,
          completed: false,
        });
      }

      currentLng += horizontalSpacing; // Proper horizontal spacing for pointy-topped hexagons
      col++;
    }

    currentLat += verticalSpacing * 0.75; // Proper vertical spacing for interlocking hexagons
    row++;
  }

  return hexagons;
}

export default function Home() {
  const mapContainer = useRef<any>(null);
  const map = useRef<mapboxgl.Map | any>(null);
  const [hexagons, setHexagons] = useState<any[]>([]);
  const [selectedHexagon, setSelectedHexagon] = useState<any>(null);

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN!;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-122.43, 37.77], // Centered on San Francisco
      zoom: 13, // Slightly higher zoom to better see the hexagons
      minZoom: 11, // Prevent zooming out too far
      maxZoom: 18, // Allow zooming in for detail
    });

    map.current.on("load", () => {
      // Generate hexagon grid
      const hexagonData = generateHexagonGrid(SF_BBOX, HEXAGON_SIZE);
      setHexagons(hexagonData);

      // Add hexagon source
      map.current.addSource("hexagons", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: hexagonData.map((hex) => ({
            type: "Feature",
            id: hex.id, // Add id at the feature level for feature-state to work
            properties: {
              id: hex.id,
              points: hex.points,
              task: hex.task,
              completed: hex.completed,
            },
            geometry: {
              type: "Polygon",
              coordinates: [hex.vertices],
            },
          })),
        },
      });

      // Add hexagon fill layer
      map.current.addLayer({
        id: "hexagon-fills",
        type: "fill",
        source: "hexagons",
        paint: {
          "fill-color": [
            "case",
            ["get", "completed"],
            "#10b981", // Green for completed
            [
              "interpolate",
              ["linear"],
              ["get", "points"],
              10,
              "#fef3c7", // Light yellow for low points
              50,
              "#fbbf24", // Yellow for medium points
              100,
              "#dc2626", // Red for high points
            ],
          ],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.8, // Higher opacity on hover
            0.65, // Slightly higher base opacity for better visibility
          ],
        },
      });

      // Add hexagon border layer
      map.current.addLayer({
        id: "hexagon-borders",
        type: "line",
        source: "hexagons",
        paint: {
          "line-color": "#374151",
          "line-width": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            3, // Thicker border on hover
            1.5, // Slightly thinner default border
          ],
        },
      });

      // Add hover effect for hexagons
      let hoveredHexagonId = null;

      map.current.on("mousemove", "hexagon-fills", (e) => {
        if (e.features.length > 0) {
          if (hoveredHexagonId !== null) {
            map.current.setFeatureState(
              { source: "hexagons", id: hoveredHexagonId },
              { hover: false }
            );
          }
          hoveredHexagonId = e.features[0].properties.id;
          map.current.setFeatureState(
            { source: "hexagons", id: hoveredHexagonId },
            { hover: true }
          );
        }
      });

      map.current.on("mouseleave", "hexagon-fills", () => {
        if (hoveredHexagonId !== null) {
          map.current.setFeatureState(
            { source: "hexagons", id: hoveredHexagonId },
            { hover: false }
          );
        }
        hoveredHexagonId = null;
      });

      // Add click handler for hexagons
      map.current.on("click", "hexagon-fills", (e: any) => {
        const hexagon = hexagonData.find(
          (hex) => hex.id === e.features[0].properties.id,
        );
        setSelectedHexagon(hexagon);
      });

      // Change cursor on hover
      map.current.on("mouseenter", "hexagon-fills", () => {
        map.current.getCanvas().style.cursor = "pointer";
      });

      map.current.on("mouseleave", "hexagon-fills", () => {
        map.current.getCanvas().style.cursor = "";
      });
    });
  }, []);

  const completeHexagon = (hexagonId: string) => {
    // Update hexagon completion status
    const updatedHexagons = hexagons.map((hex) =>
      hex.id === hexagonId ? { ...hex, completed: true } : hex,
    );
    setHexagons(updatedHexagons);

    // Update map source
    const updatedData = {
      type: "FeatureCollection",
      features: updatedHexagons.map((hex) => ({
        type: "Feature",
        id: hex.id, // Include id at feature level for feature-state
        properties: {
          id: hex.id,
          points: hex.points,
          task: hex.task,
          completed: hex.completed,
        },
        geometry: {
          type: "Polygon",
          coordinates: [hex.vertices],
        },
      })),
    };

    map.current.getSource("hexagons").setData(updatedData);

    // Show a congratulatory message when completing a hexagon
    const completedHex = updatedHexagons.find(hex => hex.id === hexagonId);
    if (completedHex) {
      const pointsEarned = completedHex.points;
      alert(`Congratulations! You earned ${pointsEarned} points for completing this challenge!`);
    }

    setSelectedHexagon(null);
  };

  return (
    <div className="relative h-[100vh]">
      <div ref={mapContainer} className="h-screen w-[100vw]" />

      {/* Hexagon Info Panel */}
      {selectedHexagon && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-sm">
          <h3 className="font-bold text-lg mb-2">Hexagon Challenge</h3>
          <p className="text-sm text-gray-600 mb-2">
            Points:{" "}
            <span className="font-semibold text-blue-600">
              {selectedHexagon.points}
            </span>
          </p>
          <p className="text-sm mb-3">{selectedHexagon.task}</p>
          <div className="flex gap-2">
            {!selectedHexagon.completed ? (
              <>
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  onClick={() => {
                    /* TODO: Open video submission */
                  }}
                >
                  Submit Video
                </button>
                <button
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                  onClick={() => completeHexagon(selectedHexagon.id)}
                >
                  Mark Complete
                </button>
              </>
            ) : (
              <span className="text-green-600 font-semibold">✓ Completed</span>
            )}
            <button
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
              onClick={() => setSelectedHexagon(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Score Display */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg">
        <div className="text-sm text-gray-600">Total Score</div>
        <div className="text-2xl font-bold text-blue-600">
          {hexagons
            .filter((hex) => hex.completed)
            .reduce((sum, hex) => sum + hex.points, 0)}
        </div>
      </div>
    </div>
  );
}
