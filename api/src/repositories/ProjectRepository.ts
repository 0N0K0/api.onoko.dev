import mariadb from "mariadb";
import crypto from "crypto";
import { Project, ProjectInput } from "../types/projectTypes";
import { saveImageFile } from "../utils/imageUtils";
import path from "path";

export default class ProjectRepository {
  private imageBasePath = "/assets/project/";

  constructor(private pool: mariadb.Pool) {}

  /**
   * Récupère tous les projets avec leurs relations (catégories, rôles, coworkers, stacks)
   * @return Liste de tous les projets
   */
  async getAll(): Promise<Project[]> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const projects = await conn.query(`SELECT * FROM project`);
      for (const project of projects) {
        await this._hydrateProject(conn, project);
      }
      return projects;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Récupère un projet par son ID ou son label, avec ses relations (catégories, rôles, coworkers, stacks)
   * @param key "id" ou "label"
   * @param value Valeur de l'ID ou du label
   * @return Le projet correspondant ou null s'il n'existe pas
   */
  async get(key: "id" | "label", value: any): Promise<Project | null> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const projects = await conn.query(
        `SELECT * FROM project WHERE ${key} = ?`,
        [value],
      );
      if (projects.length === 0) return null;
      const project = projects[0];
      await this._hydrateProject(conn, project);
      return project;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Hydrate un projet avec ses relations (catégories, rôles, coworkers, stacks)
   * @param conn Connexion à la base de données
   * @param project Projet à hydrater (doit contenir au moins l'ID)
   */
  private async _hydrateProject(conn: mariadb.PoolConnection, project: any) {
    // Récupère les catégories liées au projet
    const categories = await conn.query(
      `
        SELECT c.* FROM category c
        INNER JOIN project_category pc ON pc.category_id = c.id
        WHERE pc.project_id = ?
    `,
      [project.id],
    );
    project.categories = categories;

    // Récupère les rôles liés au projet
    const roles = await conn.query(
      `
        SELECT r.* FROM role r
        INNER JOIN project_role pr ON pr.role_id = r.id
        WHERE pr.project_id = ?
      `,
      [project.id],
    );
    project.roles = roles;

    // Récupère les coworkers liés au projet
    const coworkers = await conn.query(
      `
        SELECT c.*, pc.role_id as roleId
        FROM coworker c
        INNER JOIN project_coworker pc ON pc.coworker_id = c.id
        WHERE pc.project_id = ?
      `,
      [project.id],
    );
    // Groupe les rôles par coworker
    const coworkerMap: Record<string, any> = {};
    for (const c of coworkers) {
      if (!coworkerMap[c.id]) {
        coworkerMap[c.id] = { ...c, roles: [] };
      }
      if (c.roleId) coworkerMap[c.id].roles.push(c.roleId);
    }
    project.coworkers = Object.values(coworkerMap);

    // Récupère les stacks liés au projet
    const stacks = await conn.query(
      `
        SELECT s.*, ps.version, ps.section
        FROM stack s
        INNER JOIN project_stack ps ON ps.stack_id = s.id
        WHERE ps.project_id = ?
      `,
      [project.id],
    );
    project.stacks = stacks.map((s: any) => ({
      id: s.id,
      label: s.label,
      iconUrl: s.icon ? `/assets/stack/${s.icon}` : undefined,
      version: s.version,
      section: s.section,
    }));

    // Construit l'URL de la miniature (thumbnail) si elle existe
    if (project.thumbnail) {
      project.thumbnailUrl = `${this.imageBasePath}${project.thumbnail}`;
      delete project.thumbnail;
    }

    // Construit l'objet website si les champs sont présents
    if (project.website_url || project.website_label) {
      project.website = {
        url: project.website_url,
        label: project.website_label,
      };
      delete project.website_url;
      delete project.website_label;
    }

    // Construit l'objet mockup et ajoute les images mockup si elles existent
    let imagesUrls: string[] | undefined = undefined;
    const mockupImages = await conn.query(
      `SELECT mockup FROM project_mockup WHERE project_id = ?`,
      [project.id],
    );
    if (mockupImages.length) {
      imagesUrls = mockupImages.map(
        (m: any) => `${this.imageBasePath}${m.mockup}`,
      );
    }
    if (project.mockup_url || project.mockup_label || imagesUrls) {
      project.mockup = {
        url: project.mockup_url,
        label: project.mockup_label,
        imagesUrls,
      };
      delete project.mockup_url;
      delete project.mockup_label;
    }

    // Construit l'objet client si les champs sont présents
    if (project.client_label || project.client_logo) {
      project.client = {
        label: project.client_label,
        logoUrl: project.client_logo
          ? `${this.imageBasePath}${project.client_logo}`
          : undefined,
      };
      delete project.client_label;
      delete project.client_logo;
    }

    // Construit l'objet manager si les champs sont présents
    if (project.manager_name) {
      project.manager = {
        name: project.manager_name,
        email: project.manager_email,
      };
      delete project.manager_name;
      delete project.manager_email;
    }

    // Construit l'objet intro si les champs sont présents
    if (
      project.intro_context ||
      project.intro_objective ||
      project.intro_client
    ) {
      project.intro = {
        context: project.intro_context,
        objective: project.intro_objective,
        client: project.intro_client,
      };
      delete project.intro_context;
      delete project.intro_objective;
      delete project.intro_client;
    }

    // Construit l'objet presentation si les champs sont présents
    if (
      project.presentation_description ||
      project.presentation_issue ||
      project.presentation_audience
    ) {
      project.presentation = {
        description: project.presentation_description,
        issue: project.presentation_issue,
        audience: project.presentation_audience,
      };
      delete project.presentation_description;
      delete project.presentation_issue;
      delete project.presentation_audience;
    }

    // Construit l'objet need si les champs sont présents
    if (
      project.need_features ||
      project.need_functional_constraints ||
      project.need_technical_constraints
    ) {
      project.need = {
        features: project.need_features,
        functionalConstraints: project.need_functional_constraints,
        technicalConstraints: project.need_technical_constraints,
      };
      delete project.need_features;
      delete project.need_functional_constraints;
      delete project.need_technical_constraints;
    }

    // Construit l'objet organization si les champs sont présents
    if (
      project.organization_workload ||
      project.organization_anticipation ||
      project.organization_methodology ||
      project.organization_evolution ||
      project.organization_validation
    ) {
      project.organization = {
        workload: project.organization_workload,
        anticipation: project.organization_anticipation,
        methodology: project.organization_methodology,
        evolution: project.organization_evolution,
        validation: project.organization_validation,
      };
      delete project.organization_workload;
      delete project.organization_anticipation;
      delete project.organization_methodology;
      delete project.organization_evolution;
      delete project.organization_validation;
    }

    // Construit l'objet kpis si les champs sont présents
    if (
      project.kpis_issues !== undefined ||
      project.kpis_points !== undefined ||
      project.kpis_commits !== undefined ||
      project.kpis_pull_requests !== undefined
    ) {
      project.kpis = {
        issues: project.kpis_issues,
        points: project.kpis_points,
        commits: project.kpis_commits,
        pullRequests: project.kpis_pull_requests,
      };
      delete project.kpis_issues;
      delete project.kpis_points;
      delete project.kpis_commits;
      delete project.kpis_pull_requests;
    }

    // Construit l'objet feedback si les champs sont présents
    if (project.feedback || project.feedback_client) {
      project.feedback = {
        general: project.feedback,
        client: project.feedback_client,
      };
      delete project.feedback;
      delete project.feedback_client;
    }
  }

  /**
   * Crée un nouveau projet avec ses relations (catégories, rôles, coworkers, stacks)
   * @param project Données du projet à créer (sans l'ID)
   * @return ID du projet créé
   */
  async create(project: Omit<ProjectInput, "id">): Promise<string> {
    const id = crypto.randomUUID();
    let conn;
    try {
      conn = await this.pool.getConnection();
      // Gère la miniature (thumbnail)
      let thumbnailFileName = null;
      if (project.thumbnailFile) {
        thumbnailFileName = await saveImageFile(
          project.thumbnailFile,
          "project",
          1920,
        );
      }
      let clientLogoFileName = null;
      if (project.clientLogoFile) {
        clientLogoFileName = await saveImageFile(
          project.clientLogoFile,
          "project",
          300,
        );
      }
      // Insère le projet principal
      await conn.query(
        `INSERT INTO project (
          id, label, thumbnail, website_url, website_label, mockup_url, mockup_label, client_label, client_logo, manager_name, manager_email, start_date, end_date, intro_context, intro_objective, intro_client, presentation_description, presentation_issue, presentation_audience, need_features, need_functional_constraints, need_technical_constraints, organization_workload, organization_anticipation, organization_methodology, organization_evolution, organization_validation, feedback, feedback_client, kpis_issues, kpis_points, kpis_commits, kpis_pull_requests
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          project.label,
          thumbnailFileName,
          project.websiteUrl || null,
          project.websiteLabel || null,
          project.mockupUrl || null,
          project.mockupLabel || null,
          project.clientLabel || null,
          clientLogoFileName || null,
          project.managerName || null,
          project.managerEmail || null,
          project.startDate ? new Date(project.startDate) : null,
          project.endDate ? new Date(project.endDate) : null,
          project.introContext || null,
          project.introObjective || null,
          project.introClient || null,
          project.presentationDescription || null,
          project.presentationIssue || null,
          project.presentationAudience || null,
          project.needFeatures || null,
          project.needFunctionalConstraints || null,
          project.needTechnicalConstraints || null,
          project.organizationWorkload || null,
          project.organizationAnticipation || null,
          project.organizationMethodology || null,
          project.organizationEvolution || null,
          project.organizationValidation || null,
          project.feedbackGeneral || null,
          project.feedbackClient || null,
          project.kpisIssues || null,
          project.kpisPoints || null,
          project.kpisCommits || null,
          project.kpisPullRequests || null,
        ],
      );

      // Insère les catégories liées
      if (project.categories && project.categories.length) {
        const existing = (
          await conn.query(
            `SELECT category_id FROM project_category WHERE project_id = ?`,
            [id],
          )
        ).map((r: any) => r.category_id);
        const toAdd = project.categories.filter(
          (c: string) => !existing.includes(c),
        );
        const toRemove = existing.filter(
          (c: string) => !project.categories?.includes(c),
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

      // Insère les rôles liés
      if (project.roles && project.roles.length) {
        const existing = (
          await conn.query(
            `SELECT role_id FROM project_role WHERE project_id = ?`,
            [id],
          )
        ).map((r: any) => r.role_id);
        const toAdd = project.roles.filter(
          (r: string) => !existing.includes(r),
        );
        const toRemove = existing.filter(
          (r: string) => !project.roles?.includes(r),
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

      // Insère les coworkers liés
      if (project.coworkers && project.coworkers.length) {
        // On considère la clé unique (coworker_id, role_id)
        const existing = await conn.query(
          `SELECT coworker_id, role_id FROM project_coworker WHERE project_id = ?`,
          [id],
        );
        const inputPairs = project.coworkers.flatMap((cw: any) =>
          (cw.roles || []).map((roleId: string) => ({
            coworker_id: cw.id,
            role_id: roleId,
          })),
        );
        const toAdd = inputPairs.filter(
          (p: any) =>
            !existing.some(
              (e: any) =>
                e.coworker_id === p.coworker_id && e.role_id === p.role_id,
            ),
        );
        const toRemove = existing.filter(
          (e: any) =>
            !inputPairs.some(
              (p: any) =>
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

      // Insère les stacks liés
      if (project.stacks && project.stacks.length) {
        const existing = await conn.query(
          `SELECT stack_id, version, section FROM project_stack WHERE project_id = ?`,
          [id],
        );
        const inputStacks = project.stacks.map((s: any) => ({
          stack_id: s.id,
          version: s.version || null,
          section: s.section || null,
        }));
        const toAdd = inputStacks.filter(
          (s: any) =>
            !existing.some(
              (e: any) =>
                e.stack_id === s.stack_id &&
                e.version === s.version &&
                e.section === s.section,
            ),
        );
        const toRemove = existing.filter(
          (e: any) =>
            !inputStacks.some(
              (s: any) =>
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

      // Insère les images mockup (enregistrement physique sur le disque)
      if (project.mockupImagesFiles && project.mockupImagesFiles.length) {
        const existing = (
          await conn.query(
            `SELECT mockup FROM project_mockup WHERE project_id = ?`,
            [id],
          )
        ).map((r: any) => r.mockup);
        const inputFiles = await Promise.all(
          project.mockupImagesFiles.map(async (img: any) =>
            typeof img === "string"
              ? img
              : await saveImageFile(img, "project_mockup", 1920),
          ),
        );
        const toAdd = inputFiles.filter((f: string) => !existing.includes(f));
        const toRemove = existing.filter(
          (f: string) => !inputFiles.includes(f),
        );
        for (const fileName of toRemove) {
          await conn.query(
            `DELETE FROM project_mockup WHERE project_id = ? AND mockup = ?`,
            [id, fileName],
          );
        }
        for (const fileName of toAdd) {
          await conn.query(
            `INSERT INTO project_mockup (project_id, mockup) VALUES (?, ?)`,
            [id, fileName],
          );
        }
      }

      return id;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Met à jour un projet existant avec ses relations (catégories, rôles, coworkers, stacks)
   * @param id ID du projet à mettre à jour
   * @param project Données du projet à mettre à jour (sans l'ID)
   */
  async update(
    id: string,
    project: Partial<Omit<ProjectInput, "id">>,
  ): Promise<void> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      // Construit dynamiquement la requête de mise à jour
      const fields: string[] = [];
      const values: any[] = [];
      const map: Record<string, any> = {
        label: project.label,
        thumbnail: project.thumbnailFile,
        website_url: project.websiteUrl,
        website_label: project.websiteLabel,
        mockup_url: project.mockupUrl,
        mockup_label: project.mockupLabel,
        client_label: project.clientLabel,
        client_logo: project.clientLogoFile,
        manager_name: project.managerName,
        manager_email: project.managerEmail,
        start_date: project.startDate ? new Date(project.startDate) : undefined,
        end_date: project.endDate ? new Date(project.endDate) : undefined,
        intro_context: project.introContext,
        intro_objective: project.introObjective,
        intro_client: project.introClient,
        presentation_description: project.presentationDescription,
        presentation_issue: project.presentationIssue,
        presentation_audience: project.presentationAudience,
        need_features: project.needFeatures,
        need_functional_constraints: project.needFunctionalConstraints,
        need_technical_constraints: project.needTechnicalConstraints,
        organization_workload: project.organizationWorkload,
        organization_anticipation: project.organizationAnticipation,
        organization_methodology: project.organizationMethodology,
        organization_evolution: project.organizationEvolution,
        organization_validation: project.organizationValidation,
        feedback: project.feedbackGeneral,
        feedback_client: project.feedbackClient,
        kpis_issues: project.kpisIssues,
        kpis_points: project.kpisPoints,
        kpis_commits: project.kpisCommits,
        kpis_pull_requests: project.kpisPullRequests,
      };
      for (const [col, val] of Object.entries(map)) {
        if (val !== undefined) {
          fields.push(`${col} = ?`);
          values.push(val);
        }
      }
      if (fields.length) {
        // Gère la miniature (thumbnail)
        if (project.thumbnailFile) {
          const thumbnailFileName = await saveImageFile(
            project.thumbnailFile,
            "project",
            1920,
          );
          const idx = fields.indexOf("thumbnail = ?");
          if (idx !== -1) values[idx] = thumbnailFileName;
        }
        await conn.query(
          `UPDATE project SET ${fields.join(", ")} WHERE id = ?`,
          [...values, id],
        );

        // Gère le logo client
        if (project.clientLogoFile) {
          const clientLogoFileName = await saveImageFile(
            project.clientLogoFile,
            "project",
            300,
          );
          await conn.query(`UPDATE project SET client_logo = ? WHERE id = ?`, [
            clientLogoFileName,
            id,
          ]);
        }
      }

      // Met à jour les catégories liées
      if (project.categories) {
        const existing = (
          await conn.query(
            `SELECT category_id FROM project_category WHERE project_id = ?`,
            [id],
          )
        ).map((r: any) => r.category_id);
        const toAdd = project.categories.filter(
          (c: string) => !existing.includes(c),
        );
        const toRemove = existing.filter(
          (c: string) => !project.categories?.includes(c),
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
        ).map((r: any) => r.role_id);
        const toAdd = project.roles.filter(
          (r: string) => !existing.includes(r),
        );
        const toRemove = existing.filter(
          (r: string) => !project.roles?.includes(r),
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
        const inputPairs = project.coworkers.flatMap((cw: any) =>
          (cw.roles || []).map((roleId: string) => ({
            coworker_id: cw.id,
            role_id: roleId,
          })),
        );
        const toAdd = inputPairs.filter(
          (p: any) =>
            !existing.some(
              (e: any) =>
                e.coworker_id === p.coworker_id && e.role_id === p.role_id,
            ),
        );
        const toRemove = existing.filter(
          (e: any) =>
            !inputPairs.some(
              (p: any) =>
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
        const inputStacks = project.stacks.map((s: any) => ({
          stack_id: s.id,
          version: s.version || null,
          section: s.section || null,
        }));
        const toAdd = inputStacks.filter(
          (s: any) =>
            !existing.some(
              (e: any) =>
                e.stack_id === s.stack_id &&
                e.version === s.version &&
                e.section === s.section,
            ),
        );
        const toRemove = existing.filter(
          (e: any) =>
            !inputStacks.some(
              (s: any) =>
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

      // Met à jour les images mockup (enregistrement physique sur le disque)
      if (project.mockupImagesFiles) {
        const existing = (
          await conn.query(
            `SELECT mockup FROM project_mockup WHERE project_id = ?`,
            [id],
          )
        ).map((r: any) => r.mockup);
        const inputFiles = await Promise.all(
          project.mockupImagesFiles.map(async (img: any) =>
            typeof img === "string"
              ? img
              : await saveImageFile(img, "project_mockup", 1920),
          ),
        );
        const toAdd = inputFiles.filter((f: string) => !existing.includes(f));
        const toRemove = existing.filter(
          (f: string) => !inputFiles.includes(f),
        );
        for (const fileName of toRemove) {
          await conn.query(
            `DELETE FROM project_mockup WHERE project_id = ? AND mockup = ?`,
            [id, fileName],
          );
        }
        for (const fileName of toAdd) {
          await conn.query(
            `INSERT INTO project_mockup (project_id, mockup) VALUES (?, ?)`,
            [id, fileName],
          );
        }
      }
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Supprime un projet et toutes ses relations (catégories, rôles, coworkers, stacks)
   * @param id ID du projet à supprimer
   */
  async delete(id: string): Promise<void> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      // Supprime la miniature (thumbnail) si elle existe
      const projectRows = await conn.query(
        `SELECT thumbnail FROM project WHERE id = ?`,
        [id],
      );
      if (projectRows.length && projectRows[0].thumbnail) {
        const thumbnailPath = path.join(
          process.cwd(),
          "public",
          "assets",
          "project",
          projectRows[0].thumbnail,
        );
        try {
          await (await import("fs")).promises.unlink(thumbnailPath);
        } catch (e) {}
      }

      // Supprime les images mockup liées
      const mockupRows = await conn.query(
        `SELECT mockup FROM project_mockup WHERE project_id = ?`,
        [id],
      );
      for (const row of mockupRows) {
        const mockupPath = path.join(
          process.cwd(),
          "public",
          "assets",
          "project_mockup",
          row.mockup,
        );
        try {
          await (await import("fs")).promises.unlink(mockupPath);
        } catch (e) {}
      }

      await conn.query(`DELETE FROM project WHERE id = ?`, [id]);
    } finally {
      if (conn) conn.release();
    }
  }
}
