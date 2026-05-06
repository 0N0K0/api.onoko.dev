import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

/**
 * Migration pour insérer le paramètre "maintenance" à "true"
 * seulement s'il n'existe pas déjà dans la table "settings".
 */

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `INSERT INTO settings (
				\`key\`,
				\`value\`
			)
			SELECT 'maintenance', 'true'
			WHERE NOT EXISTS (
				SELECT 1 FROM settings WHERE \`key\` = 'maintenance'
			);`,
    );
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    // No-op: la migration ne doit pas supprimer une ligne potentiellement préexistante.
  } finally {
    conn.release();
  }
}
