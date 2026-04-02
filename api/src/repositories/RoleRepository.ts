import mariadb from "mariadb";
import crypto from "crypto";
import { Role } from "../types/RoleTypes";

export default class RoleRepository {
  constructor(private pool: mariadb.Pool) {}

  async getAll(): Promise<Role[]> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      return await conn.query(`SELECT id, label FROM role`);
    } finally {
      if (conn) conn.release();
    }
  }

  async get(id: string): Promise<Role | null> {
    const roles = await this.getAll();
    return roles.find((r) => r.id === id) || null;
  }

  async create(role: Omit<Role, "id">): Promise<string> {
    const id = crypto.randomBytes(16).toString("hex");

    let conn;

    try {
      conn = await this.pool.getConnection();
      await conn.query(`INSERT INTO role (id, label) VALUES (?, ?)`, [
        id,
        role.label,
      ]);
      return id;
    } finally {
      if (conn) conn.release();
    }
  }

  async update(role: Partial<Role>): Promise<void> {
    if (!role.id) throw new Error("ID is required for update");
    let conn;
    try {
      conn = await this.pool.getConnection();
      const fields = [];
      const values = [];
      if (role.label) {
        fields.push("label = ?");
        values.push(role.label);
      }
      if (fields.length === 0) return; // No fields to update
      values.push(role.id); // ID for WHERE clause
      await conn.query(
        `UPDATE role SET ${fields.join(", ")} WHERE id = ?`,
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
      await conn.query(`DELETE FROM role WHERE id = ?`, [id]);
    } finally {
      if (conn) conn.release();
    }
  }
}
