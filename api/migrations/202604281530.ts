import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
        ALTER TABLE project
        CHANGE COLUMN intro_context intro TEXT,
        DROP COLUMN intro_objective,
        CHANGE COLUMN intro_client presentation_client TEXT,
        CHANGE COLUMN presentation_description presentation_context TEXT
    `);
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
        ALTER TABLE project
        CHANGE COLUMN intro intro_context TEXT,
        ADD COLUMN intro_objective TEXT,
        CHANGE COLUMN presentation_client intro_client TEXT,
        CHANGE COLUMN presentation_context presentation_description TEXT
    `);
  } finally {
    conn.release();
  }
}
