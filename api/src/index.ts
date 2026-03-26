import path from "path";
import fs from "fs";
import "dotenv/config";
import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";
import mariadb from "mariadb";
import { Umzug } from "umzug";
import { initAdmin } from "./utils/initAdmin";
import { createAuthRoutes } from "./routes/auth/authRoutes";
import { createAccountRoutes } from "./routes/account/accountRoutes";
import { createPasswordResetRoutes } from "./routes/account/passwordResetRoutes";
import { SettingsRepository } from "./repositories/SettingsRepository";

const pool = mariadb.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "onokodb",
  connectionLimit: 5,
});

async function main() {
  const isProd =
    process.env.NODE_ENV === "production" ||
    fs.existsSync(path.join(__dirname, "migrations", "202603252047.js"));
  const migrationsPath = isProd
    ? path.join(__dirname, "migrations", "*.js")
    : path.join(__dirname, "migrations", "*.ts");

  const umzug = new Umzug({
    migrations: { glob: migrationsPath },
    context: pool,
    logger: console,
  });

  await umzug.up();

  const settingsRepo = new SettingsRepository(pool);

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

  app.use(createAuthRoutes(settingsRepo));
  app.use(createPasswordResetRoutes(settingsRepo));
  app.use(createAccountRoutes(settingsRepo));

  app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}/graphql`);
  });
}

main();
