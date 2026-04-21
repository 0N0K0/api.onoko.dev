import { Request, Response, NextFunction } from "express";

const CORS_ORIGIN = process.env.CORS_ORIGIN;
if (!CORS_ORIGIN) throw new Error("CORS_ORIGIN is not defined");

/**
 * Middleware pour gérer les CORS avec une origine dynamique.
 * Permet de définir l'origine autorisée à partir d'une variable d'environnement.
 * @param req - La requête entrante.
 * @param res - La réponse à envoyer.
 * @param next - La fonction pour passer au middleware suivant.
 */
export function corsDynamicOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.header("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
}
