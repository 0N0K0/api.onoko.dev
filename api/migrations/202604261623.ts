import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

/**
 * Migration pour ajouter une colonne "slug" à la table "project".
 */

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `ALTER TABLE project ADD COLUMN IF NOT EXISTS slug VARCHAR(255);`,
    );
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`ALTER TABLE project DROP COLUMN IF EXISTS slug;`);
  } finally {
    conn.release();
  }
}
