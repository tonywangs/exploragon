"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Coords = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
};

export default function GpsStreamPage() {
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [lastCoords, setLastCoords] = useState<Coords | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>("Idle");
  const [activeUsers, setActiveUsers] = useState<Record<string, unknown>>({});

  // Debounce/control send interval
  const lastSentAtMs = useRef<number>(0);
  const MIN_INTERVAL_MS = 2000; // throttle to ~1 update / 2s

  const sendUpdate = useCallback(async (coords: Coords) => {
    const username = usernameRef.current?.value?.trim() || "demo-user";
    const now = Date.now();
    if (now - lastSentAtMs.current < MIN_INTERVAL_MS) return;
    lastSentAtMs.current = now;

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
      setLastSent(new Date(now).toLocaleTimeString());
      setStatusMsg("Sent");
    } catch (e) {
      setStatusMsg("Send failed");
    }
  }, []);

  const start = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatusMsg("Geolocation not supported");
      return;
    }
    if (watchId !== null) return; // already running

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
        setLastCoords(coords);
        setStatusMsg("Got position");
        void sendUpdate(coords);
      },
      (err: GeolocationPositionError) => {
        setStatusMsg(`Error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      },
    );
    setWatchId(id as unknown as number);
    setStatusMsg("Watching");
  }, [sendUpdate, watchId]);

  const stop = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setStatusMsg("Stopped");
    }
  }, [watchId]);

  useEffect(() => {
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  // Optional: poll active users to visualize stored state (dev aid)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/active-users");
        const json = await res.json();
        if (json?.ok && json?.data) setActiveUsers(json.data as Record<string, unknown>);
      } catch {
        // ignore
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen p-6 flex flex-col items-center gap-4">
      <h1 className="text-2xl font-semibold">GPS Stream (Isolated)</h1>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Username:</label>
        <input
          ref={usernameRef}
          defaultValue="demo-user"
          className="border rounded px-2 py-1"
        />
      </div>
      <div className="flex gap-2">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={start}
          disabled={watchId !== null}
        >
          Start
        </button>
        <button
          className="bg-gray-700 text-white px-4 py-2 rounded"
          onClick={stop}
          disabled={watchId === null}
        >
          Stop
        </button>
      </div>

      <div className="w-full max-w-md border rounded p-4 text-sm">
        <div><span className="font-medium">Status:</span> {statusMsg}</div>
        <div className="mt-2">
          <span className="font-medium">Last coords:</span>
          {lastCoords ? (
            <div className="mt-1">
              <div>lat: {lastCoords.latitude.toFixed(6)}</div>
              <div>lng: {lastCoords.longitude.toFixed(6)}</div>
              {lastCoords.accuracy != null && (
                <div>acc: {Math.round(lastCoords.accuracy)} m</div>
              )}
              {lastCoords.speed != null && <div>speed: {lastCoords.speed} m/s</div>}
              {lastCoords.heading != null && <div>heading: {lastCoords.heading}°</div>}
            </div>
          ) : (
            <div className="text-gray-500">none</div>
          )}
        </div>
        <div className="mt-2">
          <span className="font-medium">Last sent:</span> {lastSent ?? "never"}
        </div>
        <div className="mt-4">
          <div className="font-medium mb-1">Active users (from Redis):</div>
          <pre className="bg-gray-50 rounded p-2 overflow-auto max-h-48 text-xs">{JSON.stringify(activeUsers, null, 2)}</pre>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-2 text-center">
        Keep this page open. Grant location permissions when prompted. Updates are throttled to once every 2 seconds.
      </p>
    </div>
  );
}


