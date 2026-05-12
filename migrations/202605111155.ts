import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

/**
 * Migration pour permettre plusieurs catégories par stack via une table de liaison.
 * - Crée la table stack_category.
 * - Migre les valeurs existantes de stack.category_id vers stack_category.
 * - Ajoute un index pour les recherches par catégorie.
 */
export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS stack_category (
        stack_id VARCHAR(255) NOT NULL,
        category_id VARCHAR(255) NOT NULL,
        PRIMARY KEY (stack_id, category_id),
        FOREIGN KEY (stack_id) REFERENCES stack(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE
      );
    `);

    await conn.query(`
      INSERT IGNORE INTO stack_category (stack_id, category_id)
      SELECT id, category_id
      FROM stack
      WHERE category_id IS NOT NULL;
    `);

    await conn.query(
      `CREATE INDEX IF NOT EXISTS idx_stack_category_category_id ON stack_category(category_id)`,
    );

    const fkRows = await conn.query(
      `SELECT CONSTRAINT_NAME
       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'stack'
         AND COLUMN_NAME = 'category_id'
         AND REFERENCED_TABLE_NAME = 'category'`,
    );
    for (const row of fkRows as { CONSTRAINT_NAME: string }[]) {
      await conn.query(
        `ALTER TABLE stack DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``,
      );
    }

    await conn.query(
      `ALTER TABLE IF EXISTS stack DROP COLUMN IF EXISTS category_id;`,
    );

    // Nettoyage défensif : si un index explicite subsiste, on le supprime.
    await conn.query(`DROP INDEX IF EXISTS idx_stack_category_id ON stack`);
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `ALTER TABLE IF EXISTS stack ADD COLUMN IF NOT EXISTS category_id VARCHAR(255) NULL;`,
    );

    await conn.query(`
      UPDATE stack s
      LEFT JOIN (
        SELECT stack_id, MIN(category_id) AS category_id
        FROM stack_category
        GROUP BY stack_id
      ) sc ON sc.stack_id = s.id
      SET s.category_id = sc.category_id;
    `);

    await conn.query(
      `CREATE INDEX IF NOT EXISTS idx_stack_category_id ON stack(category_id)`,
    );

    await conn
      .query(
        `
      ALTER TABLE IF EXISTS stack
      ADD CONSTRAINT fk_stack_category_id
      FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL;
    `,
      )
      .catch(() => undefined);

    await conn.query(
      `DROP INDEX IF EXISTS idx_stack_category_category_id ON stack_category`,
    );
    await conn.query("DROP TABLE IF EXISTS stack_category");
  } finally {
    conn.release();
  }
}
