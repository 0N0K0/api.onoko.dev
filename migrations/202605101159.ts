import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

/**
 * Migration pour définir une valeur par défaut vide sur la colonne "name"
 * de la table "testimony" tout en la conservant NOT NULL.
 */

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      "ALTER TABLE IF EXISTS testimony ADD COLUMN IF NOT EXISTS `insert` BOOLEAN;",
    );
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      "ALTER TABLE IF EXISTS testimony DROP COLUMN IF EXISTS `insert`;",
    );
  } finally {
    conn.release();
  }
}
