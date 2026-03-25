import "dotenv/config";
import { initAdmin } from "./auth/initAdmin";
import { createAuthRoutes } from "./auth/authRoutes";
import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";
import mariadb from "mariadb";
import { SettingsRepository } from "./repositories/SettingsRepository";
import { Umzug } from "umzug";
import path from "path";
import fs from "fs";

const pool = mariadb.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "onokodb",
  connectionLimit: 5,
});

async function main() {
  // Détecte si on est en dev (ts) ou en prod (js)
  const migrationsPath = fs.existsSync(
    path.join(__dirname, "migrations", "202603252047.js"),
  )
    ? path.join(__dirname, "migrations", "*.js")
    : path.join(__dirname, "migrations", "*.ts");

  const umzug = new Umzug({
    migrations: { glob: migrationsPath },
    context: pool,
    logger: console,
  });

  await umzug.up();

  const settingsRepo = new SettingsRepository(pool);

  // Initialisation de l'admin à la première exécution
  await initAdmin(settingsRepo).catch((err) => {
    console.error("Admin init error:", err.message);
    process.exit(1);
  });

  const app = express();
  const port = 4000;
  app.use(express.json());

  const schema = buildSchema(`
    type Query {
      hello: String
    }
  `);

  const root = {
    hello: () => "Hello world!",
  };

  app.use(
    "/graphql",
    graphqlHTTP({
      schema,
      rootValue: root,
      graphiql: true,
    }),
  );

  // Auth routes (non documenté, non indexé)
  app.use(createAuthRoutes(settingsRepo));

  app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}/graphql`);
  });
}

main();
