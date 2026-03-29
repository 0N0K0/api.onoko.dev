import mariadb from "mariadb";
import crypto from "crypto";

export class StackRepository {
  private pool: mariadb.Pool;

  constructor(pool: mariadb.Pool) {
    this.pool = pool;
  }

  async getAll(): Promise<any[]> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query("SELECT * FROM stack");
      return rows;
    } finally {
      if (conn) conn.release();
    }
  }

  async get(key: string, value: any): Promise<any | null> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(
        `
        SELECT * FROM stack WHERE ${key} = ?;
        SELECT * FROM stack_version WHERE stack_id = (SELECT id FROM stack WHERE ${key} = ?);
        `,
        [value, value],
      );
      if (rows.length > 0) {
        return rows[0];
      }
      return null;
    } finally {
      if (conn) conn.release();
    }
  }

  async create(stack: {
    label: string;
    icon: string;
    description?: string;
    versions?: string[];
  }): Promise<void> {
    const id = crypto.randomBytes(16).toString("hex");
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(
        `
        INSERT INTO stack (id, label, icon, description) VALUES (?, ?, ?, ?);
        INSERT INTO stack_version (stack_id, version) VALUES ${stack.versions?.map(() => "(?, ?)").join(", ")};
        `,
        [
          id,
          stack.label,
          stack.icon,
          stack.description || null,
          ...(stack.versions?.flatMap((version) => [id, version]) || []),
        ],
      );
    } finally {
      if (conn) conn.release();
    }
  }

  async update(
    id: string,
    stack: {
      label?: string;
      icon?: string;
      description?: string;
      versions?: string[];
    },
  ): Promise<void> {
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
        fields.push("icon = ?");
        values.push(stack.icon);
      }
      if (stack.description !== undefined) {
        fields.push("description = ?");
        values.push(stack.description);
      }
      if (stack.versions)
        for (const version of stack.versions) {
          this.addVersion(id, version);
        }
      if (fields.length === 0) return; // Nothing to update
      values.push(id);
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

  async getVersions(stackId: string): Promise<string[]> {
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

  async addVersion(stackId: string, version: string): Promise<void> {
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

  async removeVersion(stackId: string, version: string): Promise<void> {
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
