import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

/**
 * Migration pour créer la table "medias"
 * et pour ajouter les clés étrangères vers la table "medias"
 *  - pour la colonne "icon" de la table "stack"
 *  - et pour les colonnes "thumbnail", "client_logo" et "mockup" de la table "project".
 * La table "medias" est utilisée pour stocker les informations des médias, avec des colonnes pour le chemin et le type du média.
 * Les fonctions "up" et "down" sont exécutées lors de l'application ou du rollback de la migration, respectivement.
 */

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS medias (
          id VARCHAR(255) PRIMARY KEY,
          path VARCHAR(255) NOT NULL,
          type VARCHAR(255) NOT NULL,
          category VARCHAR(255) NOT NULL,
          FOREIGN KEY (category) REFERENCES category(id) ON DELETE CASCADE
      );`);
    await conn.query(`
      ALTER TABLE stack
      CHANGE COLUMN icon icon_id VARCHAR(255),
      ADD FOREIGN KEY (icon_id) REFERENCES medias(id) ON DELETE SET NULL
    `);
    await conn.query(`
      ALTER TABLE project
      CHANGE COLUMN thumbnail thumbnail_id VARCHAR(255),
      ADD FOREIGN KEY (thumbnail_id) REFERENCES medias(id) ON DELETE SET NULL
    `);
    await conn.query(`
      ALTER TABLE project
      CHANGE COLUMN client_logo client_logo_id VARCHAR(255),
      ADD FOREIGN KEY (client_logo_id) REFERENCES medias(id) ON DELETE SET NULL;
    `);
    await conn.query(`
      ALTER TABLE project_mockup
      CHANGE COLUMN mockup media_id VARCHAR(255),
      ADD FOREIGN KEY (media_id) REFERENCES medias(id) ON DELETE CASCADE;
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
      DROP FOREIGN KEY project_thumbnail_id_foreign,
      CHANGE COLUMN thumbnail_id thumbnail VARCHAR(255);
    `);
    await conn.query(`
      ALTER TABLE project
      DROP FOREIGN KEY project_client_logo_id_foreign,
      CHANGE COLUMN client_logo_id client_logo VARCHAR(255);
    `);
    await conn.query(`
      ALTER TABLE project_mockup
      DROP FOREIGN KEY project_mockup_media_id_foreign,
      CHANGE COLUMN media_id mockup VARCHAR(255);
     `);
    await conn.query(`
      DROP TABLE IF EXISTS medias;
     `);
  } finally {
    conn.release();
  }
}
