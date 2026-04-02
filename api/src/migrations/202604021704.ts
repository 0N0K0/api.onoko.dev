import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS stack_skill (
        id VARCHAR(255) PRIMARY KEY,
        stack_id VARCHAR(255) NOT NULL,
        skill TEXT NOT NULL,
        FOREIGN KEY (stack_id) REFERENCES stack(id) ON DELETE CASCADE
      );
    `);
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query("DROP TABLE IF EXISTS stack_skill");
  } finally {
    conn.release();
  }
}
