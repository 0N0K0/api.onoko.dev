const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // Fenêtre de temps pour compter les tentatives (15 minutes)
const MAX_ATTEMPTS = 5; // Seuil de tentatives avant de bloquer une adresse IP

const attempts: Record<string, { count: number; last: number }> = {}; // Enregistrement des tentatives de connexion par adresse IP, avec un compteur et une date de la dernière tentative

/**
 * Enregistre une tentative de connexion pour une adresse IP donnée. Si aucune tentative n'existe ou si la dernière tentative remonte à plus de 15 minutes, une nouvelle entrée est créée avec un compteur de tentatives initialisé à 1. Sinon, le compteur de tentatives est incrémenté et la date de la dernière tentative est mise à jour.
 * @param {string} ip - L'adresse IP pour laquelle enregistrer la tentative de connexion.
 */
export function registerAttempt(ip: string): void {
  const now = Date.now();
  if (!attempts[ip] || now - attempts[ip].last > ATTEMPT_WINDOW_MS) {
    attempts[ip] = { count: 1, last: now };
  } else {
    attempts[ip].count++;
    attempts[ip].last = now;
  }
}

/**
 * Vérifie si une adresse IP est actuellement bloquée en raison d'un nombre excessif de tentatives de connexion. La fonction vérifie si une entrée existe pour l'adresse IP donnée, si la dernière tentative remonte à moins de 15 minutes et si le compteur de tentatives dépasse le seuil maximum autorisé.
 * @param {string} ip - L'adresse IP à vérifier.
 * @returns {boolean} true si l'adresse IP est bloquée, false sinon.
 */
export function isBlocked(ip: string): boolean {
  const entry = attempts[ip];
  if (!entry) return false;
  if (Date.now() - entry.last > ATTEMPT_WINDOW_MS) return false;
  return entry.count > MAX_ATTEMPTS;
}

/**
 * Réinitialise le compteur de tentatives pour une adresse IP donnée en supprimant l'entrée correspondante du registre des tentatives. Cette fonction est généralement appelée après une tentative de connexion réussie pour permettre à l'adresse IP de recommencer avec un compteur de tentatives à zéro.
 * @param {string} ip - L'adresse IP pour laquelle réinitialiser les tentatives.
 */
export function resetAttempts(ip: string): void {
  delete attempts[ip];
}
