import { SettingsRepository } from "../repositories/SettingsRepository";
import { hashPassword } from "./passwordUtils";
import { isValidPassword } from "./validationUtils";
import validator from "validator";

/**
 * Initialise les identifiants de l'administrateur en vérifiant d'abord s'ils existent déjà dans les paramètres. Si les identifiants sont absents, la fonction lit les valeurs initiales pour le login, le mot de passe et l'email à partir des variables d'environnement. Si ces valeurs sont présentes et que le mot de passe répond aux exigences de sécurité, les identifiants sont hachés et stockés dans les paramètres pour une utilisation ultérieure.
 * @param {SettingsRepository} settingsRepo - Le repository des paramètres utilisé pour accéder et modifier les paramètres de l'application.
 * @returns {Promise<void>} Une promesse qui se résout lorsque l'initialisation est terminée.
 * @throws {Error} Une erreur si les identifiants initiaux sont manquants ou si le mot de passe initial ne répond pas aux exigences de sécurité.
 */
export async function initAdmin(
  settingsRepo: SettingsRepository,
): Promise<void> {
  const login = await settingsRepo.get("login");
  const passwordHash = await settingsRepo.get("password_hash");
  const email = await settingsRepo.get("email");

  if (login && passwordHash && email) {
    return;
  }

  const INIT_LOGIN = process.env.INIT_LOGIN;
  const INIT_PASSWORD = process.env.INIT_PASSWORD;
  const INIT_EMAIL = process.env.INIT_EMAIL;

  if (!INIT_LOGIN || !INIT_PASSWORD || !INIT_EMAIL) {
    throw new Error(
      "Initial admin credentials missing (INIT_LOGIN, INIT_PASSWORD, INIT_EMAIL)",
    );
  }
  if (!isValidPassword(INIT_PASSWORD)) {
    throw new Error("INIT_PASSWORD does not meet strength requirements");
  }
  if (!validator.isEmail(INIT_EMAIL)) {
    throw new Error("INIT_EMAIL is not a valid email address");
  }
  const hash = await hashPassword(INIT_PASSWORD);
  await settingsRepo.set("login", INIT_LOGIN);
  await settingsRepo.set("password_hash", hash);
  await settingsRepo.set("email", INIT_EMAIL);

  console.log("Initial admin credentials set.");
}
