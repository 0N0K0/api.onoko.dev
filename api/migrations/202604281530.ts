import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
        ALTER TABLE IF EXISTS project
        CHANGE COLUMN IF EXISTS intro_context intro TEXT,
        DROP COLUMN IF EXISTS intro_objective,
        CHANGE COLUMN IF EXISTS intro_client presentation_client TEXT,
        CHANGE COLUMN IF EXISTS presentation_description presentation_context TEXT
    `);
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
        ALTER TABLE IF EXISTS project
        CHANGE COLUMN IF EXISTS intro intro_context TEXT,
        ADD COLUMN IF NOT EXISTS intro_objective TEXT,
        CHANGE COLUMN IF EXISTS presentation_client intro_client TEXT,
        CHANGE COLUMN IF EXISTS presentation_context presentation_description TEXT
    `);
  } finally {
    conn.release();
  }
}
