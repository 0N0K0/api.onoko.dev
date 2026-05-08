import { MigrationParams } from "umzug";
import { Pool } from "mariadb";

/**
 * Migration pour créer la table "testimony" dans la base de données.
 * La table "testimony" est utilisée pour stocker les témoignages des utilisateurs.
 * La migration crée la table avec quatre colonnes : "id" (identifiant unique), "name" (nom de l'utilisateur), "company" (nom de l'entreprise) et "content" (contenu du témoignage).
 * La colonne "id" est définie comme clé primaire pour garantir l'unicité des identifiants.
 * La fonction "up" est exécutée lors de l'application de la migration, tandis que la fonction "down" est exécutée lors du rollback de la migration.
 */

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS testimony (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255) NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query("DROP TABLE IF EXISTS testimony");
  } finally {
    conn.release();
  }
}
