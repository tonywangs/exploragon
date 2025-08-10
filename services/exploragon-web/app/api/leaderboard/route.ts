import { getAllUsersWithHistory } from "@/lib/redis";
import { SF_BBOX, HEX_RADIUS_M, DX, DY } from "@/lib/constants";

export const runtime = "nodejs";

interface Coords {
  latitude: number;
  longitude: number;
}

interface LeaderboardEntry {
  username: string;
  hexagonsExplored: number;
  lastActive: string | null;
  totalPoints: number;
}

// Server-side hexagon calculation (simplified without Google Maps dependencies)
function findHexagonForCoordinate(
  coord: { lat: number; lng: number },
  bbox: [number, number, number, number],
  radiusM: number,
): { row: number; col: number } | null {
  // Simplified grid calculation using latitude/longitude directly
  // This is an approximation for server-side calculation
  const [minLng, minLat, maxLng, maxLat] = bbox;
  
  if (coord.lat < minLat || coord.lat > maxLat || coord.lng < minLng || coord.lng > maxLng) {
    return null;
  }

  // Approximate hexagon size in degrees (very rough estimate)
  const latDegreesPerMeter = 1 / 111000; // rough conversion
  const lngDegreesPerMeter = 1 / (111000 * Math.cos((coord.lat * Math.PI) / 180));
  
  const hexLatSize = (radiusM * Math.sqrt(3)) * latDegreesPerMeter;
  const hexLngSize = radiusM * 1.5 * lngDegreesPerMeter;
  
  const row = Math.floor((coord.lat - minLat) / hexLatSize);
  const col = Math.floor((coord.lng - minLng) / hexLngSize);
  
  return { row, col };
}

export async function GET() {
  try {
    const allUsersData = await getAllUsersWithHistory();
    const leaderboard: LeaderboardEntry[] = [];

    for (const [username, userData] of Object.entries(allUsersData)) {
      const { history } = userData;
      const uniqueHexagons = new Set<string>();

      // Calculate unique hexagons for this user
      history.forEach((record: any) => {
        const hexCoord = findHexagonForCoordinate(
          { lat: record.coords.latitude, lng: record.coords.longitude },
          SF_BBOX,
          HEX_RADIUS_M,
        );
        
        if (hexCoord) {
          const hexKey = `${hexCoord.row}-${hexCoord.col}`;
          uniqueHexagons.add(hexKey);
        }
      });

      // Get last activity timestamp
      const lastActive = history.length > 0 ? 
        Math.max(...history.map((r: any) => new Date(r.timestamp).getTime())) : 0;

      leaderboard.push({
        username,
        hexagonsExplored: uniqueHexagons.size,
        lastActive: lastActive > 0 ? new Date(lastActive).toISOString() : null,
        totalPoints: uniqueHexagons.size * 10, // 10 points per unique hexagon
      });
    }

    // Sort by hexagons explored (descending), then by last active (descending)
    leaderboard.sort((a, b) => {
      if (a.hexagonsExplored !== b.hexagonsExplored) {
        return b.hexagonsExplored - a.hexagonsExplored;
      }
      if (a.lastActive && b.lastActive) {
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      }
      if (a.lastActive && !b.lastActive) return -1;
      if (!a.lastActive && b.lastActive) return 1;
      return 0;
    });

    return new Response(
      JSON.stringify({ 
        ok: true, 
        leaderboard,
        totalUsers: leaderboard.length,
        totalUniqueHexagons: new Set(
          leaderboard.flatMap(entry => 
            Array.from({ length: entry.hexagonsExplored }, (_, i) => `${entry.username}-${i}`)
          )
        ).size
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  } catch (error) {
    console.error("/api/leaderboard GET error", error);
    return new Response(JSON.stringify({ ok: false, error: "Failed to generate leaderboard" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}