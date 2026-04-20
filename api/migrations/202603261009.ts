import { MigrationParams } from "umzug";
import { Pool } from "mariadb";

/**
 * Migration pour créer la table "password_reset_tokens" dans la base de données.
 * La table "password_reset_tokens" est utilisée pour stocker les tokens de réinitialisation de mot de passe, associés à l'email de l'utilisateur et à une date d'expiration.
 * La migration crée la table avec trois colonnes : "token" (le token de réinitialisation), "email" (l'email de l'utilisateur) et "expires" (la date d'expiration du token).
 * La colonne "token" est définie comme clé primaire pour garantir l'unicité des tokens de réinitialisation.
 * La fonction "up" est exécutée lors de l'application de la migration, tandis que la fonction "down" est exécutée lors du rollback de la migration.
 */

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        expires DATETIME NOT NULL
      )
    `);
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query("DROP TABLE IF EXISTS password_reset_tokens");
  } finally {
    conn.release();
  }
}
