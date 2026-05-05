const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");
export const _JWT_SECRET: string = JWT_SECRET;

export const JWT_EXPIRES_IN: string | number =
  process.env.JWT_EXPIRES_IN || "2h"; // Durée de validité des tokens JWT, définie dans les variables d'environnement ou une valeur par défaut de 2 heures
