import mariadb from "mariadb";
import crypto from "crypto";
import { Category } from "../types/categoryTypes";

export default class CategoryRepository {
  constructor(private pool: mariadb.Pool) {}

  async getAll(): Promise<Category[]> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT * FROM category`);
      function buildTree(parentId: string | null): any[] {
        return rows
          .filter((cat: any) => cat.parent_id === parentId)
          .map((cat: any) => ({
            id: cat.id,
            label: cat.label,
            description: cat.description,
            entity: cat.entity,
            children: buildTree(cat.id),
          }));
      }
      return buildTree(null);
    } finally {
      if (conn) conn.release();
    }
  }

  async getAllByEntity(entity: string): Promise<Category[]> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(`SELECT * FROM category WHERE entity = ?`, [
        entity,
      ]);
      function buildTree(parentId: string | null): any[] {
        return rows
          .filter((cat: any) => cat.parent_id === parentId)
          .map((cat: any) => ({
            id: cat.id,
            label: cat.label,
            description: cat.description,
            entity: cat.entity,
            children: buildTree(cat.id),
          }));
      }
      return buildTree(null);
    } finally {
      if (conn) conn.release();
    }
  }

  async get(
    key: "id" | "label",
    value: any,
    entity?: string,
  ): Promise<Category | null> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(
        `WITH RECURSIVE subcategories AS (
          SELECT * FROM category WHERE ${key} = ? ${entity ? "AND entity = ?" : ""}
          UNION ALL
          SELECT c.* FROM category c
          INNER JOIN subcategories sc ON c.parent_id = sc.id
        )
        SELECT * FROM subcategories`,
        entity ? [value, entity] : [value],
      );
      if (!rows || rows.length === 0) return null;
      // Trouver la catégorie racine (celle qui correspond à la recherche)
      const root = rows.find((cat: any) => cat[key] === value);
      if (!root) return null;
      function buildTree(parentId: string | null): any[] {
        return rows
          .filter((cat: any) => cat.parent_id === parentId)
          .map((cat: any) => ({
            id: cat.id,
            label: cat.label,
            description: cat.description,
            entity: cat.entity,
            children: buildTree(cat.id),
          }));
      }
      // On construit l'arbre à partir de la racine trouvée
      return {
        id: root.id,
        label: root.label,
        description: root.description,
        entity: root.entity,
        children: buildTree(root.id),
      };
    } finally {
      if (conn) conn.release();
    }
  }

  async create(category: Omit<Category, "id">): Promise<string> {
    const id = crypto.randomBytes(16).toString("hex");

    let conn;

    try {
      conn = await this.pool.getConnection();
      await conn.query(
        `INSERT INTO category (id, label, entity, description, parent_id) VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          category.label,
          category.entity,
          category.description || null,
          category.parent || null,
        ],
      );
    } finally {
      if (conn) conn.release();
    }
    return id;
  }

  async update(category: Partial<Category>): Promise<void> {
    if (!category.id) throw new Error("ID is required for update");
    let conn;
    try {
      conn = await this.pool.getConnection();
      const fields = [];
      const values = [];
      if (category.label) {
        fields.push("label = ?");
        values.push(category.label);
      }
      if (category.entity) {
        fields.push("entity = ?");
        values.push(category.entity);
      }
      if (category.description !== undefined) {
        fields.push("description = ?");
        values.push(category.description);
      }
      if (category.parent !== undefined) {
        fields.push("parent_id = ?");
        values.push(category.parent);
      }
      if (fields.length === 0) return;
      values.push(category.id);
      await conn.query(
        `UPDATE category SET ${fields.join(", ")} WHERE id = ?`,
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
      await conn.query("DELETE FROM category WHERE id = ?", [id]);
    } finally {
      if (conn) conn.release();
    }
  }
}
