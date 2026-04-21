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
      await conn.beginTransaction();

      const fields: string[] = [];
      const values: any[] = [];
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
      if (stack.category !== undefined) {
        fields.push("category_id = ?");
        values.push(stack.category ? stack.category : null);
      }

      if (fields.length > 0) {
        await conn.query(`UPDATE stack SET ${fields.join(", ")} WHERE id = ?`, [
          ...values,
          stack.id,
        ]);
      }

      if (stack.versions) {
        const existingRows = await conn.query(
          "SELECT version FROM stack_version WHERE stack_id = ?",
          [stack.id],
        );
        const existing: string[] = existingRows.map(
          (r: { version: string }) => r.version,
        );
        const toAdd = stack.versions.filter((v) => !existing.includes(v));
        const toRemove = existing.filter((v) => !stack.versions!.includes(v));
        if (toRemove.length) {
          await conn.batch(
            "DELETE FROM stack_version WHERE stack_id = ? AND version = ?",
            toRemove.map((v) => [stack.id, v]),
          );
        }
        if (toAdd.length) {
          await conn.batch(
            "INSERT INTO stack_version (stack_id, version) VALUES (?, ?)",
            toAdd.map((v) => [stack.id, v]),
          );
        }
      }

      if (stack.skills) {
        const existingRows = await conn.query(
          "SELECT skill FROM stack_skill WHERE stack_id = ?",
          [stack.id],
        );
        const existing: string[] = existingRows.map(
          (r: { skill: string }) => r.skill,
        );
        const toAdd = stack.skills.filter((s) => !existing.includes(s));
        const toRemove = existing.filter((s) => !stack.skills!.includes(s));
        if (toRemove.length) {
          await conn.batch(
            "DELETE FROM stack_skill WHERE stack_id = ? AND skill = ?",
            toRemove.map((s) => [stack.id, s]),
          );
        }
        if (toAdd.length) {
          await conn.batch(
            "INSERT INTO stack_skill (stack_id, skill) VALUES (?, ?)",
            toAdd.map((s) => [stack.id, s]),
          );
        }
      }

      if (fields.length === 0 && !stack.versions && !stack.skills) {
        await conn.rollback();
        return false;
      }

      await conn.commit();
    } catch (error) {
      if (conn) await conn.rollback();
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
}
