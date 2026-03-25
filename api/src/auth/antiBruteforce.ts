// Simple anti-bruteforce in-memory (per process)
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_ATTEMPTS = 5;

const attempts: Record<string, { count: number; last: number }> = {};

export function registerAttempt(ip: string): void {
  const now = Date.now();
  if (!attempts[ip] || now - attempts[ip].last > ATTEMPT_WINDOW_MS) {
    attempts[ip] = { count: 1, last: now };
  } else {
    attempts[ip].count++;
    attempts[ip].last = now;
  }
}

export function isBlocked(ip: string): boolean {
  const entry = attempts[ip];
  if (!entry) return false;
  if (Date.now() - entry.last > ATTEMPT_WINDOW_MS) return false;
  return entry.count > MAX_ATTEMPTS;
}

export function resetAttempts(ip: string): void {
  delete attempts[ip];
}
