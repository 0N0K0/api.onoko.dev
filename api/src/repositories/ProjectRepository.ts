import mariadb from "mariadb";
import crypto from "crypto";
import { Project, ProjectRow } from "../types/projectTypes";
import { Role } from "../types/roleTypes";
import { Category } from "../types/categoryTypes";
import { Stack } from "../types/stackTypes";
import { Media } from "../types/mediaTypes";
import {
  withConnection,
  withTransaction,
  buildSetClause,
} from "../database/dbHelpers";

// Repository pour les opérations liées aux projets dans la base de données
export default class ProjectRepository {
  // Constructeur qui initialise le repository avec un pool de connexions à la base de données MariaDB
  constructor(private pool: mariadb.Pool) {}

  /**
   * Récupère tous les projets avec leurs relations (catégories, rôles, coworkers, stacks)
   * @return Liste de tous les projets
   * @throws {Error} Une erreur si la récupération des projets échoue pour une raison quelconque.
   */
  async getAll(): Promise<Project[]> {
    return withConnection(this.pool, async (conn) => {
      const projectRows: ProjectRow[] = await conn.query(
        `SELECT * FROM project ORDER BY start_date DESC`,
      );

      if (projectRows.length === 0) return [];

      const ids = projectRows.map((p) => p.id);
      const placeholders = ids.map(() => "?").join(",");

      // 5 requêtes batch au lieu de 5N requêtes individuelles
      const [categories, roles, coworkers, stacks, mockups] = await Promise.all(
        [
          conn.query(
            `SELECT project_id, category_id FROM project_category WHERE project_id IN (${placeholders})`,
            ids,
          ),
          conn.query(
            `SELECT project_id, role_id FROM project_role WHERE project_id IN (${placeholders})`,
            ids,
          ),
          conn.query(
            `SELECT project_id, coworker_id, role_id FROM project_coworker WHERE project_id IN (${placeholders})`,
            ids,
          ),
          conn.query(
            `SELECT project_id, stack_id, version, section FROM project_stack WHERE project_id IN (${placeholders})`,
            ids,
          ),
          conn.query(
            `SELECT project_id, media_id, position FROM project_mockup WHERE project_id IN (${placeholders}) ORDER BY position ASC`,
            ids,
          ),
        ],
      );

      const categoriesByProject = new Map<string, string[]>();
      for (const row of categories) {
        if (!categoriesByProject.has(row.project_id))
          categoriesByProject.set(row.project_id, []);
        categoriesByProject.get(row.project_id)!.push(row.category_id);
      }

      const rolesByProject = new Map<string, string[]>();
      for (const row of roles) {
        if (!rolesByProject.has(row.project_id))
          rolesByProject.set(row.project_id, []);
        rolesByProject.get(row.project_id)!.push(row.role_id);
      }

      const coworkersByProject = new Map<
        string,
        Map<string, { id: string; roles: string[] }>
      >();
      for (const row of coworkers) {
        if (!coworkersByProject.has(row.project_id))
          coworkersByProject.set(row.project_id, new Map());
        const cwMap = coworkersByProject.get(row.project_id)!;
        if (!cwMap.has(row.coworker_id))
          cwMap.set(row.coworker_id, { id: row.coworker_id, roles: [] });
        if (row.role_id) cwMap.get(row.coworker_id)!.roles.push(row.role_id);
      }

      const stacksByProject = new Map<
        string,
        { id: string; version?: string; section?: string }[]
      >();
      for (const row of stacks) {
        if (!stacksByProject.has(row.project_id))
          stacksByProject.set(row.project_id, []);
        stacksByProject.get(row.project_id)!.push({
          id: row.stack_id,
          version: row.version,
          section: row.section,
        });
      }

      const mockupsByProject = new Map<
        string,
        { id: string; position: number }[]
      >();
      for (const row of mockups) {
        if (!mockupsByProject.has(row.project_id))
          mockupsByProject.set(row.project_id, []);
        mockupsByProject
          .get(row.project_id)!
          .push({ id: row.media_id, position: row.position });
      }

      return projectRows.map((projectRow) =>
        this._buildProject(projectRow, {
          categories: categoriesByProject.get(projectRow.id) ?? [],
          roles: rolesByProject.get(projectRow.id) ?? [],
          coworkers: Array.from(
            coworkersByProject.get(projectRow.id)?.values() ?? [],
          ),
          stacks: stacksByProject.get(projectRow.id) ?? [],
          mockupImages: mockupsByProject.get(projectRow.id) ?? [],
        }),
      );
    });
  }

  /**
   * Hydrate un projet avec ses relations (catégories, rôles, coworkers, stacks)
   * @param conn Connexion à la base de données
   * @param projectRow Projet à hydrater (doit contenir au moins l'ID)
   */
  private _buildProject(
    projectRow: ProjectRow,
    relations: {
      categories: string[];
      roles: string[];
      coworkers: { id: string; roles: string[] }[];
      stacks: { id: string; version?: string; section?: string }[];
      mockupImages: { id: string; position: number }[];
    },
  ): Project {
    const project: Project = {
      id: projectRow.id,
      label: projectRow.label,
      thumbnail: projectRow.thumbnail_id,
      startDate: projectRow.start_date,
      endDate: projectRow.end_date,
      categories: relations.categories,
      roles: relations.roles,
      coworkers: relations.coworkers,
      stacks: relations.stacks,
    };

    if (projectRow.website_url) {
      project.website = {
        url: projectRow.website_url,
        label: projectRow.website_label || "",
      };
    }

    if (projectRow.mockup_url) {
      project.mockup = {
        url: projectRow.mockup_url,
        label: projectRow.mockup_label || "",
        images: relations.mockupImages,
      };
    }

    if (projectRow.client_label) {
      project.client = {
        label: projectRow.client_label,
        logo: projectRow.client_logo_id,
      };
    }

    if (projectRow.manager_name) {
      project.manager = {
        name: projectRow.manager_name,
        email: projectRow.manager_email,
      };
    }

    if (
      projectRow.intro_context ||
      projectRow.intro_objective ||
      projectRow.intro_client
    ) {
      project.intro = {
        context: projectRow.intro_context,
        objective: projectRow.intro_objective,
        client: projectRow.intro_client,
      };
    }

    if (
      projectRow.presentation_description ||
      projectRow.presentation_issue ||
      projectRow.presentation_audience
    ) {
      project.presentation = {
        description: projectRow.presentation_description,
        issue: projectRow.presentation_issue,
        audience: projectRow.presentation_audience,
      };
    }

    if (
      projectRow.need_features ||
      projectRow.need_functional_constraints ||
      projectRow.need_technical_constraints
    ) {
      project.need = {
        features: projectRow.need_features,
        functionalConstraints: projectRow.need_functional_constraints,
        technicalConstraints: projectRow.need_technical_constraints,
      };
    }

    if (
      projectRow.organization_workload ||
      projectRow.organization_anticipation ||
      projectRow.organization_methodology ||
      projectRow.organization_evolution ||
      projectRow.organization_validation
    ) {
      project.organization = {
        workload: projectRow.organization_workload,
        anticipation: projectRow.organization_anticipation,
        methodology: projectRow.organization_methodology,
        evolution: projectRow.organization_evolution,
        validation: projectRow.organization_validation,
      };
    }

    if (
      projectRow.kpis_issues !== undefined ||
      projectRow.kpis_points !== undefined ||
      projectRow.kpis_commits !== undefined ||
      projectRow.kpis_pull_requests !== undefined
    ) {
      project.kpis = {
        issues: projectRow.kpis_issues,
        points: projectRow.kpis_points,
        commits: projectRow.kpis_commits,
        pullRequests: projectRow.kpis_pull_requests,
      };
    }

    if (projectRow.feedback || projectRow.feedback_client) {
      project.feedback = {
        general: projectRow.feedback,
        client: projectRow.feedback_client,
      };
    }

    return project;
  }

  /**
   * Crée un nouveau projet avec ses relations (catégories, rôles, coworkers, stacks)
   * @param {Omit<Project, "id">} project Données du projet à créer (sans l'ID)
   * @return {boolean} Indique si la création a réussi
   * @throws {Error} Une erreur si la création échoue pour une raison quelconque, notamment si la requête SQL échoue ou si les données fournies sont invalides.
   */
  async create(project: Omit<Project, "id">): Promise<boolean> {
    const id = crypto.randomUUID();
    await withTransaction(this.pool, async (conn) => {
      // Insère le projet principal
      await conn.query(
        `INSERT INTO project (
          id, label, thumbnail_id, website_url, website_label, mockup_url, mockup_label, client_label, client_logo_id, manager_name, manager_email, start_date, end_date, intro_context, intro_objective, intro_client, presentation_description, presentation_issue, presentation_audience, need_features, need_functional_constraints, need_technical_constraints, organization_workload, organization_anticipation, organization_methodology, organization_evolution, organization_validation, feedback, feedback_client, kpis_issues, kpis_points, kpis_commits, kpis_pull_requests
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          project.label,
          project.thumbnail || null,
          project.website?.url || null,
          project.website?.label || null,
          project.mockup?.url || null,
          project.mockup?.label || null,
          project.client?.label || null,
          project.client?.logo || null,
          project.manager?.name || null,
          project.manager?.email || null,
          project.startDate ? new Date(project.startDate) : null,
          project.endDate ? new Date(project.endDate) : null,
          project.intro?.context || null,
          project.intro?.objective || null,
          project.intro?.client || null,
          project.presentation?.description || null,
          project.presentation?.issue || null,
          project.presentation?.audience || null,
          project.need?.features || null,
          project.need?.functionalConstraints || null,
          project.need?.technicalConstraints || null,
          project.organization?.workload || null,
          project.organization?.anticipation || null,
          project.organization?.methodology || null,
          project.organization?.evolution || null,
          project.organization?.validation || null,
          project.feedback?.general || null,
          project.feedback?.client || null,
          project.kpis?.issues || null,
          project.kpis?.points || null,
          project.kpis?.commits || null,
          project.kpis?.pullRequests || null,
        ],
      );

      if (project.mockup?.images?.length) {
        await conn.batch(
          `INSERT INTO project_mockup (project_id, media_id, position) VALUES (?, ?, ?)`,
          project.mockup.images.map((mediaId, i) => [id, mediaId, i]),
        );
      }

      if (project.categories?.length) {
        await conn.batch(
          `INSERT INTO project_category (project_id, category_id) VALUES (?, ?)`,
          project.categories.map((c) => [id, c]),
        );
      }

      if (project.roles?.length) {
        await conn.batch(
          `INSERT INTO project_role (project_id, role_id) VALUES (?, ?)`,
          project.roles.map((r) => [id, r]),
        );
      }

      if (project.coworkers?.length) {
        const coworkerRows = project.coworkers.flatMap(
          ({ id: coworker_id, roles }) =>
            (roles ?? []).map((role_id) => [id, coworker_id, role_id]),
        );
        if (coworkerRows.length) {
          await conn.batch(
            `INSERT INTO project_coworker (project_id, coworker_id, role_id) VALUES (?, ?, ?)`,
            coworkerRows,
          );
        }
      }

      if (project.stacks?.length) {
        await conn.batch(
          `INSERT INTO project_stack (project_id, stack_id, version, section) VALUES (?, ?, ?, ?)`,
          project.stacks.map(({ id: stack_id, version, section }) => [
            id,
            stack_id,
            version ?? null,
            section ?? null,
          ]),
        );
      }
    });
    return true;
  }

  /**
   * Met à jour un projet existant avec ses relations (catégories, rôles, coworkers, stacks)
   * @param id ID du projet à mettre à jour
   * @param project Données du projet à mettre à jour (sans l'ID)
   * @return {boolean} Indique si la mise à jour a réussi
   * @throws {Error} Une erreur si la mise à jour échoue pour une raison quelconque, notamment si la requête SQL échoue ou si les données fournies sont invalides.
   */
  async update(
    id: string,
    project: Partial<Omit<Project, "id">>,
  ): Promise<boolean> {
    await withTransaction(this.pool, async (conn) => {
      // Construit dynamiquement la requête de mise à jour
      const set = buildSetClause({
        label: project.label,
        thumbnail_id: project.thumbnail,
        website_url: project.website?.url,
        website_label: project.website?.label,
        mockup_url: project.mockup?.url,
        mockup_label: project.mockup?.label,
        client_label: project.client?.label,
        client_logo_id: project.client?.logo,
        manager_name: project.manager?.name,
        manager_email: project.manager?.email,
        start_date: project.startDate ? new Date(project.startDate) : undefined,
        end_date: project.endDate ? new Date(project.endDate) : undefined,
        intro_context: project.intro?.context,
        intro_objective: project.intro?.objective,
        intro_client: project.intro?.client,
        presentation_description: project.presentation?.description,
        presentation_issue: project.presentation?.issue,
        presentation_audience: project.presentation?.audience,
        need_features: project.need?.features,
        need_functional_constraints: project.need?.functionalConstraints,
        need_technical_constraints: project.need?.technicalConstraints,
        organization_workload: project.organization?.workload,
        organization_anticipation: project.organization?.anticipation,
        organization_methodology: project.organization?.methodology,
        organization_evolution: project.organization?.evolution,
        organization_validation: project.organization?.validation,
        feedback: project.feedback?.general,
        feedback_client: project.feedback?.client,
        kpis_issues: project.kpis?.issues,
        kpis_points: project.kpis?.points,
        kpis_commits: project.kpis?.commits,
        kpis_pull_requests: project.kpis?.pullRequests,
      });
      if (set) {
        await conn.query(`UPDATE project SET ${set.sql} WHERE id = ?`, [
          ...set.values,
          id,
        ]);
      }

      // Met à jour les catégories liées
      if (project.categories) {
        const existing = (
          await conn.query(
            `SELECT category_id FROM project_category WHERE project_id = ?`,
            [id],
          )
        ).map((r: { category_id: string }) => r.category_id);
        const toAdd = project.categories.filter(
          (c: string | Category) =>
            !existing.includes(typeof c === "string" ? c : c.id),
        );
        const toRemove = existing.filter(
          (c: string) =>
            !project.categories?.some(
              (category: string | Category) =>
                (typeof category === "string" ? category : category.id) === c,
            ),
        );
        for (const categoryId of toRemove) {
          await conn.query(
            `DELETE FROM project_category WHERE project_id = ? AND category_id = ?`,
            [id, categoryId],
          );
        }
        for (const categoryId of toAdd) {
          await conn.query(
            `INSERT INTO project_category (project_id, category_id) VALUES (?, ?)`,
            [id, categoryId],
          );
        }
      }

      // Met à jour les rôles liés
      if (project.roles) {
        const existing = (
          await conn.query(
            `SELECT role_id FROM project_role WHERE project_id = ?`,
            [id],
          )
        ).map((r: { role_id: string }) => r.role_id);
        const toAdd = project.roles.filter(
          (r: string | Role) =>
            !existing.includes(typeof r === "string" ? r : r.id),
        );
        const toRemove = existing.filter(
          (r: string) =>
            !project.roles?.some(
              (role: string | Role) =>
                (typeof role === "string" ? role : role.id) === r,
            ),
        );
        for (const roleId of toRemove) {
          await conn.query(
            `DELETE FROM project_role WHERE project_id = ? AND role_id = ?`,
            [id, roleId],
          );
        }
        for (const roleId of toAdd) {
          await conn.query(
            `INSERT INTO project_role (project_id, role_id) VALUES (?, ?)`,
            [id, roleId],
          );
        }
      }

      // Met à jour les coworkers liés
      if (project.coworkers) {
        const existing = await conn.query(
          `SELECT coworker_id, role_id FROM project_coworker WHERE project_id = ?`,
          [id],
        );
        const inputPairs = project.coworkers.flatMap((cw) =>
          (cw.roles || []).map((role: string) => ({
            coworker_id: cw.id,
            role_id: role,
          })),
        );
        const toAdd = inputPairs.filter(
          (p: { coworker_id: string; role_id: string }) =>
            !existing.some(
              (e: { coworker_id: string; role_id: string }) =>
                e.coworker_id === p.coworker_id && e.role_id === p.role_id,
            ),
        );
        const toRemove = existing.filter(
          (e: { coworker_id: string; role_id: string }) =>
            !inputPairs.some(
              (p: { coworker_id: string; role_id: string }) =>
                p.coworker_id === e.coworker_id && p.role_id === e.role_id,
            ),
        );
        for (const { coworker_id, role_id } of toRemove) {
          await conn.query(
            `DELETE FROM project_coworker WHERE project_id = ? AND coworker_id = ? AND role_id = ?`,
            [id, coworker_id, role_id],
          );
        }
        for (const { coworker_id, role_id } of toAdd) {
          await conn.query(
            `INSERT INTO project_coworker (project_id, coworker_id, role_id) VALUES (?, ?, ?)`,
            [id, coworker_id, role_id],
          );
        }
      }

      // Met à jour les stacks liés
      if (project.stacks) {
        const existing = await conn.query(
          `SELECT stack_id, version, section FROM project_stack WHERE project_id = ?`,
          [id],
        );
        const inputStacks = project.stacks.map(
          (
            s: Partial<Stack> & {
              section?: string | null;
              version?: string | null;
            },
          ) => ({
            stack_id: s.id,
            version: s.version ?? null,
            section: s.section ?? null,
          }),
        );
        const toAdd = inputStacks.filter(
          (s) =>
            !existing.some(
              (e: {
                stack_id: string | undefined;
                version: string | null;
                section: string | null;
              }) =>
                e.stack_id === s.stack_id &&
                e.version === s.version &&
                e.section === s.section,
            ),
        );
        const toRemove = existing.filter(
          (e: {
            stack_id: string | undefined;
            version: string | null;
            section: string | null;
          }) =>
            !inputStacks.some(
              (s: {
                stack_id: string | undefined;
                version: string | null;
                section: string | null;
              }) =>
                e.stack_id === s.stack_id &&
                e.version === s.version &&
                e.section === s.section,
            ),
        );
        for (const { stack_id, version, section } of toRemove) {
          await conn.query(
            `DELETE FROM project_stack WHERE project_id = ? AND stack_id = ? AND version <=> ? AND section <=> ?`,
            [id, stack_id, version, section],
          );
        }
        for (const { stack_id, version, section } of toAdd) {
          await conn.query(
            `INSERT INTO project_stack (project_id, stack_id, version, section) VALUES (?, ?, ?, ?)`,
            [id, stack_id, version, section],
          );
        }
      }

      // Met à jour les images mockup
      if (project.mockup?.images) {
        const existing = (
          await conn.query(
            `SELECT media_id, position FROM project_mockup WHERE project_id = ?`,
            [id],
          )
        ).map((r: { media_id: string; position: number }) => r.media_id);
        const toAdd = project.mockup.images.filter(
          (
            m: { id: string; position: number } | string,
          ): m is { id: string; position: number } =>
            typeof m === "object" && !existing.includes(m.id),
        );
        const toEdit = project.mockup.images.filter(
          (
            m: { id: string; position: number } | string,
          ): m is { id: string; position: number } =>
            typeof m === "object" && existing.includes(m.id),
        );
        const toRemove = existing.filter(
          (m: string) =>
            !project.mockup?.images?.some(
              (
                image: { id: string; position: number } | string,
              ): image is { id: string; position: number } =>
                typeof image === "object" && image.id === m,
            ),
        );
        for (const media of toRemove) {
          await conn.query(
            `DELETE FROM project_mockup WHERE project_id = ? AND media_id = ?`,
            [id, media],
          );
        }
        for (const media of toEdit) {
          const position = project.mockup.images
            .filter(
              (m): m is { id: string; position: number } =>
                typeof m === "object",
            )
            .findIndex((m) => m.id === media.id);
          await conn.query(
            `UPDATE project_mockup SET position = ? WHERE project_id = ? AND media_id = ?`,
            [position, id, media.id],
          );
        }
        for (const media of toAdd) {
          const position = project.mockup.images
            .filter(
              (m): m is { id: string; position: number } =>
                typeof m === "object",
            )
            .findIndex((m) => m.id === media.id);
          await conn.query(
            `INSERT INTO project_mockup (project_id, media_id, position) VALUES (?, ?, ?)`,
            [id, media.id, position],
          );
        }
      }
    });
    return true;
  }

  /**
   * Supprime un projet et toutes ses relations (catégories, rôles, coworkers, stacks)
   * @param id ID du projet à supprimer
   * @return {boolean} Indique si la suppression a réussi
   * @throws {Error} Une erreur si la suppression échoue pour une raison quelconque, notamment si la requête SQL échoue ou si l'ID fourni est invalide.
   */
  async delete(id: string): Promise<boolean> {
    await withConnection(this.pool, (conn) =>
      conn.query(`DELETE FROM project WHERE id = ?`, [id]),
    );
    return true;
  }
}
