import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Application } from "express";

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
