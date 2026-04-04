import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

/**
 * Migration pour créer les tables "coworker", "role" et "coworker_role" dans la base de données.
 * La table "coworker" est utilisée pour stocker les informations des collaborateurs, avec une colonne "name" pour le nom du collaborateur.
 * La table "role" est utilisée pour stocker les rôles disponibles, avec une colonne "label" pour le nom du rôle.
 * La table "coworker_role" est une table de liaison entre les collaborateurs et les rôles, avec des clés étrangères vers les tables "coworker" et "role".
 * Les fonctions "up" et "down" sont exécutées lors de l'application ou du rollback de la migration, respectivement.
 */

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS coworker (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );`);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS role (
        id VARCHAR(255) PRIMARY KEY,
        label VARCHAR(255) NOT NULL
      );`);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS coworker_role (
        coworker_id VARCHAR(255) NOT NULL,
        role_id VARCHAR(255) NOT NULL,
        PRIMARY KEY (coworker_id, role_id),
        FOREIGN KEY (coworker_id) REFERENCES coworker(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE
      );`);
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query("DROP TABLE IF EXISTS coworker_role");
    await conn.query("DROP TABLE IF EXISTS coworker");
    await conn.query("DROP TABLE IF EXISTS role");
  } finally {
    conn.release();
  }
}
