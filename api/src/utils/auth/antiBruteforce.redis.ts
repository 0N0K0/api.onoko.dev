import Redis from "ioredis";

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

// Configure Redis connection (URL from env or default localhost)
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const ATTEMPT_PREFIX = "abf:"; // anti-bruteforce prefix

export async function registerAttempt(ip: string): Promise<void> {
  const key = ATTEMPT_PREFIX + ip;
  const now = Date.now();
  const data = await redis.hgetall(key);
  let count = 1;
  if (data && data.last && now - Number(data.last) <= ATTEMPT_WINDOW_MS) {
    count = Number(data.count || 0) + 1;
  }
  await redis.hmset(key, { count: count.toString(), last: now.toString() });
  await redis.pexpire(key, ATTEMPT_WINDOW_MS);
}

export async function isBlocked(ip: string): Promise<boolean> {
  const key = ATTEMPT_PREFIX + ip;
  const data = await redis.hgetall(key);
  if (!data || !data.last) return false;
  if (Date.now() - Number(data.last) > ATTEMPT_WINDOW_MS) return false;
  return Number(data.count) > MAX_ATTEMPTS;
}

export async function resetAttempts(ip: string): Promise<void> {
  const key = ATTEMPT_PREFIX + ip;
  await redis.del(key);
}
