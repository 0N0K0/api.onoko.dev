import mariadb from "mariadb";

// Pool de connexions à la base de données MariaDB, initialisé à null et créé à la demande
let pool: mariadb.Pool | null = null;

/**
 * Récupère le pool de connexions à la base de données MariaDB.
 * Si le pool n'existe pas encore, il est créé avec les paramètres de connexion spécifiés dans les variables d'environnement ou avec des valeurs par défaut.
 * @returns {mariadb.Pool} Le pool de connexions MariaDB.
 */
export function getPool(): mariadb.Pool {
  if (!pool) {
    pool = mariadb.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "root",
      database: process.env.DB_NAME || "onokodb",
      connectionLimit: 5,
    });
  }
  return pool;
}
