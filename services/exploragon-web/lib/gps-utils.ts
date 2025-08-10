import { Coords } from './types';
import { MIN_INTERVAL_MS } from './constants';

export class GPSManager {
  private usernameRef: React.RefObject<HTMLInputElement | null>;
  private lastSentAtMs = 0;
  private setLastSent: (time: string | null) => void;
  private setStatusMsg: (msg: string) => void;

  constructor(
    usernameRef: React.RefObject<HTMLInputElement | null>,
    setLastSent: (time: string | null) => void,
    setStatusMsg: (msg: string) => void,
  ) {
    this.usernameRef = usernameRef;
    this.setLastSent = setLastSent;
    this.setStatusMsg = setStatusMsg;
  }

  async sendUpdate(coords: Coords): Promise<void> {
    const username = this.usernameRef.current?.value?.trim() || "demo-user";
    const now = Date.now();
    if (now - this.lastSentAtMs < MIN_INTERVAL_MS) return;
    this.lastSentAtMs = now;

    try {
      const res = await fetch("/api/gps-stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username,
          timestamp: now,
          coords,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.setLastSent(new Date(now).toLocaleTimeString());
      this.setStatusMsg("Sent");
    } catch {
      this.setStatusMsg("Send failed");
    }
  }
}

export function startWatching(
  onPosition: (coords: Coords) => void,
  onError: (error: GeolocationPositionError) => void,
): number {
  const id = navigator.geolocation.watchPosition(
    (pos) => {
      const coords: Coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
        altitude: pos.coords.altitude ?? null,
        altitudeAccuracy: pos.coords.altitudeAccuracy ?? null,
        heading: pos.coords.heading ?? null,
        speed: pos.coords.speed ?? null,
      };
      onPosition(coords);
    },
    onError,
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000,
    },
  );
  return id as unknown as number;
}

export async function fetchActiveUsers(): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch("/api/active-users");
    const json = await res.json();
    return json?.ok && json?.data ? (json.data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}