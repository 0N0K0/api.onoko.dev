import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

/**
 * Migration pour ajouter une colonne "slug" à la table "project".
 */

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    const [slugExists] = await conn.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project' AND COLUMN_NAME = 'slug'`,
    );
    if (slugExists) {
      await conn.query(`UPDATE project SET slug = id WHERE slug IS NULL;`);
    }
    await conn.query(
      `ALTER TABLE IF EXISTS project  MODIFY COLUMN IF EXISTS slug VARCHAR(255) UNIQUE NOT NULL;`,
    );
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`UPDATE project SET slug = NULL;`);
    await conn.query(
      `ALTER TABLE IF EXISTS project  MODIFY COLUMN IF EXISTS slug VARCHAR(255);`,
    );
  } finally {
    conn.release();
  }
}
