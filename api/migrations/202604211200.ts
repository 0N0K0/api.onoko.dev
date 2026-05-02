import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

/**
 * Migration pour ajouter des index explicites sur les clés étrangères.
 * Sans ces index, les lookups inverses sur les tables de jonction
 * et les filtres par FK entraînent des full table scans.
 */

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    // category : auto-référence parent
    await conn.query(
      `CREATE INDEX IF NOT EXISTS idx_category_parent_id ON category(parent_id)`,
    );

    // stack : FK vers category et medias
    await conn.query(
      `CREATE INDEX IF NOT EXISTS idx_stack_category_id ON stack(category_id)`,
    );
    await conn.query(
      `CREATE INDEX IF NOT EXISTS idx_stack_icon_id ON stack(icon_id)`,
    );

    // stack_skill : lookup par stack
    await conn.query(
      `CREATE INDEX IF NOT EXISTS idx_stack_skill_stack_id ON stack_skill(stack_id)`,
    );

    // coworker_role : lookup inverse par role
    await conn.query(
      `CREATE INDEX IF NOT EXISTS idx_coworker_role_role_id ON coworker_role(role_id)`,
    );

    // project_role : lookup inverse par role
    await conn.query(
      `CREATE INDEX IF NOT EXISTS idx_project_role_role_id ON project_role(role_id)`,
    );

    // project_coworker : lookup par coworker et par role
    await conn.query(
      `CREATE INDEX IF NOT EXISTS idx_project_coworker_coworker_id ON project_coworker(coworker_id)`,
    );
    await conn.query(
      `CREATE INDEX IF NOT EXISTS idx_project_coworker_role_id ON project_coworker(role_id)`,
    );

    // project_stack : lookup inverse par stack
    await conn.query(
      `CREATE INDEX IF NOT EXISTS idx_project_stack_stack_id ON project_stack(stack_id)`,
    );

    // project_category : lookup inverse par category
    await conn.query(
      `CREATE INDEX IF NOT EXISTS idx_project_category_category_id ON project_category(category_id)`,
    );

    // project_mockup : lookup par media
    await conn.query(
      `CREATE INDEX IF NOT EXISTS idx_project_mockup_media_id ON project_mockup(media_id)`,
    );

    // medias : lookup par category
    await conn.query(
      `CREATE INDEX IF NOT EXISTS idx_medias_category ON medias(category)`,
    );

    // project : FK vers medias
    await conn.query(
      `CREATE INDEX IF NOT EXISTS idx_project_thumbnail_id ON project(thumbnail_id)`,
    );
    await conn.query(
      `CREATE INDEX IF NOT EXISTS idx_project_client_logo_id ON project(client_logo_id)`,
    );
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`DROP INDEX IF EXISTS idx_category_parent_id ON category`);
    await conn.query(`DROP INDEX IF EXISTS idx_stack_category_id ON stack`);
    await conn.query(`DROP INDEX IF EXISTS idx_stack_icon_id ON stack`);
    await conn.query(
      `DROP INDEX IF EXISTS idx_stack_skill_stack_id ON stack_skill`,
    );
    await conn.query(
      `DROP INDEX IF EXISTS idx_coworker_role_role_id ON coworker_role`,
    );
    await conn.query(
      `DROP INDEX IF EXISTS idx_project_role_role_id ON project_role`,
    );
    await conn.query(
      `DROP INDEX IF EXISTS idx_project_coworker_coworker_id ON project_coworker`,
    );
    await conn.query(
      `DROP INDEX IF EXISTS idx_project_coworker_role_id ON project_coworker`,
    );
    await conn.query(
      `DROP INDEX IF EXISTS idx_project_stack_stack_id ON project_stack`,
    );
    await conn.query(
      `DROP INDEX IF EXISTS idx_project_category_category_id ON project_category`,
    );
    await conn.query(
      `DROP INDEX IF EXISTS idx_project_mockup_media_id ON project_mockup`,
    );
    await conn.query(`DROP INDEX IF EXISTS idx_medias_category ON medias`);
    await conn.query(
      `DROP INDEX IF EXISTS idx_project_thumbnail_id ON project`,
    );
    await conn.query(
      `DROP INDEX IF EXISTS idx_project_client_logo_id ON project`,
    );
  } finally {
    conn.release();
  }
}
