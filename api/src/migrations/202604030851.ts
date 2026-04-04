import { Pool } from "mariadb/*";
import { MigrationParams } from "umzug";

/**
 * Migration pour créer les tables "project", "project_role", "project_coworker", "project_stack", "project_category" et "project_mockup" dans la base de données.
 * La table "project" est utilisée pour stocker les informations des projets, avec des colonnes pour le nom, le logo, le client, le manager, les dates et les descriptions.
 * La table "project_role" est une table de liaison entre les projets et les rôles, avec des clés étrangères vers les tables "project" et "role".
 * La table "project_coworker" est une table de liaison entre les projets, les collaborateurs et les rôles, avec des clés étrangères vers les tables "project", "coworker" et "role".
 * La table "project_stack" est une table de liaison entre les projets et les stacks, avec des clés étrangères vers les tables "project" et "stack".
 * La table "project_category" est une table de liaison entre les projets et les catégories, avec des clés étrangères vers les tables "project" et "category".
 * La table "project_mockup" est une table de liaison entre les projets et les mockups, avec des clés étrangères vers les tables "project" et "mockup".
 * Les fonctions "up" et "down" sont exécutées lors de l'application ou du rollback de la migration, respectivement.
 */

export async function up({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS project (
        id VARCHAR(255) PRIMARY KEY,
        label VARCHAR(255) UNIQUE NOT NULL,
        thumbnail VARCHAR(255),
        website_url VARCHAR(255),
        website_label VARCHAR(255),
        mockup_url VARCHAR(255),
        mockup_label VARCHAR(255),
        client_label VARCHAR(255),
        client_logo VARCHAR(255),
        manager_name VARCHAR(255),
        manager_email VARCHAR(255),
        start_date DATE,
        end_date DATE,
        intro_context TEXT,
        intro_objective TEXT,
        intro_client TEXT,
        presentation_description TEXT,
        presentation_issue TEXT,
        presentation_audience TEXT,
        need_features TEXT,
        need_functional_constraints TEXT,
        need_technical_constraints TEXT,
        organization_workload TEXT,
        organization_anticipation TEXT,
        organization_methodology TEXT,
        organization_evolution TEXT,
        organization_validation TEXT,
        feedback TEXT,
        feedback_client TEXT,
        kpis_issues INT,
        kpis_points INT,
        kpis_commits INT,
        kpis_pull_requests INT
      );`);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS project_role (
        project_id VARCHAR(255) NOT NULL,
        role_id VARCHAR(255) NOT NULL,
        PRIMARY KEY (project_id, role_id),
        FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE
      );`);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS project_coworker (
        project_id VARCHAR(255) NOT NULL,
        coworker_id VARCHAR(255) NOT NULL,
        role_id VARCHAR(255) NOT NULL,
        PRIMARY KEY (project_id, coworker_id, role_id),
        FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
        FOREIGN KEY (coworker_id) REFERENCES coworker(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES coworker_role(role_id) ON DELETE CASCADE
      );`);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS project_stack (
        project_id VARCHAR(255) NOT NULL,
        stack_id VARCHAR(255) NOT NULL,
        version VARCHAR(255),
        section VARCHAR(255),
        PRIMARY KEY (project_id, stack_id, section),
        FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
        FOREIGN KEY (stack_id) REFERENCES stack(id) ON DELETE CASCADE
      );`);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS project_category (
        project_id VARCHAR(255) NOT NULL,
        category_id VARCHAR(255) NOT NULL,
        PRIMARY KEY (project_id, category_id),
        FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE
      );`);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS project_mockup (
        project_id VARCHAR(255) NOT NULL,
        mockup VARCHAR(255) NOT NULL,
        PRIMARY KEY (project_id, mockup),
        FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
      );`);
  } finally {
    conn.release();
  }
}

export async function down({ context: pool }: MigrationParams<Pool>) {
  const conn = await pool.getConnection();
  try {
    await conn.query("DROP TABLE IF EXISTS project_coworker");
    await conn.query("DROP TABLE IF EXISTS project_role");
    await conn.query("DROP TABLE IF EXISTS project_stack");
    await conn.query("DROP TABLE IF EXISTS project_category");
    await conn.query("DROP TABLE IF EXISTS project_mockup");
    await conn.query("DROP TABLE IF EXISTS project");
  } finally {
    conn.release();
  }
}
