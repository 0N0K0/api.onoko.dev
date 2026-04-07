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

  async getAll(): Promise<Category[] | undefined | null> {
    const conn = await this.pool.getConnection();
    try {
      // Récupère toutes les catégories de la sous-arborescence
      const categories = await conn.query(
        `WITH RECURSIVE subcategories AS (
          SELECT * FROM category
          UNION ALL
          SELECT c.* FROM category c
          INNER JOIN subcategories sc ON c.parent_id = sc.id
        )
        SELECT * FROM subcategories`,
      );
      // Récupère toutes les stacks liées à ces catégories
      const categoryIds = categories.map((cat: { id: string }) => cat.id);
      let medias: (Media & {
        c_id?: string;
        c_label?: string;
      })[] = [];
      if (categoryIds.length > 0) {
        const placeholders = categoryIds.map(() => "?").join(",");
        medias = await conn.query(
          `SELECT m.*, c.id as c_id, c.label as c_label
           FROM medias m
           LEFT JOIN category c ON m.category = c.id
           WHERE m.category IN (${placeholders})`,
          categoryIds,
        );
      }
      // Regroupe les versions par stack
      const mediaMap = new Map<string, Media>();
      for (const row of medias) {
        if (!mediaMap.has(row.id)) {
          mediaMap.set(row.id, {
            id: row.id,
            path: MEDIA_BASE_PATH + row.path,
            type: row.type,
            category: row.c_id
              ? ({
                  id: row.c_id,
                  label: row.c_label,
                } as Category)
              : undefined,
          });
        }
      }
      // Construit l'arbre récursif
      function buildTree(parentId: string | null): {
        id: string;
        label: string;
        description: string;
        entities: Media[];
        children: Category[];
      }[] {
        return categories
          .filter(
            (cat: { parent_id: string | null }) => cat.parent_id === parentId,
          )
          .map((cat: { id: string; label: string; description: string }) => {
            const catMedias = Array.from(mediaMap.values()).filter(
              (m: Media) => (m.category as Category).id === cat.id,
            );
            return {
              id: cat.id,
              label: cat.label,
              description: cat.description,
              entities: catMedias,
              children: buildTree(cat.id),
            };
          });
      }
      const result = buildTree(null);
      return result;
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
            INNER JOIN category c ON m.category = c.id
            WHERE m.id = ?
        `,
        [id],
      );
      if (row.length === 0) return null;
      return {
        id: row[0].id,
        path: MEDIA_BASE_PATH + row[0].path,
        type: row[0].type,
        category: {
          id: row[0].category_id,
          label: row[0].category_label,
        },
      };
    } finally {
      conn.release();
    }
  }

  async add(media: Omit<Media, "id" | "path" | "type">): Promise<string> {
    const conn = await this.pool.getConnection();
    try {
      if (!media.file) throw new Error("File is required to add media");
      const id = crypto.randomBytes(16).toString("hex");
      const path = await saveImageFile(media.file);
      await conn.query(
        `INSERT INTO medias (id, path, type, category) VALUES (?, ?, ?, ?)`,
        [id, path, media.file.mimetype, (media.category as Category).id],
      );
      return id;
    } finally {
      conn.release();
    }
  }

  async update(media: Partial<Media>): Promise<void> {
    if (!media.id) throw new Error("ID is required to update media");
    if (!media.category)
      throw new Error("Category is required to update media");
    const conn = await this.pool.getConnection();
    try {
      await conn.query(`UPDATE medias SET category = ? WHERE id = ?`, [
        (media.category as Category).id,
        media.id,
      ]);
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
