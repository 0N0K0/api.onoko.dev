import path from "path";
import fs from "fs";
import { Umzug } from "umzug";
import type mariadb from "mariadb";

export async function runMigrations(pool: mariadb.Pool) {
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
}
