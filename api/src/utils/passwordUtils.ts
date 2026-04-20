import bcrypt from "bcrypt";

const SALT_ROUNDS = 12; // Nombre de rounds de salage pour le hachage des mots de passe, un nombre plus élevé augmente la sécurité mais aussi le temps de calcul

/**
 * Hache un mot de passe en utilisant bcrypt avec un nombre de rounds de salage défini. Cette fonction prend un mot de passe en clair et retourne une promesse qui se résout avec le hash sécurisé du mot de passe, prêt à être stocké dans la base de données.
 * @param {string} password - Le mot de passe en clair à hacher.
 * @returns {Promise<string>} Une promesse qui se résout avec le hash du mot de passe.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Vérifie la validité d'un mot de passe en le comparant à un hash stocké. Cette fonction prend un mot de passe en clair et un hash, et retourne une promesse qui se résout avec un booléen indiquant si le mot de passe correspond au hash (true) ou non (false).
 * @param {string} password - Le mot de passe en clair à vérifier.
 * @param {string} hash - Le hash du mot de passe stocké à comparer.
 * @returns {Promise<boolean>} Une promesse qui se résout avec true si le mot de passe correspond au hash, sinon false.
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
