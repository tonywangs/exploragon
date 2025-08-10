export interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  location: string;
  difficulty: "easy" | "medium" | "hard";
  coordinates: { lat: number; lng: number };
}

export interface HexagonData {
  id: string;
  center: { lat: number; lng: number };
  task?: Task;
  completed?: boolean;
}

export type BBox = [
  lngMin: number,
  latMin: number,
  lngMax: number,
  latMax: number,
];

export interface Coords {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}
