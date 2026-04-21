import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");
const _JWT_SECRET: string = JWT_SECRET;

const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || "2h"; // Durée de validité des tokens JWT, définie dans les variables d'environnement ou une valeur par défaut de 2 heures

/**
 * Génère un token JWT à partir d'un payload donné. Le token est signé avec une clé secrète définie dans les variables d'environnement et a une durée de validité également définie dans les variables d'environnement.
 * @param {object} payload - L'objet contenant les données à inclure dans le token JWT.
 * @returns {string} Le token JWT généré.
 */
export function generateToken(payload: object): string {
  return jwt.sign(payload, _JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
}

/**
 * Vérifie la validité d'un token JWT donné en le décodant avec la même clé secrète utilisée pour le signer. Si le token est valide, les données du payload sont retournées. Si le token est invalide ou expiré, une erreur est levée.
 * @param {string} token - Le token JWT à vérifier.
 * @returns {jwt.JwtPayload} Les données du payload contenues dans le token JWT si celui-ci est valide.
 * @throws {Error} Une erreur si le token JWT est invalide ou expiré.
 */
export function verifyToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, _JWT_SECRET) as jwt.JwtPayload;
}
