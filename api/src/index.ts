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

async function main() {
  const pool = getPool();
  await runMigrations(pool);

  const settingsRepo = new SettingsRepository(pool);
  await initAdmin(settingsRepo).catch((err) => {
    console.error("Admin init error:", err.message);
    process.exit(1);
  });

  const app = express();

  // Sécurité HTTP : headers sécurisés
  app.use(helmet());

  // Limitation du nombre de requêtes (anti-bruteforce)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite chaque IP à 100 requêtes par fenêtre
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
  app.use(express.json({ limit: "256mb" }));

  app.use(
    "/assets/stack",
    express.static(path.join(process.cwd(), "public", "stack")),
  );
  app.use(
    "/assets/project",
    express.static(path.join(process.cwd(), "public", "project")),
  );

  app.use(corsDynamicOrigin);

  app.use(
    "/graphql",
    graphqlHTTP((req) => {
      let user: jwt.JwtPayload | null = null;
      const auth = req.headers.authorization;
      if (auth && auth.startsWith("Bearer ")) {
        try {
          user = verifyToken(auth.slice(7));
        } catch {}
      }
      return {
        schema: getSchema(),
        rootValue: getRoot(),
        graphiql: true,
        context: getGraphqlContext({ user, pool }),
        customFormatErrorFn: (err) => {
          console.error("GraphQL Error:", err);
          return { message: err.message, stack: err.stack };
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
