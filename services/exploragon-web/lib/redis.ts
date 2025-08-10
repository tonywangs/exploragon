"use server";

import Redis from "ioredis";

export type GpsCoords = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
};

export type UserLocationRecord = {
  username: string;
  timestamp: number; // ms epoch
  coords: GpsCoords;
};

export type ActiveUsersDict = Record<string, UserLocationRecord>;

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const ACTIVE_TTL_SECONDS = 120;

const globalForRedis = globalThis as unknown as { _redis?: Redis };

export async function getRedis(): Promise<Redis> {
  if (!globalForRedis._redis) {
    const client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 2,
      enableAutoPipelining: true,
    });
    client.on("error", (err) => {
      // eslint-disable-next-line no-console
      console.error("Redis error:", err);
    });
    globalForRedis._redis = client;
  }
  return globalForRedis._redis!;
}

function userKey(username: string): string {
  return `gps:user:${username}`;
}

export async function setUserLocation(
  record: UserLocationRecord,
): Promise<void> {
  const redis = await getRedis();
  const key = userKey(record.username);
  const value = JSON.stringify(record);
  // Expire to naturally prune inactive users
  await redis.set(key, value, "EX", ACTIVE_TTL_SECONDS);
}

export async function getUserLocation(
  username: string,
): Promise<UserLocationRecord | null> {
  const redis = await getRedis();
  const val = await redis.get(userKey(username));
  return val ? (JSON.parse(val) as UserLocationRecord) : null;
}

export async function getActiveUsers(): Promise<ActiveUsersDict> {
  const redis = await getRedis();
  const pattern = "gps:user:*";
  let cursor = "0";
  const result: ActiveUsersDict = {};

  do {
    const [nextCursor, keys] = await redis.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      100,
    );
    cursor = nextCursor;
    if (keys.length === 0) continue;
    const values = await redis.mget(keys);
    keys.forEach((key, idx) => {
      const raw = values[idx];
      if (!raw) return;
      try {
        const rec = JSON.parse(raw) as UserLocationRecord;
        result[rec.username] = rec;
      } catch {
        // ignore malformed entries
      }
    });
  } while (cursor !== "0");

  return result;
}
