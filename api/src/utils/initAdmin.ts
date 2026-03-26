import { SettingsRepository } from "../repositories/SettingsRepository";
import { hashPassword, isStrongPassword } from "./passwordUtils";

export async function initAdmin(settingsRepo: SettingsRepository) {
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
  if (!isStrongPassword(INIT_PASSWORD)) {
    throw new Error("INIT_PASSWORD does not meet strength requirements");
  }
  const hash = await hashPassword(INIT_PASSWORD);
  await settingsRepo.set("login", INIT_LOGIN);
  await settingsRepo.set("password_hash", hash);
  await settingsRepo.set("email", INIT_EMAIL);

  console.log("Initial admin credentials set.");
}
