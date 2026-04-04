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

/**
 * Vérifie si un mot de passe répond à des critères de sécurité stricts, notamment une longueur minimale de 20 caractères, la présence d'au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial. Cette fonction retourne true si le mot de passe est considéré comme fort selon ces critères, sinon elle retourne false.
 * @param {string} password - Le mot de passe à évaluer.
 * @returns {boolean} true si le mot de passe est fort, sinon false.
 */
export function isStrongPassword(password: string): boolean {
  // Min 20 chars, upper, lower, digit, special
  return (
    password.length >= 20 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
