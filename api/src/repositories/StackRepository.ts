import mariadb from "mariadb";
import crypto from "crypto";
import { Stack } from "../types/stackTypes";
import { ImageFile } from "../types/imageTypes";
import { Category } from "../types/categoryTypes";
import { saveImageFile } from "../utils/imageUtils";

export class StackRepository {
  private iconBasePath = "/public/stack/";

  constructor(private pool: mariadb.Pool) {}

  async getAll(): Promise<Stack[]> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`
        SELECT s.*, v.version, c.id as category_id, c.label as category_label, c.icon as category_icon, c.description as category_description
        FROM stack s
        LEFT JOIN stack_version v ON v.stack_id = s.id
        LEFT JOIN category c ON s.category_id = c.id
      `);
      // Map SQL rows to Stack[]
      const stacks: Stack[] = rows.map((row: any) => ({
        id: row.id,
        label: row.label,
        iconeUrl: row.icon ? `${this.iconBasePath}${row.icon}` : undefined,
        description: row.description,
        versions: row.version ? [row.version] : [],
        category: row.category_id
          ? {
              id: row.category_id,
              label: row.category_label,
              description: row.category_description,
            }
          : undefined,
      }));
      return stacks;
    } finally {
      if (conn) conn.release();
    }
  }

  async getAllByCategory(
    key: "id" | "label",
    value: any,
  ): Promise<Category | null> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      // Récupérer toutes les catégories de la sous-arborescence
      const categories = await conn.query(
        `WITH RECURSIVE subcategories AS (
          SELECT * FROM category WHERE ${key} = ?
          UNION ALL
          SELECT c.* FROM category c
          INNER JOIN subcategories sc ON c.parent_id = sc.id
        )
        SELECT * FROM subcategories`,
        [value],
      );
      // Récupérer toutes les stacks liées à ces catégories
      const categoryIds = categories.map((cat: any) => cat.id);
      let stacks: any[] = [];
      if (categoryIds.length > 0) {
        const placeholders = categoryIds.map(() => "?").join(",");
        stacks = await conn.query(
          `SELECT s.*, v.version, c.id as category_id
           FROM stack s
           LEFT JOIN stack_version v ON v.stack_id = s.id
           LEFT JOIN category c ON s.category_id = c.id
           WHERE s.category_id IN (${placeholders})`,
          categoryIds,
        );
      }
      // Regrouper les versions par stack
      const stackMap = new Map();
      for (const row of stacks) {
        if (!stackMap.has(row.id)) {
          stackMap.set(row.id, {
            id: row.id,
            label: row.label,
            iconeUrl: row.icon ? `${this.iconBasePath}${row.icon}` : undefined,
            description: row.description,
            versions: [],
            category_id: row.category_id,
          });
        }
        if (row.version) {
          stackMap.get(row.id).versions.push(row.version);
        }
      }
      // Construction de l'arbre récursif
      function buildTree(parentId: string | null): any[] {
        return categories
          .filter((cat: any) => cat.parent_id === parentId)
          .map((cat: any) => {
            const catStacks = Array.from(stackMap.values()).filter(
              (s: any) => s.category_id === cat.id,
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
      // Trouver la racine (catégorie demandée)
      const root = categories.find((cat: any) => cat[key] === value);
      if (!root) return null;
      const result = buildTree(root.parent_id).find(
        (c: any) => c.id === root.id,
      );
      return result;
    } finally {
      if (conn) conn.release();
    }
  }

  async get(key: "id" | "label", value: any): Promise<Stack | null> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(
        `
        SELECT s.*, v.version, c.id as category_id, c.label as category_label, c.icon as category_icon, c.description as category_description
        FROM stack s
        LEFT JOIN stack_version v ON v.stack_id = s.id
        LEFT JOIN category c ON s.category_id = c.id
        WHERE s.${key} = ?
        `,
        [value],
      );
      if (!rows || rows.length === 0) return null;
      const first = rows[0];
      const stack: Stack = {
        id: first.id,
        label: first.label,
        iconeUrl: first.icon ? `${this.iconBasePath}${first.icon}` : undefined,
        description: first.description,
        versions: rows
          .filter((r: any) => r.version != null)
          .map((r: any) => r.version),
        category: first.category_id
          ? {
              id: first.category_id,
              label: first.category_label,
              description: first.category_description,
            }
          : undefined,
      };
      return stack;
    } finally {
      if (conn) conn.release();
    }
  }

  async create(
    stack: Omit<Stack, "id"> & {
      iconFile: ImageFile;
    },
  ): Promise<string> {
    const id = crypto.randomBytes(16).toString("hex");

    const iconFileName = await saveImageFile(id, stack.iconFile, "stack", 100);

    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(
        `
        INSERT INTO stack (id, label, icon, description, category_id) VALUES (?, ?, ?, ?, ?);
        ${stack.versions && stack.versions.length > 0 ? `INSERT INTO stack_version (stack_id, version) VALUES ${stack.versions.map(() => "(?, ?)").join(", ")};` : ""}
        `,
        [
          id,
          stack.label,
          iconFileName,
          stack.description || null,
          stack.category || null,
          ...(stack.versions?.flatMap((version) => [id, version]) || []),
        ],
      );
      return id;
    } finally {
      if (conn) conn.release();
    }
  }

  async update(
    stack: Partial<Stack> & {
      iconFile?: ImageFile;
    },
  ): Promise<void> {
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
      if (stack.iconFile) {
        const iconFileName = await saveImageFile(
          stack.id,
          stack.iconFile,
          "stack",
          100,
        );
        fields.push("icon = ?");
        values.push(iconFileName);
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
      if (stack.category) {
        fields.push("category_id = ?");
        values.push(stack.category);
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

  async delete(id: string): Promise<void> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query("DELETE FROM stack WHERE id = ?", [id]);
    } finally {
      if (conn) conn.release();
    }
  }

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
}
