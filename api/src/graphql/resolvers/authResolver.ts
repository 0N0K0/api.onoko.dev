import { SettingsRepository } from "../../repositories/SettingsRepository";
import {
  generateToken,
  verifyToken as verifyJwtToken,
} from "../../utils/auth/jwtUtils";
import { verifyPassword } from "../../utils/passwordUtils";

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
    const storedLogin = await context.settingsRepo.get("login");
    const storedHash = await context.settingsRepo.get("password_hash");
    if (!storedLogin || !storedHash || _args.login !== storedLogin) {
      throw new Error("Invalid credentials");
    }
    const valid = await verifyPassword(_args.password, storedHash);
    if (!valid) throw new Error("Invalid credentials");
    const token = generateToken({ login: _args.login });
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
      const payload = verifyJwtToken(_args.token);
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
      verifyJwtToken(_args.token);
      return { login: await context.settingsRepo.get("login") };
    } catch {
      throw new Error("Invalid token");
    }
  },
};

export default authResolver;
