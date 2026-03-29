import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS stack (
        id VARCHAR(255) PRIMARY KEY,
        label VARCHAR(255) NOT NULL,
        icon VARCHAR(255) NOT NULL,
        description TEXT
      )

      CREATE TABLE IF NOT EXISTS stack_version (
        stack_id VARCHAR(255) NOT NULL,
        version VARCHAR(255) NOT NULL,
        PRIMARY KEY (stack_id, version),
        FOREIGN KEY (stack_id) REFERENCES stack(id) ON DELETE CASCADE
      )
    `);
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query("DROP TABLE IF EXISTS stack");
    await conn.query("DROP TABLE IF EXISTS stack_version");
  } finally {
    conn.release();
  }
}
