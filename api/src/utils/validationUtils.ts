import validator from "validator";

/**
 * Vérifie qu'un ID est fourni et est un UUID valide.
 * @throws {Error} Si l'ID est absent ou invalide.
 */
export function validateId(id: string | undefined): asserts id is string {
  if (!id) throw new Error("ID is required");
  const isValidUUID = validator.isUUID(id);
  if (!isValidUUID) throw new Error("Invalid ID");
}

/**
 * Vérifie si une chaîne est vide ou ne contient que des espaces
 * @param {string} str La chaîne à vérifier
 * @return {boolean} true si la chaîne est vide ou ne contient que des espaces, false sinon
 */
export function isEmpty(str: string): boolean {
  return validator.isEmpty(str.trim());
}

/**
 * Nettoie une chaîne pour éviter les injections XSS
 * @param {string} str La chaîne à nettoyer
 * @return {string} La chaîne nettoyée
 */
export function sanitizeString(str: string): string {
  return validator.escape(str.trim());
}

/**
 * Vérifie si une valeur est un entier positif ou zéro
 * @param {unknown} value La valeur à vérifier
 * @return {boolean} true si la valeur est un entier positif ou zéro, false sinon
 */
export function isValidPositiveInteger(value: unknown): boolean {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/**
 * Vérifie si une chaîne est un mot de passe valide (min 20 caractères, 1 maj, 1 min, 1 chiffre, 1 symbole)
 * @param {string} password Le mot de passe à valider
 * @return {boolean} true si le mot de passe est valide, false sinon
 */
export function isValidPassword(password: string): boolean {
  return validator.isStrongPassword(password, {
    minLength: 20,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  });
}

/**
 * Vérifie si une chaîne est un slug valide (lettres minuscules, chiffres, tirets, pas d'espaces)
 * @param {string} slug Le slug à valider
 * @return {boolean} true si le slug est valide, false sinon
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/**
 * Vérifie si une chaîne est une URL valide avec un protocole
 * @param {string} url L'URL à valider
 * @return {boolean} true si l'URL est valide, false sinon
 */
export function isValidUrl(url: string): boolean {
  return validator.isURL(url, { require_protocol: true });
}

/**
 * Vérifie si une chaîne est une date ISO 8601 valide
 * @param {string} date La date à valider
 * @return {boolean} true si la date est valide, false sinon
 */
export function isValidDate(date: string): boolean {
  return validator.isISO8601(date);
}

/**
 * Vérifie que le contexte contient un utilisateur authentifié.
 * @throws {Error} Si l'utilisateur n'est pas authentifié.
 */
export function checkAuth(context: {
  user: object | null | undefined;
}): asserts context is { user: object } {
  if (!context.user) throw new Error("Unauthorized");
}
