import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

/**
 * Migration pour créer les tables "category", "stack" et "stack_version" dans la base de données.
 * La table "category" est utilisée pour stocker les catégories de stacks, avec une relation hiérarchique entre elles.
 * La table "stack" est utilisée pour stocker les stacks, avec une relation vers la catégorie à laquelle elles appartiennent.
 * La table "stack_version" est utilisée pour stocker les différentes versions d'une stack, avec une relation vers la stack correspondante.
 * Les fonctions "up" et "down" sont exécutées lors de l'application ou du rollback de la migration, respectivement.
 */

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS category (
        id VARCHAR(255) PRIMARY KEY,
        label VARCHAR(255) NOT NULL,
        entity VARCHAR(255) NOT NULL,
        description TEXT,
        parent_id VARCHAR(255),
        FOREIGN KEY (parent_id) REFERENCES category(id) ON DELETE SET NULL
      );`);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS stack (
        id VARCHAR(255) PRIMARY KEY,
        label VARCHAR(255) UNIQUE NOT NULL,
        icon VARCHAR(255) NOT NULL,
        description TEXT,
        category_id VARCHAR(255),
        FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL
      );`);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS stack_version (
        stack_id VARCHAR(255) NOT NULL,
        version VARCHAR(255) NOT NULL,
        PRIMARY KEY (stack_id, version),
        FOREIGN KEY (stack_id) REFERENCES stack(id) ON DELETE CASCADE
      );
    `);
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query("DROP TABLE IF EXISTS stack_version");
    await conn.query("DROP TABLE IF EXISTS stack");
    await conn.query("DROP TABLE IF EXISTS category");
  } finally {
    conn.release();
  }
}
