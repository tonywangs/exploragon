export const runtime = "nodejs";
import { setUserLocation } from "@/lib/redis";

type GpsPayload = {
  username: string;
  timestamp: number;
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<GpsPayload> | undefined;
    if (!body || !body.username || !body.coords) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid payload" }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }

    const { username, timestamp, coords } = body as GpsPayload;
    const ts = typeof timestamp === "number" ? new Date(timestamp).toISOString() : new Date().toISOString();

    // Persist to Redis with TTL so the user is considered "active"
    await setUserLocation({ username, timestamp: timestamp ?? Date.now(), coords });

    // Log a compact line for server visibility
    console.log(`[GPS_UPDATE] user=${username} time=${ts} lat=${coords.latitude.toFixed(6)} lng=${coords.longitude.toFixed(6)}`);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("/api/gps-stream POST error", error);
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export function OPTIONS() {
  // Basic CORS preflight handler (kept permissive for local/mobile testing)
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}


