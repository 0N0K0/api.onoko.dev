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
