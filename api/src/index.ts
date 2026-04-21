import "dotenv/config";
import express from "express";
import path from "path";
import graphqlUploadExpress from "graphql-upload/public/graphqlUploadExpress.js";
import { corsDynamicOrigin } from "./middlewares/corsDynamicOrigin";
import { applySecurityMiddlewares } from "./middlewares/security";
import { createGraphqlHandler } from "./middlewares/graphql";
import { initAdmin } from "./utils/initAdmin";
import { SettingsRepository } from "./repositories/SettingsRepository";
import { getPool } from "./database/db";
import { runMigrations } from "./database/migrations";
import { disconnectRedis } from "./utils/auth/antiBruteforce.redis";

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

  applySecurityMiddlewares(app, isDev);
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
    createGraphqlHandler(pool, isDev),
  );

  const port = parseInt(process.env.PORT ?? "4000", 10);
  const server = app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
  });

  async function shutdown() {
    server.close();
    await pool.end();
    await disconnectRedis();
  }

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("Server error:", err);
  process.exit(1);
});
