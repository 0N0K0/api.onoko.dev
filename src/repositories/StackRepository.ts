import { Stack } from "../types/stackTypes";
import {
  withConnection,
  withTransaction,
  buildSetClause,
} from "../database/dbHelpers";
import { BaseRepository } from "./BaseRepository";

// Repository pour les opérations liées aux stacks dans la base de données
export default class StackRepository extends BaseRepository {
  protected readonly tableName = "stack";

  /**
   * Récupère toutes les stacks de la base de données, en incluant leurs versions, compétences et catégories associées.
   * La méthode utilise une requête SQL pour joindre les tables "stack", "stack_version", "stack_skill" et "category" afin d'obtenir les informations complètes sur chaque stack.
   * Les résultats sont ensuite transformés en un format structuré où chaque stack est représentée avec ses propriétés, une liste de ses versions, compétences et sa catégorie associée.
   * @returns {Promise<Stack[]>} Un tableau de stacks récupérées de la base de données, avec leurs propriétés, versions, compétences et catégorie associée.
   * @throws {Error} Une erreur si la récupération des stacks échoue pour une raison quelconque.
   */
  async getAll(): Promise<Stack[]> {
    return withConnection(this.pool, async (conn) => {
      const rows = await conn.query(`
        SELECT s.*, v.version, ss.skill, sc.category_id
        FROM stack s
        LEFT JOIN stack_version v ON v.stack_id = s.id
        LEFT JOIN stack_skill ss ON ss.stack_id = s.id
        LEFT JOIN stack_category sc ON sc.stack_id = s.id
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
            categories: [],
          });
        }
        if (row.version) stackMap.get(row.id).versions.push(row.version);
        if (row.skill) stackMap.get(row.id).skills.push(row.skill);
        if (row.category_id) stackMap.get(row.id).categories.push(row.category_id);
      }
      // Dédupliquer les versions et skills
      for (const stack of stackMap.values()) {
        stack.versions = Array.from(new Set(stack.versions));
        stack.skills = Array.from(new Set(stack.skills));
        stack.categories = Array.from(new Set(stack.categories));
      }
      return Array.from(stackMap.values());
    });
  }

  /**
   * Crée une nouvelle stack dans la base de données en utilisant les propriétés fournies.
   * La méthode génère un ID unique pour la nouvelle stack, puis insère les données dans la table "stack" de la base de données.
   * Après l'insertion, la méthode retourne l'ID de la stack nouvellement créée.
   * @param {Omit<Stack, "id">} stack Les propriétés de la stack à créer, à l'exception de l'ID qui est généré automatiquement.
   * @returns {Promise<boolean>} Indique si la création de la stack a réussi.
   */
  async create(stack: Omit<Stack, "id">): Promise<boolean> {
    const id = this.generateId();
    await withTransaction(this.pool, async (conn) => {
      await conn.query(
        `INSERT INTO stack (id, label, icon_id, description) VALUES (?, ?, ?, ?);`,
        [id, stack.label, stack.icon, stack.description || null],
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
      if (stack.categories && stack.categories.length > 0) {
        await conn.query(
          `INSERT INTO stack_category (stack_id, category_id) VALUES ${stack.categories.map(() => "(?, ?)").join(", ")};`,
          stack.categories.flatMap((category) => [id, category]),
        );
      }
    });
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
    return withTransaction(this.pool, async (conn) => {
      const set = buildSetClause({
        label: stack.label || undefined,
        icon_id: stack.icon ? (stack.icon as string) : undefined,
        description: stack.description,
      });
      if (set) {
        await conn.query(`UPDATE stack SET ${set.sql} WHERE id = ?`, [
          ...set.values,
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

      if (stack.categories) {
        const existingRows = await conn.query(
          "SELECT category_id FROM stack_category WHERE stack_id = ?",
          [stack.id],
        );
        const existing: string[] = existingRows.map(
          (r: { category_id: string }) => r.category_id,
        );
        const toAdd = stack.categories.filter((c) => !existing.includes(c));
        const toRemove = existing.filter((c) => !stack.categories!.includes(c));
        if (toRemove.length) {
          await conn.batch(
            "DELETE FROM stack_category WHERE stack_id = ? AND category_id = ?",
            toRemove.map((c) => [stack.id, c]),
          );
        }
        if (toAdd.length) {
          await conn.batch(
            "INSERT INTO stack_category (stack_id, category_id) VALUES (?, ?)",
            toAdd.map((c) => [stack.id, c]),
          );
        }
      }

      if (!set && !stack.versions && !stack.skills && !stack.categories) {
        return false;
      }
      return true;
    });
  }
}
