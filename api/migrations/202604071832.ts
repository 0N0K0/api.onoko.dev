import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

/**
 * Migration pour modifier la colonne "category" de la table "media" pour qu'elle puisse être nulle, afin de permettre aux médias de ne pas être associés à une catégorie spécifique.
 */

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `ALTER TABLE medias MODIFY COLUMN category VARCHAR(255) NULL;`,
    );
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `ALTER TABLE medias MODIFY COLUMN category VARCHAR(255) NOT NULL;`,
    );
  } finally {
    conn.release();
  }
}
