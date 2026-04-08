import mariadb from "mariadb";
import { Media } from "../types/mediaTypes";
import { Category } from "../types/categoryTypes";
import { saveImageFile } from "../utils/imageUtils";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path/win32";
import { MEDIA_BASE_PATH } from "../constants/mediaConstants";

export class MediaRepository {
  constructor(private pool: mariadb.Pool) {}

  async getAll(): Promise<Media[] | undefined> {
    const conn = await this.pool.getConnection();
    try {
      const rows = await conn.query(
        `
            SELECT m.*, c.id AS category_id, c.label AS category_label
            FROM medias m
            LEFT JOIN category c ON m.category = c.id
        `,
      );
      if (rows.length === 0) return [];
      return rows.map(
        (row: Media & { category_id?: string; category_label?: string }) => ({
          id: row.id,
          path: MEDIA_BASE_PATH + row.path,
          type: row.type,
          category: row.category_id
            ? {
                id: row.category_id,
                label: row.category_label,
              }
            : undefined,
        }),
      );
    } finally {
      conn.release();
    }
  }

  async get(id: string): Promise<Media | null> {
    const conn = await this.pool.getConnection();
    try {
      const row = await conn.query(
        `
            SELECT m.*, c.id AS category_id, c.label AS category_label
            FROM medias m
            LEFT JOIN category c ON m.category = c.id
            WHERE m.id = ?
        `,
        [id],
      );
      if (row.length === 0) return null;
      return {
        id: row[0].id,
        path: MEDIA_BASE_PATH + row[0].path,
        type: row[0].type,
        category: row[0].category_id
          ? {
              id: row[0].category_id,
              label: row[0].category_label,
            }
          : undefined,
      };
    } finally {
      conn.release();
    }
  }

  async add(
    media: Omit<Media, "id" | "path" | "type" | "category">,
  ): Promise<string> {
    const conn = await this.pool.getConnection();
    try {
      if (!media.file) throw new Error("File is required to add media");
      const id = crypto.randomBytes(16).toString("hex");
      const label = media.file.originalname;
      const path = await saveImageFile(media.file);
      await conn.query(
        `INSERT INTO medias (id, path, type, label) VALUES (?, ?, ?, ?)`,
        [
          id,
          path,
          media.file.mimetype === "image/svg+xml" ? "svg" : "webp",
          label,
        ],
      );
      return id;
    } finally {
      conn.release();
    }
  }

  async update(media: Partial<Media>): Promise<void> {
    if (!media.id) throw new Error("ID is required to update media");
    const conn = await this.pool.getConnection();
    try {
      const fields = [];
      const values = [];
      if (media.label) {
        fields.push("label = ?");
        values.push(media.label);
      }
      if (media.category) {
        fields.push("category = ?");
        values.push((media.category as Category).id);
      }
      if (fields.length > 0) {
        values.push(media.id);
        await conn.query(
          `UPDATE medias SET ${fields.join(", ")} WHERE id = ?`,
          values,
        );
      }
    } finally {
      conn.release();
    }
  }

  async remove(id: string): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      const result = await conn.query(`SELECT path FROM medias WHERE id = ?`, [
        id,
      ]);
      if (result.length > 0) {
        const baseName = result[0].path.replace(/\.[^/.]+$/, "");
        const publicDir = path.join(process.cwd(), "public");
        const files = await fs.readdir(publicDir);
        const toDelete = files.filter((f) => f.includes(baseName));
        for (const file of toDelete) {
          await fs.unlink(path.join(publicDir, file));
        }
      }
      await conn.query(`DELETE FROM medias WHERE id = ?`, [id]);
    } finally {
      conn.release();
    }
  }
}
