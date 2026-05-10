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
      `ALTER TABLE IF EXISTS testimony MODIFY COLUMN IF EXISTS name VARCHAR(255) NULL;`,
    );
    await conn.query(
      `ALTER TABLE IF EXISTS testimony MODIFY COLUMN IF EXISTS created_at VARCHAR(255) NULL;`,
    );
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `ALTER TABLE IF EXISTS testimony MODIFY COLUMN IF EXISTS name VARCHAR(255) NOT NULL;`,
    );
    await conn.query(
      `ALTER TABLE IF EXISTS testimony MODIFY COLUMN IF EXISTS created_at VARCHAR(255) NOT NULL;`,
    );
  } finally {
    conn.release();
  }
}
