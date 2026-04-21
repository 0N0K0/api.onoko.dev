import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { graphqlHTTP } from "express-graphql";
import { verifyToken } from "./utils/auth/jwtUtils";
import { corsDynamicOrigin } from "./middlewares/corsDynamicOrigin";
import { initAdmin } from "./utils/initAdmin";
import { SettingsRepository } from "./repositories/SettingsRepository";
import { getPool } from "./database/db";
import { runMigrations } from "./database/migrations";
import { getGraphqlContext } from "./graphql/graphqlContext";
import { getRoot, getSchema } from "./graphql/graphqlSchema";
import jwt from "jsonwebtoken";
import graphqlUploadExpress from "graphql-upload/public/graphqlUploadExpress.js";

async function main() {
  const pool = getPool();
  await runMigrations(pool);

  const settingsRepo = new SettingsRepository(pool);
  await initAdmin(settingsRepo).catch((err) => {
    console.error("Admin init error:", err.message);
    process.exit(1);
  });

  const app = express();

  const isDev = process.env.NODE_ENV === "development";

  // Sécurité HTTP : headers sécurisés
  app.use(
    helmet({
      crossOriginResourcePolicy: isDev ? false : { policy: "same-site" },
      contentSecurityPolicy: isDev ? false : undefined,
    }),
  );

  // Limitation du nombre de requêtes (anti-bruteforce) : large fenêtre pour le dev
  const limiter = rateLimit({
    windowMs: 2 * 60 * 60 * 1000, // 2 heures
    max: 10000, // Large tolérance pour le dev
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
  app.use(express.json({ limit: "256mb" }));

  app.use(corsDynamicOrigin);
  app.options("/graphql", corsDynamicOrigin);

  // Route statique médias
  app.use(
    "/medias",
    express.static(path.join(process.cwd(), "public", "medias")),
  );

  // Route GraphQL
  app.use(
    "/graphql",
    graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }),
    graphqlHTTP((req) => {
      let user: jwt.JwtPayload | null = null;
      const auth = req.headers.authorization;
      if (auth && auth.startsWith("Bearer ")) {
        try {
          user = verifyToken(auth.slice(7));
        } catch {}
      }
      const forwarded = req.headers["x-forwarded-for"];
      const ip =
        (Array.isArray(forwarded)
          ? forwarded[0]
          : forwarded?.split(",")[0]
        )?.trim() ??
        req.socket.remoteAddress ??
        "unknown";
      return {
        schema: getSchema(),
        rootValue: getRoot(),
        graphiql: true,
        context: getGraphqlContext({ user, pool, ip }),
        customFormatErrorFn: (err) => {
          console.error("GraphQL Error:", err);
          return {
            message: err.message,
            ...(isDev && { stack: err.stack }),
          };
        },
      };
    }),
  );

  const port = 4000;
  app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}/graphql`);
  });
}

main().catch((err) => {
  console.error("Server error:", err);
  process.exit(1);
});
