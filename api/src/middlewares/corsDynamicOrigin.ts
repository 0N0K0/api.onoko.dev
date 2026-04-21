// Middleware CORS pour Express
import { Request, Response, NextFunction } from "express";

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
  const origin = process.env.CORS_ORIGIN;
  if (!origin) {
    throw new Error("CORS_ORIGIN is not defined");
  }
  res.header("Access-Control-Allow-Origin", origin);
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
