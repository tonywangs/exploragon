import { BBox } from "./types";

// San Francisco bounding box (approx)
export const SF_BBOX: BBox = [-122.5149, 37.7081, -122.3569, 37.8324];

// Hex configuration
export const HEX_RADIUS_M = 100; // meters
export const DX = 1.73 * HEX_RADIUS_M; // horizontal spacing for flat-topped
export const DY = Math.sqrt(2.25) * HEX_RADIUS_M; // vertical spacing

// Initial map center
export const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 };

// GPS streaming constants
export const MIN_INTERVAL_MS = 2000; // throttle to ~1 update / 2s
