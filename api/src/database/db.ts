import mariadb from "mariadb";

let pool: mariadb.Pool | null = null;

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
