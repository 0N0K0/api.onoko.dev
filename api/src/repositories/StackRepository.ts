import mariadb from "mariadb";
import crypto from "crypto";
import path from "path";
import { promises as fsPromises } from "fs";
import sharp from "sharp";

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

  private async saveIconFile(
    id: string,
    iconFile: { buffer: Buffer; mimetype: string; originalname: string }
  ): Promise<string> {
    const { mkdir, writeFile, unlink } = fsPromises;
    const publicDir = path.join(process.cwd(), "public", "stack");
    await mkdir(publicDir, { recursive: true });

    let iconExt = "webp";
    let iconPath = path.join(publicDir, `${id}.webp`);
    let iconType = iconFile.mimetype;

    // Supprimer les fichiers existants (webp/svg)
    for (const ext of ["webp", "svg"]) {
      const filePath = path.join(publicDir, `${id}.${ext}`);
      try { await unlink(filePath); } catch {}
    }

    if (
      iconType === "image/svg+xml" ||
      iconFile.originalname.endsWith(".svg")
    ) {
      iconExt = "svg";
      iconPath = path.join(publicDir, `${id}.svg`);
      await writeFile(iconPath, iconFile.buffer);
    } else {
      const image = sharp(iconFile.buffer);
      const metadata = await image.metadata();
      let width = metadata.width || 100;
      let height = metadata.height || 100;
      const maxDim = 100;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height / width) * maxDim);
          width = maxDim;
        } else {
          width = Math.round((width / height) * maxDim);
          height = maxDim;
        }
      }
      await image.resize(width, height).webp().toFile(iconPath);
    }
    return `${id}.${iconExt}`;
  }

  async create(stack: {
    label: string;
    iconFile: { buffer: Buffer; mimetype: string; originalname: string };
    description?: string;
    versions?: string[];
  }): Promise<void> {
    const id = crypto.randomBytes(16).toString("hex");
    const iconFileName = await this.saveIconFile(id, stack.iconFile);

    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(
        `
        INSERT INTO stack (id, label, icon, description) VALUES (?, ?, ?, ?);
        ${stack.versions && stack.versions.length > 0 ? `INSERT INTO stack_version (stack_id, version) VALUES ${stack.versions.map(() => "(?, ?)").join(", ")};` : ""}
        `,
        [
          id,
          stack.label,
          iconFileName,
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
      iconFile?: { buffer: Buffer; mimetype: string; originalname: string };
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
      if (stack.iconFile) {
        const iconFileName = await this.saveIconFile(id, stack.iconFile);
        fields.push("icon = ?");
        values.push(iconFileName);
      }
      if (stack.description !== undefined) {
        fields.push("description = ?");
        values.push(stack.description);
      }
      if (stack.versions)
        for (const version of stack.versions) {
          await this.addVersion(id, version);
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
