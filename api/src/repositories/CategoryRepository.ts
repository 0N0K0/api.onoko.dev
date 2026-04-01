import mariadb from "mariadb";
import crypto from "crypto";
import { Category } from "../types/categoryTypes";

export default class CategoryRepository {
  constructor(private pool: mariadb.Pool) {}

  async getAll(): Promise<Category[]> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      return await conn.query(`
        WITH RECURSIVE category_tree AS (
          SELECT id, label, entity, description, parent_id AS parent, 0 AS depth, CAST(label AS CHAR(255)) AS path
          FROM category
          WHERE parent_id IS NULL

          UNION ALL

          SELECT c.id, c.label, c.entity, c.description, c.parent_id AS parent, ct.depth + 1, CONCAT(ct.path, ' > ', c.label) AS path
          FROM category c
          JOIN category_tree ct ON c.parent_id = ct.id
        )
        SELECT id, label, entity, description, parent, depth FROM category_tree ORDER BY path;
        `);
    } finally {
      if (conn) conn.release();
    }
  }

  async get(
    key: "id" | "label",
    value: any,
    entity?: string,
  ): Promise<Category[] | null> {
    const categories = await this.getAll();
    const category = categories.find(
      (c) => c[key] === value && (!entity || c.entity === entity),
    );
    if (!category) return null;
    const findDescendants = (parentId: string): Category[] => {
      const children = categories.filter((c) => c.parent === parentId);
      return children.flatMap((child) => [child, ...findDescendants(child.id)]);
    };
    const descendants = findDescendants(category.id);
    return [category, ...descendants];
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
      // Gestion spéciale pour parent: si null, "", ou "null" on force à NULL
      if (category.parent !== undefined) {
        fields.push("parent_id = ?");
        if (category.parent === "") {
          values.push(null);
        } else {
          values.push(category.parent);
        }
      }
      // On exécute la requête même si la seule modif est parent_id = NULL
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
