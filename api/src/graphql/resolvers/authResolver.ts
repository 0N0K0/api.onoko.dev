import { SettingsRepository } from "../../repositories/SettingsRepository";
import { isEmpty, sanitizeString } from "../../utils/validationUtils";
import {
  generateToken,
  verifyToken as verifyJwtToken,
} from "../../utils/auth/jwtUtils";
import { verifyPassword } from "../../utils/passwordUtils";
import {
  registerAttempt,
  isBlocked,
  resetAttempts,
} from "../../utils/auth/antiBruteforce.redis";

// Résolveur GraphQL pour les opérations liées à l'authentification
const authResolver = {
  /**
   * Authentification de l'utilisateur
   * Vérifie les identifiants de l'utilisateur, puis génère et retourne un token JWT si les identifiants sont valides.
   * @param {Object} _args Les arguments de la mutation, contenant le login et le mot de passe de l'utilisateur.
   * @param {Object} context Le contexte de la requête, contenant le repository des paramètres.
   * @returns {Promise<{ token: string }>} Un objet contenant le token JWT généré pour l'utilisateur.
   * @throws {Error} Une erreur si les identifiants sont invalides.
   */
  login: async (
    _args: { login: string; password: string },
    context: { settingsRepo: SettingsRepository },
  ): Promise<{ token: string }> => {
    const login = sanitizeString(_args.login);
    const password = sanitizeString(_args.password);
    if (isEmpty(login) || isEmpty(password)) {
      throw new Error("Login et mot de passe requis");
    }

    // Récupère l'IP du client (X-Forwarded-For ou req.ip)
    // Ici, on suppose que l'IP est passée dans le contexte (à adapter si besoin)
    const ip = (context as any).ip || "unknown";

    if (await isBlocked(ip)) {
      throw new Error("Trop de tentatives, réessayez plus tard.");
    }

    const storedLogin = await context.settingsRepo.get("login");
    const storedHash = await context.settingsRepo.get("password_hash");
    if (!storedLogin || !storedHash || login !== storedLogin) {
      await registerAttempt(ip);
      throw new Error("Invalid credentials");
    }
    const valid = await verifyPassword(password, storedHash);
    if (!valid) {
      await registerAttempt(ip);
      throw new Error("Invalid credentials");
    }
    await resetAttempts(ip);
    const token = generateToken({ login });
    return { token };
  },

  /**
   * Rafraîchissement du token JWT
   * Vérifie la validité du token actuel, puis génère et retourne un nouveau token JWT si le token est valide.
   * @param {Object} _args Les arguments de la mutation, contenant le token JWT actuel.
   * @returns {Promise<{ token: string }>} Un objet contenant le nouveau token JWT généré pour l'utilisateur.
   * @throws {Error} Une erreur si le token actuel est invalide.
   */
  refreshToken: async (_args: {
    token: string;
  }): Promise<{ token: string }> => {
    try {
      const token = sanitizeString(_args.token);
      if (isEmpty(token)) throw new Error("Token requis");
      const payload = verifyJwtToken(token);
      const newToken = generateToken({ login: payload.login });
      return { token: newToken };
    } catch {
      throw new Error("Invalid token");
    }
  },

  /**
   * Vérification du token JWT
   * Vérifie la validité du token JWT fourni et retourne les informations de l'utilisateur si le token est valide.
   * @param {Object} _args Les arguments de la mutation, contenant le token JWT à vérifier.
   * @param {Object} context Le contexte de la requête, contenant le repository des paramètres.
   * @returns {Promise<{ login: string | null }>} Un objet contenant le login de l'utilisateur si le token est valide, ou null sinon.
   * @throws {Error} Une erreur si le token est invalide.
   */
  verifyToken: async (
    _args: { token: string },
    context: { settingsRepo: SettingsRepository },
  ): Promise<{ login: string | null }> => {
    try {
      const token = sanitizeString(_args.token);
      if (isEmpty(token)) throw new Error("Token requis");
      verifyJwtToken(token);
      return { login: await context.settingsRepo.get("login") };
    } catch {
      throw new Error("Invalid token");
    }
  },
};

export default authResolver;
