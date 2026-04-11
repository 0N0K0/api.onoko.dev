import mariadb from "mariadb";
import crypto from "crypto";
import { Stack } from "../types/stackTypes";
import { ImageFile } from "../types/imageTypes";
import { Category } from "../types/categoryTypes";
import { saveImageFile } from "../utils/imageUtils";
import path from "path";
import { promises as fs } from "fs";
import { Media } from "../types/mediaTypes";
import { MEDIA_BASE_PATH } from "../constants/mediaConstants";

// Repository pour les opérations liées aux stacks dans la base de données
export class StackRepository {
  // Constructeur qui initialise le repository avec un pool de connexions à la base de données MariaDB
  constructor(private pool: mariadb.Pool) {}

  /**
   * Récupère toutes les stacks de la base de données, en incluant leurs versions, compétences et catégories associées.
   * La méthode utilise une requête SQL pour joindre les tables "stack", "stack_version", "stack_skill" et "category" afin d'obtenir les informations complètes sur chaque stack.
   * Les résultats sont ensuite transformés en un format structuré où chaque stack est représentée avec ses propriétés, une liste de ses versions, compétences et sa catégorie associée.
   * @returns {Promise<Stack[]>} Un tableau de stacks récupérées de la base de données, avec leurs propriétés, versions, compétences et catégorie associée.
   */
  async getAll(): Promise<Stack[]> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`
        SELECT s.*, v.version, ss.skill, c.id as c_id, c.label as c_label, m.id as m_id, m.label as m_label, m.path as m_path, m.type as m_type
        FROM stack s
        LEFT JOIN stack_version v ON v.stack_id = s.id
        LEFT JOIN stack_skill ss ON ss.stack_id = s.id
        LEFT JOIN category c ON s.category_id = c.id
        LEFT JOIN medias m ON s.icon_id = m.id
        ORDER BY c.label, s.label
      `);
      const stackMap = new Map();
      for (const row of rows) {
        if (!stackMap.has(row.id)) {
          stackMap.set(row.id, {
            id: row.id,
            label: row.label,
            icon: row.m_id
              ? {
                  id: row.m_id,
                  label: row.m_label,
                  path: row.m_path,
                  type: row.m_type,
                }
              : undefined,
            description: row.description,
            versions: [],
            skills: [],
            category: row.c_id
              ? {
                  id: row.c_id,
                  label: row.c_label,
                }
              : undefined,
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
   * @returns {Promise<Stack | null>} La stack correspondant à la requête, avec ses propriétés, versions, compétences et catégorie associée, ou null si aucune stack n'est trouvée.
   */
  async getAllByCategory(
    key: "id" | "label",
    value: string,
  ): Promise<Category | undefined | null> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      // Récupère toutes les catégories de la sous-arborescence
      const categories = await conn.query(
        `
          WITH RECURSIVE subcategories AS (
            SELECT * FROM category WHERE ${key} = ?
            UNION ALL
            SELECT c.* FROM category c
            INNER JOIN subcategories sc ON c.parent_id = sc.id
          )
          SELECT * FROM subcategories
        `,
        [value],
      );
      // Récupère toutes les stacks liées à ces catégories
      const categoryIds = categories.map((cat: { id: string }) => cat.id);
      let stacks: (Stack & {
        version?: string;
        skill?: string;
        c_id?: string;
        c_label?: string;
        m_id?: string;
        m_label?: string;
        m_path?: string;
        m_type?: string;
      })[] = [];
      if (categoryIds.length > 0) {
        const placeholders = categoryIds.map(() => "?").join(",");
        stacks = await conn.query(
          `
            SELECT s.*, v.version, ss.skill, c.id as c_id, c.label as c_label, m.id as m_id, m.path as m_path, m.type as m_type
            FROM stack s
            LEFT JOIN stack_version v ON v.stack_id = s.id
            LEFT JOIN stack_skill ss ON ss.stack_id = s.id
            LEFT JOIN category c ON s.category_id = c.id
            LEFT JOIN medias m ON s.icon_id = m.id
            WHERE s.category_id IN (${placeholders})
          `,
          categoryIds,
        );
      }
      // Regroupe les versions par stack
      const stackMap = new Map<string, Stack>();
      for (const row of stacks) {
        if (!stackMap.has(row.id)) {
          stackMap.set(row.id, {
            id: row.id,
            label: row.label,
            icon:
              row.m_id && row.m_type
                ? {
                    id: row.m_id,
                    label: row.m_label,
                    path: MEDIA_BASE_PATH + row.m_path,
                    type: row.m_type,
                  }
                : undefined,
            description: row.description,
            versions: [],
            skills: [],
            category: row.c_id
              ? ({
                  id: row.c_id,
                  label: row.c_label,
                } as Category)
              : undefined,
          });
        }
        if (row.version) stackMap.get(row.id)?.versions.push(row.version);
        if (row.skill) stackMap.get(row.id)?.skills.push(row.skill);
        // Déduplique les versions et compétences
        for (const stack of stackMap.values()) {
          stack.versions = Array.from(new Set(stack.versions));
          stack.skills = Array.from(new Set(stack.skills));
        }
      }
      // Construit l'arbre récursif
      function buildTree(parentId: string | null): {
        id: string;
        label: string;
        description: string;
        entities: Stack[];
        children: Category[];
      }[] {
        return categories
          .filter(
            (cat: { parent_id: string | null }) => cat.parent_id === parentId,
          )
          .map((cat: { id: string; label: string; description: string }) => {
            const catStacks = Array.from(stackMap.values()).filter(
              (s: Stack) => (s.category as Category).id === cat.id,
            );
            return {
              id: cat.id,
              label: cat.label,
              description: cat.description,
              entities: catStacks,
              children: buildTree(cat.id),
            };
          });
      }
      // Trouve la racine (catégorie demandée)
      const root = categories.find(
        (cat: { [key: string]: any }) => cat[key] === value,
      );
      if (!root) return null;
      const result = buildTree(root.parent_id).find(
        (c: { id: string }) => c.id === root.id,
      );
      return result;
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
   * @returns {Promise<Stack | null>} La stack correspondant à la requête, avec ses propriétés, versions, compétences et catégorie associée, ou null si aucune stack n'est trouvée.
   */
  async get(key: "id" | "label", value: string): Promise<Stack | null> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(
        `
        SELECT s.*, v.version, ss.skill, c.id as c_id, c.label as c_label, m.id as m_id, m.path as m_path, m.type as m_type
        FROM stack s
        LEFT JOIN stack_version v ON v.stack_id = s.id
        LEFT JOIN stack_skill ss ON ss.stack_id = s.id
        LEFT JOIN category c ON s.category_id = c.id
        LEFT JOIN media m ON s.icon_id = m.id
        WHERE s.${key} = ?
        `,
        [value],
      );
      if (!rows || rows.length === 0) return null;
      const first = rows[0];
      const stack: Stack = {
        id: first.id,
        label: first.label,
        icon: first.m_id
          ? {
              id: first.m_id,
              path: MEDIA_BASE_PATH + first.m_path,
              type: first.m_type,
            }
          : undefined,
        description: first.description,
        versions: Array.from(
          new Set(
            rows
              .filter((r: { version: string | null }) => r.version != null)
              .map((r: { version: string }) => r.version),
          ),
        ),
        category: first.c_id
          ? {
              id: first.c_id,
              label: first.c_label,
            }
          : undefined,
        skills: Array.from(
          new Set(
            rows
              .filter((r: { skill: string | null }) => r.skill != null)
              .map((r: { skill: string }) => r.skill),
          ),
        ),
      };
      return stack;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Crée une nouvelle stack dans la base de données en utilisant les propriétés fournies.
   * La méthode génère un ID unique pour la nouvelle stack, puis insère les données dans la table "stack" de la base de données.
   * Après l'insertion, la méthode retourne l'ID de la stack nouvellement créée.
   * @param {Omit<Stack, "id">} stack Les propriétés de la stack à créer, à l'exception de l'ID qui est généré automatiquement.
   * @returns {Promise<string>} L'ID de la stack nouvellement créée dans la base de données.
   */
  async create(
    stack: Omit<Stack, "id"> & {
      iconFile: ImageFile;
    },
  ): Promise<string> {
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
      return id;
    } finally {
      if (conn) conn.release();
    }
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
  async update(stack: Partial<Stack>): Promise<void> {
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
      if (fields.length === 0) return;
      values.push(stack.id);
      await conn.query(
        `UPDATE stack SET ${fields.join(", ")} WHERE id = ?`,
        values,
      );
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Supprime une stack de la base de données en fonction de son ID.
   * La méthode exécute une requête SQL pour supprimer la stack correspondante à l'ID spécifié de la table "stack" de la base de données.
   * Avant de supprimer la stack, la méthode récupère le nom du fichier d'icône associé à la stack et tente de supprimer ce fichier du système de fichiers si il existe.
   * Après l'exécution de la requête de suppression, la méthode ne retourne rien.
   * @param {string} id L'ID de la stack à supprimer de la base de données.
   * @returns {Promise<void>} Une promesse qui se résout lorsque la suppression est terminée, ou rejette une erreur si la suppression échoue pour une raison quelconque.
   * @throws {Error} Une erreur si la suppression échoue pour une raison quelconque.
   */
  async delete(id: string): Promise<void> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query("DELETE FROM stack WHERE id = ?", [id]);
    } finally {
      if (conn) conn.release();
    }
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
