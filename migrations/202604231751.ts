import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

/**
 * Migration pour ajouter une colonne "focus" à la table "medias".
 */

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `ALTER TABLE IF EXISTS medias ADD COLUMN IF NOT EXISTS focus VARCHAR(255);`,
    );
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `ALTER TABLE IF EXISTS medias DROP COLUMN IF EXISTS focus;`,
    );
  } finally {
    conn.release();
  }
}
