import Redis from "ioredis";

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

// Configure Redis connection (URL from env or default localhost)
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const ATTEMPT_PREFIX = "abf:"; // anti-bruteforce prefix

/**
 * Enregistre une tentative de connexion pour une adresse IP donnée.
 * Récupère les données actuelles pour l'IP, incrémente le compteur de tentatives si la dernière tentative est dans la fenêtre de temps, ou réinitialise le compteur sinon.
 * Ensuite, stocke les données mises à jour dans Redis avec une expiration correspondant à la fenêtre de temps.
 * @param {string} ip L'adresse IP pour laquelle enregistrer la tentative.
 * @returns {Promise<void>} Une promesse qui se résout lorsque l'enregistrement est terminé.
 */
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

/**
 * Vérifie si une adresse IP est actuellement bloquée en raison de tentatives de connexion excessives.
 * Récupère les données pour l'IP depuis Redis, vérifie si la dernière tentative est dans la fenêtre de temps et si le compteur de tentatives dépasse le maximum autorisé.
 * @param {string} ip L'adresse IP à vérifier.
 * @returns {Promise<boolean>} Une promesse qui se résout avec true si l'IP est bloquée, ou false sinon.
 */
export async function isBlocked(ip: string): Promise<boolean> {
  const key = ATTEMPT_PREFIX + ip;
  const data = await redis.hgetall(key);
  if (!data || !data.last) return false;
  if (Date.now() - Number(data.last) > ATTEMPT_WINDOW_MS) return false;
  return Number(data.count) > MAX_ATTEMPTS;
}

/**
 * Réinitialise le compteur de tentatives pour une adresse IP donnée, supprimant les données associées dans Redis.
 * @param {string} ip L'adresse IP pour laquelle réinitialiser les tentatives.
 * @returns {Promise<void>} Une promesse qui se résout lorsque la réinitialisation est terminée.
 */
export async function resetAttempts(ip: string): Promise<void> {
  const key = ATTEMPT_PREFIX + ip;
  await redis.del(key);
}
