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

// Optimized task hexagon creation - only creates what's needed
export function drawFlatToppedHexGrid(
  google: typeof window.google,
  map: google.maps.Map,
  bbox: BBox,
  radiusM: number,
  maskPolys: google.maps.Polygon[] | null,
  onHexClick: (task: Task) => void,
  hexagonPolygonsRef?: React.MutableRefObject<Map<string, google.maps.Polygon>>,
  maxHexagons: number = 100, // Limit for mobile performance
): HexagonData[] {
  const spherical = google.maps.geometry.spherical;
  const bearings = [0, 60, 120, 180, 240, 300];
  const hexagonData: HexagonData[] = [];

  const isInsideAny = (pt: google.maps.LatLng) => {
    if (!maskPolys || maskPolys.length === 0) return true;
    return maskPolys.some((poly) =>
      google.maps.geometry.poly.containsLocation(pt, poly),
    );
  };

  // Optimized approach: Process tasks directly instead of scanning grid
  let hexCount = 0;
  for (const task of TASKS_BY_LOCATION) {
    if (hexCount >= maxHexagons) break;

    const hexCoord = findHexagonForCoordinate(
      google,
      task.coordinates,
      bbox,
      radiusM,
    );
    
    if (!hexCoord) continue;

    // Calculate center for this hexagon
    const sw = new google.maps.LatLng(bbox[1], bbox[0]);
    const rowOrigin = spherical.computeOffset(sw, hexCoord.row * DY, 0);
    const rowOffsetM = hexCoord.row % 2 === 0 ? 0 : DX / 2;
    const baseEastM = rowOffsetM + hexCoord.col * DX;
    const center = spherical.computeOffset(rowOrigin, baseEastM, 90);

    if (!isInsideAny(center)) continue;

    const hexKey = `${hexCoord.row}-${hexCoord.col}`;
    
    // Skip if already created
    if (hexagonPolygonsRef?.current.has(hexKey)) continue;

    const path = bearings.map((bearing) =>
      spherical.computeOffset(center, radiusM, bearing),
    );

    const hexData: HexagonData = {
      id: `hex-${hexCoord.row}-${hexCoord.col}`,
      center: { lat: center.lat(), lng: center.lng() },
      task,
      completed: false,
    };
    hexagonData.push(hexData);

    const polygon = new google.maps.Polygon({
      paths: path,
      strokeColor: "#dc2626",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#fca5a5",
      fillOpacity: 0.3,
      clickable: true,
      map,
      zIndex: 10, // Above base grid
    });

    polygon.addListener("click", () => {
      onHexClick(task);
    });

    // Store polygon reference if provided
    if (hexagonPolygonsRef) {
      hexagonPolygonsRef.current.set(hexKey, polygon);
    }

    hexCount++;
  }

  return hexagonData;
}

// Progressive hexagon grid creation for better performance
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

  // Calculate all hexagon coordinates first (fast)
  const hexagonCoords: Array<{
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

        hexagonCoords.push({ path, hexKey });
      }

      col += 1;
    }

    row += 1;
  }

  // Create polygons progressively to avoid blocking
  const BATCH_SIZE = 20; // Create 20 polygons per frame
  let currentIndex = 0;

  const createNextBatch = () => {
    const endIndex = Math.min(currentIndex + BATCH_SIZE, hexagonCoords.length);
    
    for (let i = currentIndex; i < endIndex; i++) {
      const { path, hexKey } = hexagonCoords[i];
      
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
    }

    currentIndex = endIndex;
    
    // Continue creating batches until all are done
    if (currentIndex < hexagonCoords.length) {
      requestAnimationFrame(createNextBatch);
    }
  };

  // Start progressive creation
  requestAnimationFrame(createNextBatch);
}
