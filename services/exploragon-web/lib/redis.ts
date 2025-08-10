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

export type UserLocationHistoryRecord = {
  username: string;
  timestamp: number;
  coords: GpsCoords;
};

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const ACTIVE_TTL_SECONDS = 120;
const HISTORY_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const MAX_HISTORY_ENTRIES = 720; // 1 hour at 5s intervals

const globalForRedis = globalThis as unknown as { _redis?: Redis };

export async function getRedis(): Promise<Redis> {
  if (!globalForRedis._redis) {
    const client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 2,
      enableAutoPipelining: true,
    });
    client.on("error", (err) => console.error("Redis error:", err));
    globalForRedis._redis = client;
  }

  return globalForRedis._redis!;
}

function userKey(username: string): string {
  return `gps:user:${username}`;
}

function userHistoryKey(username: string): string {
  return `gps:history:${username}`;
}

export async function setUserLocation(
  record: UserLocationRecord,
): Promise<void> {
  const redis = await getRedis();
  const key = userKey(record.username);
  const value = JSON.stringify(record);

  // Set current location with TTL for active users
  await redis.set(key, value, "EX", ACTIVE_TTL_SECONDS);

  // Add to location history
  await addLocationToHistory(record);
}

export async function addLocationToHistory(
  record: UserLocationRecord,
): Promise<void> {
  const redis = await getRedis();
  const historyKey = userHistoryKey(record.username);
  const historyRecord: UserLocationHistoryRecord = {
    username: record.username,
    timestamp: record.timestamp,
    coords: record.coords,
  };

  // Add to sorted set with timestamp as score
  await redis.zadd(historyKey, record.timestamp, JSON.stringify(historyRecord));

  // Keep only recent entries
  const count = await redis.zcard(historyKey);
  if (count > MAX_HISTORY_ENTRIES) {
    const toRemove = count - MAX_HISTORY_ENTRIES;
    await redis.zremrangebyrank(historyKey, 0, toRemove - 1);
  }

  await redis.expire(historyKey, HISTORY_TTL_SECONDS);
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
      1440,
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

export async function getUserLocationHistory(
  username: string,
  limit?: number,
): Promise<UserLocationHistoryRecord[]> {
  const redis = await getRedis();
  const historyKey = userHistoryKey(username);

  // Get recent entries (sorted by timestamp desc)
  const count = limit || MAX_HISTORY_ENTRIES;
  const entries = await redis.zrevrange(historyKey, 0, count - 1);

  const history: UserLocationHistoryRecord[] = [];
  for (const entry of entries) {
    try {
      const record = JSON.parse(entry) as UserLocationHistoryRecord;
      history.push(record);
    } catch {
      // Skip malformed entries
    }
  }

  return history;
}

export async function getAllUsersWithHistory(): Promise<
  Record<
    string,
    {
      current: UserLocationRecord;
      history: UserLocationHistoryRecord[];
    }
  >
> {
  const activeUsers = await getActiveUsers();
  const result: Record<
    string,
    {
      current: UserLocationRecord;
      history: UserLocationHistoryRecord[];
    }
  > = {};

  for (const [username, currentLocation] of Object.entries(activeUsers)) {
    const history = await getUserLocationHistory(username, 5000); // Last 50 positions
    result[username] = {
      current: currentLocation,
      history,
    };
  }

  return result;
}
