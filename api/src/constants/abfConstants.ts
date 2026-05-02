import Redis from "ioredis";

export const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_ATTEMPTS = 5;

// Configure Redis connection
if (!process.env.REDIS_URL) throw new Error("REDIS_URL is not defined");
export const redis = new Redis(process.env.REDIS_URL);

export const ATTEMPT_PREFIX = "abf:"; // anti-bruteforce prefix
