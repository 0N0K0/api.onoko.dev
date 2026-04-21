import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

/**
 * Migration pour ajouter une colonne "position" à la table "project_mockup".
 */

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `ALTER TABLE project_mockup ADD COLUMN IF NOT EXISTS position INT;`,
    );
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `ALTER TABLE project_mockup DROP COLUMN IF EXISTS position;`,
    );
  } finally {
    conn.release();
  }
}
