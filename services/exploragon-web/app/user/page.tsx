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
  fitMapToBounds 
} from "@/lib/map-utils";
import { TaskModal } from "@/lib/components/TaskModal";

export default function GoogleHexGridMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [, setHexagons] = useState<HexagonData[]>([]);

  useEffect(() => {
    let map: google.maps.Map | null = null;
    const landPolygons: google.maps.Polygon[] = [];
    let cancelled = false;

    async function init() {
      const google = await loadGoogleMaps(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "");
      if (cancelled || !mapRef.current) return;

      map = createMap(mapRef.current, google, DEFAULT_CENTER);

      const geojson = await loadGeoJSON("/sf-coastline.geojson") as any;
      const features = geojson?.type === "FeatureCollection" 
        ? (geojson.features ?? []) 
        : geojson?.type === "Feature" 
          ? [geojson] 
          : [];

      for (const feature of features) {
        if (feature?.geometry) {
          const polygons = createPolygonFromGeoJSON(google, feature.geometry, map);
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
    }

    init();

    return () => {
      cancelled = true;
      landPolygons.forEach((p) => p.setMap(null));
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

      <TaskModal 
        task={selectedTask} 
        onClose={() => setSelectedTask(null)} 
      />
    </>
  );
}
