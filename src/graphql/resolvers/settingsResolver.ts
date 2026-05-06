import { SettingsRepository } from "../../repositories/SettingsRepository";
import { checkAuth } from "../../utils/validationUtils";
import jwt from "jsonwebtoken";

function parseBooleanSetting(value: string | null): boolean {
  if (value === null) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1";
}

const settingsResolver = {
  // Résolveur pour la requête de récupération des paramètres
  settings: async (
    _args: Record<string, never>,
    context: { settingsRepo: SettingsRepository },
  ) => {
    // Récupérer les paramètres depuis la base de données ou une source de données
    const maintenanceRaw = await context.settingsRepo.get("maintenance");
    return { maintenance: parseBooleanSetting(maintenanceRaw) };
  },
  // Résolveur pour la mutation de mise à jour des paramètres
  updateSettings: async (
    args: { maintenance: boolean },
    context: { user: jwt.JwtPayload | null; settingsRepo: SettingsRepository },
  ) => {
    // Vérifier que l'utilisateur est authentifié et a les droits nécessaires
    checkAuth(context);
    // Mettre à jour les paramètres dans la base de données ou une source de données
    await context.settingsRepo.set("maintenance", String(args.maintenance));
    return { maintenance: args.maintenance };
  },
};

export default settingsResolver;
