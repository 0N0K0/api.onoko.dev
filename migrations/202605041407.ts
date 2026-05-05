import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

/**
 * Migration pour définir une valeur par défaut vide sur la colonne "section"
 * de la table "project_stack" tout en la conservant NOT NULL.
 */

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `ALTER TABLE IF EXISTS project_stack MODIFY COLUMN IF EXISTS section VARCHAR(255) NOT NULL DEFAULT '';`,
    );
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `ALTER TABLE IF EXISTS project_stack MODIFY COLUMN IF EXISTS section VARCHAR(255) NOT NULL;`,
    );
  } finally {
    conn.release();
  }
}
