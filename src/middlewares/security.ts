import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Application } from "express";

/**
 * Applique les middlewares de sécurité à l'application Express.
 * Utilise Helmet pour sécuriser les en-têtes HTTP et express-rate-limit pour limiter le nombre de requêtes (anti-bruteforce).
 * Les configurations sont adaptées en fonction de l'environnement (développement ou production).
 * @param app L'application Express à laquelle appliquer les middlewares de sécurité.
 * @param isDev Un booléen indiquant si l'environnement est en développement, utilisé pour ajuster les configurations de sécurité.
 */
export function applySecurityMiddlewares(app: Application, isDev: boolean) {
  app.use(
    helmet({
      crossOriginResourcePolicy: isDev ? false : { policy: "same-site" },
      contentSecurityPolicy: isDev ? false : undefined,
    }),
  );

  // Limitation du nombre de requêtes (anti-bruteforce) : large fenêtre pour le dev
  app.use(
    rateLimit({
      windowMs: 2 * 60 * 60 * 1000, // 2 heures
      max: 10000, // Large tolérance pour le dev
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
}
