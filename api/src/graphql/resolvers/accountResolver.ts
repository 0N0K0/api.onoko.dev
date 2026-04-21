import { hashPassword, verifyPassword } from "../../utils/passwordUtils";
import {
  isValidEmail,
  isValidPassword,
  sanitizeString,
  isEmpty,
  checkAuth,
} from "../../utils/validationUtils";
import crypto from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { SettingsRepository } from "../../repositories/SettingsRepository";
import { withConnection } from "../../database/dbHelpers";

// Résolveur GraphQL pour les opérations liées au compte utilisateur
const accountResolver = {
  /**
   * Récupère les informations du compte de l'utilisateur connecté.
   * Vérifie que l'utilisateur est authentifié, puis récupère le login et l'email stockés dans les paramètres.
   * @param {Object} context -Le contexte de la requête, contenant les informations de l'utilisateur et le repository des paramètres.
   * @returns {Promise<{ login: string | null; email: string | null }>} Un objet contenant le login et l'email de l'utilisateur.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié.
   */
  account: async (
    _args: Record<string, never>,
    context: {
      user: jwt.JwtPayload | null;
      settingsRepo: SettingsRepository;
    },
  ): Promise<{ login: string | null; email: string | null }> => {
    checkAuth(context);

    const login = await context.settingsRepo.get("login");
    const email = await context.settingsRepo.get("email");

    return { login, email };
  },

  /**
   * Met à jour les informations du compte de l'utilisateur connecté.
   * Vérifie que l'utilisateur est authentifié, puis valide l'ancien mot de passe avant de mettre à jour le login, l'email et/ou le mot de passe.
   * @param {Object} _args Les arguments de la mutation, contenant les nouvelles valeurs pour le login, l'email, l'ancien mot de passe et le nouveau mot de passe.
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des paramètres.
   * @returns {Promise<{ login: string | null; email: string | null }>} Un objet contenant le nouveau login et email de l'utilisateur après la mise à jour.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié, si l'ancien mot de passe est invalide ou si le nouveau mot de passe est trop faible.
   */
  updateAccount: async (
    _args: {
      login?: string;
      email?: string;
      oldPassword: string;
      newPassword?: string;
    },
    context: {
      user: jwt.JwtPayload | null;
      settingsRepo: SettingsRepository;
    },
  ): Promise<{ login: string | null; email: string | null }> => {
    checkAuth(context);

    const storedHash = await context.settingsRepo.get("password_hash");
    if (!storedHash || !(await verifyPassword(_args.oldPassword, storedHash))) {
      throw new Error("Invalid old password");
    }
    if (_args.login) {
      const login = sanitizeString(_args.login);
      if (isEmpty(login)) throw new Error("Login cannot be empty");
      await context.settingsRepo.set("login", login);
    }
    if (_args.email) {
      const email = sanitizeString(_args.email);
      if (!isValidEmail(email)) throw new Error("Invalid email");
      await context.settingsRepo.set("email", email);
    }
    if (_args.newPassword) {
      if (!isValidPassword(_args.newPassword)) {
        throw new Error(
          "Password trop faible (min 8 caractères, maj, min, chiffre)",
        );
      }
      const hash = await hashPassword(_args.newPassword);
      await context.settingsRepo.set("password_hash", hash);
    }
    const newLogin = await context.settingsRepo.get("login");
    const newEmail = await context.settingsRepo.get("email");

    return { login: newLogin, email: newEmail };
  },

  /** Demande de réinitialisation de mot de passe
   * Vérifie si l'email existe, génère un token de réinitialisation, le stocke en base avec une date d'expiration, puis envoie un email à l'utilisateur avec un lien de réinitialisation.
   * @param {Object} _args Les arguments de la mutation, contenant l'email de l'utilisateur.
   * @param {Object} context Le contexte de la requête, contenant le repository des paramètres.
   * @returns {Promise<boolean>} Un booléen indiquant que la demande a été traitée (toujours true pour éviter de révéler l'existence de l'email).
   */
  requestResetPassword: async (
    _args: { email: string },
    context: { settingsRepo: SettingsRepository },
  ): Promise<boolean> => {
    const storedEmail = await context.settingsRepo.get("email");
    if (!storedEmail || storedEmail !== _args.email) return true; // Ne pas révéler l'existence
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 min
    const pool = context.settingsRepo.getPool();
    await withConnection(pool, async (conn) => {
      await conn.query(
        "DELETE FROM password_reset_tokens WHERE expires < NOW()",
      );
      await conn.query(
        "INSERT INTO password_reset_tokens (token, email, expires) VALUES (?, ?, ?)",
        [token, _args.email, expires],
      );
    });

    if (!process.env.RESET_URL) {
      throw new Error("RESET_URL is not defined");
    }
    const resetUrl = `${process.env.RESET_URL}?token=${token}`;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@example.com",
      to: _args.email,
      subject: "Réinitialisation de mot de passe",
      text: `Pour réinitialiser votre mot de passe, cliquez ici : ${resetUrl}`,
    });
    return true;
  },

  /**
   * Réinitialisation du mot de passe
   * Vérifie la validité du token de réinitialisation, valide la force du nouveau mot de passe, met à jour le mot de passe en base et supprime le token.
   * @param {Object} _args Les arguments de la mutation, contenant le token de réinitialisation et le nouveau mot de passe.
   * @param {Object} context Le contexte de la requête, contenant le repository des paramètres.
   * @returns {Promise<boolean>} Un booléen indiquant que la réinitialisation a réussi.
   * @throws {Error} Une erreur si le token est invalide ou expiré, ou si le nouveau mot de passe est trop faible.
   */
  resetPassword: async (
    _args: {
      token: string;
      newPassword: string;
    },
    context: { settingsRepo: SettingsRepository },
  ): Promise<boolean> => {
    const { token, newPassword } = _args;
    if (isEmpty(token) || isEmpty(newPassword))
      throw new Error("Token and newPassword required");
    const pool = context.settingsRepo.getPool();
    let entry;
    await withConnection(pool, async (conn) => {
      await conn.query(
        "DELETE FROM password_reset_tokens WHERE expires < NOW()",
      );
      const rows = await conn.query(
        "SELECT email, expires FROM password_reset_tokens WHERE token = ?",
        [token],
      );
      if (!rows.length) throw new Error("Invalid or expired token");
      entry = rows[0];
      if (new Date(entry.expires).getTime() < Date.now()) {
        throw new Error("Invalid or expired token");
      }
    });
    if (!isValidPassword(newPassword)) {
      throw new Error(
        "Password trop faible (min 20 caractères, maj, min, chiffre, symbole)",
      );
    }
    const hash = await hashPassword(newPassword);
    await context.settingsRepo.set("password_hash", hash);
    await withConnection(pool, (conn) =>
      conn.query("DELETE FROM password_reset_tokens WHERE token = ?", [token]),
    );
    return true;
  },
};

export default accountResolver;
