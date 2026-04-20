import { MigrationParams } from "umzug";
import { Pool } from "mariadb";

/**
 * Migration pour créer la table "settings" dans la base de données.
 * La table "settings" est utilisée pour stocker les paramètres de configuration de l'application, tels que les clés d'API ou les préférences utilisateur.
 * La migration crée la table avec deux colonnes : "key" (clé de configuration) et "value" (valeur de configuration).
 * La colonne "key" est définie comme clé primaire pour garantir l'unicité des clés de configuration.
 * La fonction "up" est exécutée lors de l'application de la migration, tandis que la fonction "down" est exécutée lors du rollback de la migration.
 */

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS settings (
        \`key\` VARCHAR(255) PRIMARY KEY,
        \`value\` VARCHAR(255) NOT NULL
      )
    `);
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query("DROP TABLE IF EXISTS settings");
  } finally {
    conn.release();
  }
}
