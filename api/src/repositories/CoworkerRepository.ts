import mariadb from "mariadb";
import crypto from "crypto";
import { Coworker } from "../types/CoworkerTypes";

export default class CoworkerRepository {
  constructor(private pool: mariadb.Pool) {}

  async getAll(): Promise<Coworker[]> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const coworkers = await conn.query(`
        SELECT c.*, r.id AS role_id, r.label AS role_label
        FROM coworker c
        LEFT JOIN coworker_role cr ON c.id = cr.coworker_id
        LEFT JOIN role r ON cr.role_id = r.id
        ORDER BY c.name
      `);
      const coworkerMap: Record<string, Coworker> = {};
      coworkers.forEach((row: any) => {
        if (!coworkerMap[row.id]) {
          coworkerMap[row.id] = {
            id: row.id,
            name: row.name,
            roles: [],
          };
        }
        if (row.role_id) {
          coworkerMap[row.id].roles!.push({
            id: row.role_id,
            label: row.role_label,
          });
        }
      });
      return Object.values(coworkerMap);
    } finally {
      if (conn) conn.release();
    }
  }

  async get(key: "id" | "label", value: string): Promise<Coworker | null> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const coworkers = await conn.query(
        `
        SELECT c.*, r.id AS role_id, r.label AS role_label
        FROM coworker c
        LEFT JOIN coworker_role cr ON c.id = cr.coworker_id
        LEFT JOIN role r ON cr.role_id = r.id
        WHERE c.${key} = ?
       `,
        [value],
      );
      if (!coworkers || coworkers.length === 0) return null;
      const first = coworkers[0];
      const coworkerMap: Record<string, Coworker> = {};
      coworkers.forEach((row: any) => {
        if (!coworkerMap[row.id]) {
          coworkerMap[row.id] = {
            id: row.id,
            name: row.name,
            roles: [],
          };
        }
        if (row.role_id) {
          coworkerMap[row.id].roles!.push({
            id: row.role_id,
            label: row.role_label,
          });
        }
      });
      return Object.values(coworkerMap)[0] || null;
    } finally {
      if (conn) conn.release();
    }
  }

  async create(coworker: Omit<Coworker, "id">): Promise<string> {
    const id = crypto.randomBytes(16).toString("hex");
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`INSERT INTO coworker (id, name) VALUES (?, ?)`, [
        id,
        coworker.name,
      ]);
      if (coworker.roles && coworker.roles.length > 0) {
        for (const role of coworker.roles) {
          await conn.query(
            `INSERT INTO coworker_role (coworker_id, role_id) VALUES (?, ?)`,
            [id, role],
          );
        }
      }
      return id;
    } finally {
      if (conn) conn.release();
    }
  }

  async update(coworker: Partial<Coworker>): Promise<void> {
    if (!coworker.id) throw new Error("ID is required for update");
    let conn;
    try {
      conn = await this.pool.getConnection();
      const fields = [];
      const values = [];
      if (coworker.name) {
        fields.push("name = ?");
        values.push(coworker.name);
      }
      if (fields.length > 0) {
        values.push(coworker.id);
        await conn.query(
          `UPDATE coworker SET ${fields.join(", ")} WHERE id = ?`,
          values,
        );
      }
      if (coworker.roles) {
        await conn.query(`DELETE FROM coworker_role WHERE coworker_id = ?`, [
          coworker.id,
        ]);
        if (coworker.roles.length > 0) {
          for (const role of coworker.roles) {
            await conn.query(
              `INSERT INTO coworker_role (coworker_id, role_id) VALUES (?, ?)`,
              [coworker.id, role],
            );
          }
        }
      }
    } finally {
      if (conn) conn.release();
    }
  }

  async delete(id: string): Promise<void> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`DELETE FROM coworker WHERE id = ?`, [id]);
    } finally {
      if (conn) conn.release();
    }
  }
}
