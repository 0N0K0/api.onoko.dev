import path from "path";
import fs from "fs";
import { Umzug } from "umzug";
import type mariadb from "mariadb";

/**
 * Exécute les migrations de la base de données en utilisant Umzug.
 * Les migrations sont situées dans le dossier "migrations" et sont exécutées dans l'ordre.
 * Le type de fichier des migrations (JavaScript ou TypeScript) est déterminé en fonction de l'environnement d'exécution.
 * @param {mariadb.Pool} pool - Le pool de connexions à la base de données MariaDB.
 */
export async function runMigrations(pool: mariadb.Pool) {
  const distMigrationsGlob = path.join(
    process.cwd(),
    "dist",
    "migrations",
    "*.js",
  );
  const rootJsMigrationsGlob = path.join(process.cwd(), "migrations", "*.js");
  const rootTsMigrationsGlob = path.join(process.cwd(), "migrations", "*.ts");

  const hasDistMigrations = fs.existsSync(
    path.join(process.cwd(), "dist", "migrations"),
  );
  const hasRootJsMigrations = fs.existsSync(
    path.join(process.cwd(), "migrations", "202603252047.js"),
  );

  const migrationsPath =
    process.env.NODE_ENV === "production" || hasDistMigrations
      ? distMigrationsGlob
      : hasRootJsMigrations
        ? rootJsMigrationsGlob
        : rootTsMigrationsGlob;

  const umzug = new Umzug({
    migrations: { glob: migrationsPath },
    context: pool,
    logger: console,
  });

  await umzug.up();
}
