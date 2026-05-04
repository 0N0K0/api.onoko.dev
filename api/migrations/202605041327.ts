import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

/**
 * Migration pour ajouter une colonne "mockup_embed" à la table "project".
 */

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `ALTER TABLE IF EXISTS project ADD COLUMN IF NOT EXISTS pined BOOLEAN;`,
    );
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `ALTER TABLE IF EXISTS project DROP COLUMN IF EXISTS pined;`,
    );
  } finally {
    conn.release();
  }
}
