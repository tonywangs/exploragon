import { BBox, Task, HexagonData } from "./types";
import { DX, DY } from "./constants";
import { TASKS_BY_LOCATION } from "./tasks";

export function findHexagonForCoordinate(
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

export function drawFlatToppedHexGrid(
  google: typeof window.google,
  map: google.maps.Map,
  bbox: BBox,
  radiusM: number,
  maskPolys: google.maps.Polygon[] | null,
  onHexClick: (task: Task) => void,
  hexagonPolygonsRef?: React.MutableRefObject<Map<string, google.maps.Polygon>>,
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

  const bearings = [0, 60, 120, 180, 240, 300];
  const hexagonData: HexagonData[] = [];

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
  for (;;) {
    const rowOrigin = spherical.computeOffset(sw, row * DY, 0);
    if (rowOrigin.lat() > latMax) break;

    const rowOffsetM = row % 2 === 0 ? 0 : DX / 2;

    let col = 0;
    for (;;) {
      const baseEastM = rowOffsetM + col * DX;
      const center = spherical.computeOffset(rowOrigin, baseEastM, 90);
      if (center.lng() > lngMax) break;

      if (isInsideAny(center)) {
        const hexKey = `${row}-${col}`;
        const task = tasksByHexagon.get(hexKey);

        if (task) {
          const path = bearings.map((bearing) =>
            spherical.computeOffset(center, radiusM, bearing),
          );

          const hexData: HexagonData = {
            id: `hex-${row}-${col}`,
            center: { lat: center.lat(), lng: center.lng() },
            task,
            completed: false,
          };
          hexagonData.push(hexData);

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

          polygon.addListener("click", () => {
            onHexClick(task);
          });

          // Store polygon reference if provided
          if (hexagonPolygonsRef) {
            hexagonPolygonsRef.current.set(hexKey, polygon);
          }
        }
      }

      col += 1;
    }

    row += 1;
  }

  return hexagonData;
}

export function drawCompleteHexGrid(
  google: typeof window.google,
  map: google.maps.Map,
  bbox: BBox,
  radiusM: number,
  maskPolys: google.maps.Polygon[] | null,
  hexagonPolygonsRef?: React.MutableRefObject<Map<string, google.maps.Polygon>>,
): void {
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

  const bearings = [0, 60, 120, 180, 240, 300];

  // Performance optimization: batch polygon creation
  const polygonsToCreate: Array<{
    path: google.maps.LatLng[];
    hexKey: string;
  }> = [];

  let row = 0;
  for (;;) {
    const rowOrigin = spherical.computeOffset(sw, row * DY, 0);
    if (rowOrigin.lat() > latMax) break;

    const rowOffsetM = row % 2 === 0 ? 0 : DX / 2;

    let col = 0;
    for (;;) {
      const baseEastM = rowOffsetM + col * DX;
      const center = spherical.computeOffset(rowOrigin, baseEastM, 90);
      if (center.lng() > lngMax) break;

      if (isInsideAny(center)) {
        const hexKey = `${row}-${col}`;
        const path = bearings.map((bearing) =>
          spherical.computeOffset(center, radiusM, bearing),
        );
        
        polygonsToCreate.push({ path, hexKey });
      }

      col += 1;
    }

    row += 1;
  }

  // Batch create polygons for better performance
  polygonsToCreate.forEach(({ path, hexKey }) => {
    const polygon = new google.maps.Polygon({
      paths: path,
      strokeColor: "#e5e7eb", // Light gray
      strokeOpacity: 0.3,
      strokeWeight: 1,
      fillColor: "#f9fafb", // Very light gray
      fillOpacity: 0.1,
      clickable: false,
      map,
      zIndex: 0, // Behind everything else
      visible: false, // Hidden by default
    });

    // Store polygon reference if provided
    if (hexagonPolygonsRef) {
      hexagonPolygonsRef.current.set(hexKey, polygon);
    }
  });
}
