"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import mapboxgl from "mapbox-gl";

// San Francisco bounding box roughly (lngMin, latMin, lngMax, latMax)
const SF_BBOX = [-122.5149, 37.7081, -122.3569, 37.8324];

export default function Home() {
  const mapContainer = useRef<any>(null);
  const map = useRef<mapboxgl.Map | any>(null);

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN!;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-122.44, 37.76],
      zoom: 12,
    });
  }, []);

  return (
    <div id="map" className="h-[100vh]">
      <div ref={mapContainer} className="h-screen w-[100vw]" />
    </div>
  );
}
