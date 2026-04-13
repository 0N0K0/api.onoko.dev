import mariadb from "mariadb";
import crypto from "crypto";
import { Stack } from "../types/stackTypes";

// Repository pour les opérations liées aux stacks dans la base de données
export class StackRepository {
  // Constructeur qui initialise le repository avec un pool de connexions à la base de données MariaDB
  constructor(private pool: mariadb.Pool) {}

  /**
   * Récupère toutes les stacks de la base de données, en incluant leurs versions, compétences et catégories associées.
   * La méthode utilise une requête SQL pour joindre les tables "stack", "stack_version", "stack_skill" et "category" afin d'obtenir les informations complètes sur chaque stack.
   * Les résultats sont ensuite transformés en un format structuré où chaque stack est représentée avec ses propriétés, une liste de ses versions, compétences et sa catégorie associée.
   * @returns {Promise<Stack[]>} Un tableau de stacks récupérées de la base de données, avec leurs propriétés, versions, compétences et catégorie associée.
   * @throws {Error} Une erreur si la récupération des stacks échoue pour une raison quelconque.
   */
  async getAll(): Promise<Stack[]> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`
        SELECT s.*, v.version, ss.skill
        FROM stack s
        LEFT JOIN stack_version v ON v.stack_id = s.id
        LEFT JOIN stack_skill ss ON ss.stack_id = s.id
        ORDER BY s.label
      `);
      const stackMap = new Map();
      for (const row of rows) {
        if (!stackMap.has(row.id)) {
          stackMap.set(row.id, {
            id: row.id,
            label: row.label,
            icon: row.icon_id,
            description: row.description,
            versions: [],
            skills: [],
            category: row.category_id,
          });
        }
        if (row.version) stackMap.get(row.id).versions.push(row.version);
        if (row.skill) stackMap.get(row.id).skills.push(row.skill);
      }
      // Dédupliquer les versions et skills
      for (const stack of stackMap.values()) {
        stack.versions = Array.from(new Set(stack.versions));
        stack.skills = Array.from(new Set(stack.skills));
      }
      return Array.from(stackMap.values());
    } catch (error) {
      console.error("Error retrieving stacks:", error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Récupère une stack spécifique de la base de données en fonction d'une clé (id ou label) et d'une valeur correspondante.
   * La méthode utilise une requête SQL pour joindre les tables "stack", "stack_version", "stack_skill" et "category" afin d'obtenir les informations complètes sur la stack correspondant à la clé et à la valeur spécifiées, ainsi que ses versions, compétences et catégorie associée.
   * Les résultats sont ensuite transformés en un format structuré où la stack est représentée avec ses propriétés, une liste de ses versions, compétences et sa catégorie associée.
   * Si aucune stack correspondante n'est trouvée, la méthode retourne null.
   * @param {string} key La clé à utiliser pour la recherche (id ou label).
   * @param {string} value La valeur correspondante à rechercher pour la clé spécifiée.
   * @returns {Promise<boolean>} Indique si la stack correspondant à la requête existe.
   * @throws {Error} Une erreur si la récupération échoue pour une raison quelconque.
   */
  async get(id: string): Promise<boolean> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(
        `
        SELECT s.*, v.version, ss.skill
        FROM stack s
        LEFT JOIN stack_version v ON v.stack_id = s.id
        LEFT JOIN stack_skill ss ON ss.stack_id = s.id
        WHERE s.id = ?
        `,
        [id],
      );
      if (!rows || rows.length === 0) return false;
      const first = rows[0];
      const stack: Stack = {
        id: first.id,
        label: first.label,
        icon: first.icon_id,
        description: first.description,
        versions: Array.from(
          new Set(
            rows
              .filter((r: { version: string | null }) => r.version != null)
              .map((r: { version: string }) => r.version),
          ),
        ),
        category: first.category_id,
        skills: Array.from(
          new Set(
            rows
              .filter((r: { skill: string | null }) => r.skill != null)
              .map((r: { skill: string }) => r.skill),
          ),
        ),
      };
    } catch (error) {
      console.error("Error retrieving stack:", error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
    return true;
  }

  /**
   * Crée une nouvelle stack dans la base de données en utilisant les propriétés fournies.
   * La méthode génère un ID unique pour la nouvelle stack, puis insère les données dans la table "stack" de la base de données.
   * Après l'insertion, la méthode retourne l'ID de la stack nouvellement créée.
   * @param {Omit<Stack, "id">} stack Les propriétés de la stack à créer, à l'exception de l'ID qui est généré automatiquement.
   * @returns {Promise<boolean>} Indique si la création de la stack a réussi.
   */
  async create(stack: Omit<Stack, "id">): Promise<boolean> {
    const id = crypto.randomUUID();

    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(
        `INSERT INTO stack (id, label, icon_id, description, category_id) VALUES (?, ?, ?, ?, ?);`,
        [
          id,
          stack.label,
          stack.icon,
          stack.description || null,
          stack.category || null,
        ],
      );
      if (stack.versions && stack.versions.length > 0) {
        await conn.query(
          `INSERT INTO stack_version (stack_id, version) VALUES ${stack.versions.map(() => "(?, ?)").join(", ")};`,
          stack.versions.flatMap((version) => [id, version]),
        );
      }
      if (stack.skills && stack.skills.length > 0) {
        await conn.query(
          `INSERT INTO stack_skill (stack_id, skill) VALUES ${stack.skills.map(() => "(?, ?)").join(", ")};`,
          stack.skills.flatMap((skill) => [id, skill]),
        );
      }
    } catch (error) {
      console.error("Error creating stack:", error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
    return true;
  }

  /**
   * Met à jour une stack existante dans la base de données en fonction de son ID et des propriétés fournies.
   * La méthode vérifie d'abord que l'ID est présent dans les données fournies, puis construit dynamiquement une requête SQL pour mettre à jour les champs spécifiés de la stack dans la table "stack" de la base de données.
   * Si des versions ou compétences sont fournies, la méthode gère également l'ajout ou la suppression des versions et compétences associées à la stack dans les tables "stack_version" et "stack_skill".
   * Après l'exécution de la requête de mise à jour, la méthode ne retourne rien.
   * @param {Partial<Stack> & { iconFile?: ImageFile }} stack Les propriétés de la stack à mettre à jour, avec l'ID requis et les autres champs optionnels à mettre à jour.
   * @returns {Promise<void>} Une promesse qui se résout lorsque la mise à jour est terminée, ou rejette une erreur si l'ID n'est pas fourni ou si la mise à jour échoue.
   * @throws {Error} Une erreur si l'ID n'est pas fourni dans les données de la stack, ou si la mise à jour échoue pour une raison quelconque.
   */
  async update(stack: Partial<Stack>): Promise<boolean> {
    if (!stack.id) throw new Error("ID is required for update");
    let conn;
    try {
      conn = await this.pool.getConnection();
      const fields = [];
      const values = [];
      if (stack.label) {
        fields.push("label = ?");
        values.push(stack.label);
      }
      if (stack.icon) {
        fields.push("icon_id = ?");
        values.push(stack.icon as string);
      }
      if (stack.description !== undefined) {
        fields.push("description = ?");
        values.push(stack.description);
      }
      if (stack.versions) {
        const existingVersions = await this.getVersions(stack.id);
        const versionsToAdd = stack.versions.filter(
          (v) => !existingVersions.includes(v),
        );
        const versionsToRemove = existingVersions.filter(
          (v) => !stack.versions!.includes(v),
        );
        for (const version of versionsToAdd) {
          await this.addVersion(stack.id, version);
        }
        for (const version of versionsToRemove) {
          await this.removeVersion(stack.id, version);
        }
      }
      if (stack.category !== undefined) {
        fields.push("category_id = ?");
        values.push(stack.category ? stack.category : null);
      }
      if (stack.skills) {
        const existingSkills = await this.getSkills(stack.id);
        const skillsToAdd = stack.skills.filter(
          (s) => !existingSkills.includes(s),
        );
        const skillsToRemove = existingSkills.filter(
          (s) => !stack.skills!.includes(s),
        );
        for (const skill of skillsToAdd) {
          await this.addSkill(stack.id, skill);
        }
        for (const skill of skillsToRemove) {
          await this.removeSkill(stack.id, skill);
        }
      }
      if (fields.length === 0) return false;
      values.push(stack.id);
      await conn.query(
        `UPDATE stack SET ${fields.join(", ")} WHERE id = ?`,
        values,
      );
    } catch (error) {
      console.error("Error updating stack:", error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
    return true;
  }

  /**
   * Supprime une stack de la base de données en fonction de son ID.
   * La méthode exécute une requête SQL pour supprimer la stack correspondante à l'ID spécifié de la table "stack" de la base de données.
   * Avant de supprimer la stack, la méthode récupère le nom du fichier d'icône associé à la stack et tente de supprimer ce fichier du système de fichiers si il existe.
   * Après l'exécution de la requête de suppression, la méthode ne retourne rien.
   * @param {string} id L'ID de la stack à supprimer de la base de données.
   * @returns {Promise<boolean>} Indique si la suppression de la stack a réussi.
   * @throws {Error} Une erreur si la suppression échoue pour une raison quelconque.
   */
  async delete(id: string): Promise<boolean> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query("DELETE FROM stack WHERE id = ?", [id]);
    } catch (error) {
      console.error("Error deleting stack:", error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
    return true;
  }

  // Méthodes privées pour gérer les versions et compétences associées à une stack

  /**
   * Récupère les versions associées à une stack spécifique en fonction de son ID.
   * La méthode exécute une requête SQL pour sélectionner les versions de la table "stack_version" correspondant à l'ID de la stack spécifiée.
   * Les résultats sont ensuite transformés en un tableau de chaînes de caractères représentant les versions associées à la stack.
   * @param {string} stackId L'ID de la stack pour laquelle récupérer les versions associées.
   * @returns {Promise<string[]>} Un tableau de chaînes de caractères représentant les versions associées à la stack spécifiée.
   */
  private async getVersions(stackId: string): Promise<string[]> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(
        "SELECT version FROM stack_version WHERE stack_id = ?",
        [stackId],
      );
      return rows.map((row: { version: string }) => row.version);
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Ajoute une version associée à une stack spécifique dans la base de données.
   * La méthode exécute une requête SQL pour insérer une nouvelle version dans la table "stack_version" de la base de données, en associant la version spécifiée à l'ID de la stack correspondante.
   * Après l'exécution de la requête d'insertion, la méthode ne retourne rien.
   * @param {string} stackId L'ID de la stack à laquelle associer la nouvelle version.
   * @param {string} version La version à ajouter et associer à la stack spécifiée.
   * @returns {Promise<void>} Une promesse qui se résout lorsque l'ajout de la version est terminé, ou rejette une erreur si l'opération échoue pour une raison quelconque.
   * @throws {Error} Une erreur si l'opération échoue pour une raison quelconque.
   */
  private async addVersion(stackId: string, version: string): Promise<void> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(
        "INSERT INTO stack_version (stack_id, version) VALUES (?, ?)",
        [stackId, version],
      );
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Supprime une version associée à une stack spécifique de la base de données.
   * La méthode exécute une requête SQL pour supprimer la version correspondante à l'ID de la stack et à la version spécifiée de la table "stack_version" de la base de données.
   * Après l'exécution de la requête de suppression, la méthode ne retourne rien.
   * @param {string} stackId L'ID de la stack dont supprimer la version associée.
   * @param {string} version La version à supprimer et dissocier de la stack spécifiée.
   * @returns {Promise<void>} Une promesse qui se résout lorsque la suppression de la version est terminée, ou rejette une erreur si l'opération échoue pour une raison quelconque.
   * @throws {Error} Une erreur si l'opération échoue pour une raison quelconque.
   */
  private async removeVersion(stackId: string, version: string): Promise<void> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(
        "DELETE FROM stack_version WHERE stack_id = ? AND version = ?",
        [stackId, version],
      );
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Récupère les compétences associées à une stack spécifique en fonction de son ID.
   * La méthode exécute une requête SQL pour sélectionner les compétences de la table "stack_skill" correspondant à l'ID de la stack spécifiée.
   * Les résultats sont ensuite transformés en un tableau de chaînes de caractères représentant les compétences associées à la stack.
   * @param {string} stackId L'ID de la stack pour laquelle récupérer les compétences associées.
   * @returns {Promise<string[]>} Un tableau de chaînes de caractères représentant les compétences associées à la stack spécifiée.
   */
  private async getSkills(stackId: string): Promise<string[]> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(
        "SELECT skill FROM stack_skill WHERE stack_id = ?",
        [stackId],
      );
      return rows.map((row: { skill: string }) => row.skill);
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Ajoute une compétence associée à une stack spécifique dans la base de données.
   * La méthode exécute une requête SQL pour insérer une nouvelle compétence dans la table "stack_skill" de la base de données, en associant la compétence spécifiée à l'ID de la stack correspondante.
   * Après l'exécution de la requête d'insertion, la méthode ne retourne rien.
   * @param {string} stackId L'ID de la stack à laquelle associer la nouvelle compétence.
   * @param {string} skill La compétence à ajouter et associer à la stack spécifiée.
   * @returns {Promise<void>} Une promesse qui se résout lorsque l'ajout de la compétence est terminé, ou rejette une erreur si l'opération échoue pour une raison quelconque.
   * @throws {Error} Une erreur si l'opération échoue pour une raison quelconque.
   */
  private async addSkill(stackId: string, skill: string): Promise<void> {
    const id = crypto.randomUUID();
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(
        "INSERT INTO stack_skill (id, stack_id, skill) VALUES (?, ?, ?)",
        [id, stackId, skill],
      );
    } finally {
      if (conn) conn.release();
    }
  }

  private async removeSkill(stackId: string, skill: string): Promise<void> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(
        "DELETE FROM stack_skill WHERE stack_id = ? AND skill = ?",
        [stackId, skill],
      );
    } finally {
      if (conn) conn.release();
    }
  }
}
