import { BBox } from './types';

export async function loadGoogleMaps(apiKey: string): Promise<typeof window.google> {
  const { Loader } = await import("@googlemaps/js-api-loader");
  
  const loader = new Loader({
    apiKey,
    version: "weekly",
    libraries: ["geometry"],
  });

  return loader.load();
}

export function createMap(
  mapElement: HTMLDivElement,
  google: typeof window.google,
  center: { lat: number; lng: number },
  zoom: number = 12,
): google.maps.Map {
  return new google.maps.Map(mapElement, {
    center,
    zoom,
    mapTypeId: "terrain",
    gestureHandling: "greedy",
    streetViewControl: false,
    fullscreenControl: false,
  });
}

export async function loadGeoJSON(url: string): Promise<unknown> {
  const response = await fetch(url);
  return response.json();
}

interface GeoJSONGeometry {
  type: string;
  coordinates: number[][][] | number[][][][];
}

export function createPolygonFromGeoJSON(
  google: typeof window.google,
  geometry: GeoJSONGeometry,
  map: google.maps.Map,
): google.maps.Polygon[] {
  const polygons: google.maps.Polygon[] = [];
  
  const toLatLngs = (ring: number[][]) =>
    ring.map(([lng, lat]) => ({ lat, lng }));

  const polygonOptions = {
    strokeColor: "#0b7285",
    strokeOpacity: 0.6,
    strokeWeight: 1,
    fillColor: "#74c0fc",
    fillOpacity: 0.08,
    geodesic: true,
    map,
  };

  if (geometry.type === "Polygon") {
    const rings = geometry.coordinates as number[][][];
    const paths = rings.map(toLatLngs);
    polygons.push(new google.maps.Polygon({ ...polygonOptions, paths }));
  } else if (geometry.type === "MultiPolygon") {
    const polys = geometry.coordinates as number[][][][];
    for (const rings of polys) {
      const paths = rings.map(toLatLngs);
      polygons.push(new google.maps.Polygon({ ...polygonOptions, paths }));
    }
  }

  return polygons;
}

export function fitMapToBounds(
  map: google.maps.Map,
  google: typeof window.google,
  bbox: BBox,
): void {
  const bounds = new google.maps.LatLngBounds(
    { lat: bbox[1], lng: bbox[0] },
    { lat: bbox[3], lng: bbox[2] },
  );
  map.fitBounds(bounds);
}