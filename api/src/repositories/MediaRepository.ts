import mariadb from "mariadb";
import { Media } from "../types/mediaTypes";
import { saveImageFile } from "../utils/imageUtils";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { MEDIA_BASE_PATH } from "../constants/mediaConstants";

export class MediaRepository {
  constructor(private pool: mariadb.Pool) {}

  /**
   * Récupère tous les médias de la base de données, en utilisant une requête SQL pour sélectionner les champs pertinents de la table "medias".
   * Les résultats sont ensuite transformés en un format structuré où chaque média est représenté avec ses propriétés, y compris le chemin complet du fichier média.
   * @returns {Promise<Media[] | undefined>} Un tableau de médias récupérés de la base de données, avec leurs propriétés correspondantes. Si aucun média n'est trouvé, retourne un tableau vide.
   * @throws {Error} Une erreur si la récupération des médias échoue pour une raison quelconque.
   */
  async getAll(): Promise<Media[] | undefined> {
    const conn = await this.pool.getConnection();
    try {
      const rows = await conn.query(
        `
            SELECT m.*
            FROM medias m
            ORDER BY m.label ASC
        `,
      );
      if (rows.length === 0) return [];
      return rows.map((row: Media) => ({
        id: row.id,
        label: row.label,
        path: MEDIA_BASE_PATH + row.path,
        type: row.type,
        category: row.category,
      }));
    } catch (error) {
      console.error("Error retrieving medias:", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Ajoute un nouveau média à la base de données en utilisant les propriétés fournies, y compris le fichier média à enregistrer.
   * La méthode génère un ID unique pour le nouveau média, enregistre le fichier média sur le serveur, puis insère les données correspondantes dans la table "medias" de la base de données.
   * Après l'insertion, la méthode retourne un booléen indiquant si la création a réussi.
   * @param {Omit<Media, "id" | "path" | "type" | "category">} media - Les propriétés du média à ajouter, à l'exception de l'ID, du chemin, du type et de la catégorie qui sont gérés automatiquement.
   * @returns {Promise<boolean>} Indique si la création du média a réussi.
   * @throws {Error} Une erreur si la création du média échoue pour une raison quelconque, notamment si le fichier média n'est pas fourni ou si l'enregistrement du fichier échoue.
   */
  async add(
    media: Omit<Media, "id" | "path" | "type" | "category">,
  ): Promise<boolean> {
    const conn = await this.pool.getConnection();
    try {
      if (!media.file) throw new Error("File is required to add media");
      const id = crypto.randomUUID();
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
    } catch (error) {
      console.error("Error adding media:", error);
      throw error;
    } finally {
      conn.release();
    }
    return true;
  }

  /**
   * Met à jour les propriétés d'un média existant dans la base de données en fonction des propriétés fournies.
   * La méthode vérifie que l'ID du média est fourni, puis construit dynamiquement la requête SQL pour mettre à jour les champs spécifiés (label et catégorie).
   * Après l'exécution de la requête de mise à jour, la méthode retourne un booléen indiquant si la mise à jour a réussi.
   * @param {Partial<Media>} media - Les propriétés du média à mettre à jour, qui doivent inclure l'ID du média à mettre à jour. Les autres propriétés (label et catégorie) sont facultatives et seront mises à jour si elles sont fournies.
   * @returns {Promise<boolean>} Indique si la mise à jour du média a réussi.
   * @throws {Error} Une erreur si l'ID du média n'est pas fourni, ou si la mise à jour échoue pour une raison quelconque, notamment si la requête SQL échoue ou si aucun champ à mettre à jour n'est spécifié.
   */
  async update(media: Partial<Media>): Promise<boolean> {
    console.log(media);
    if (!media.id) throw new Error("ID is required to update media");
    const conn = await this.pool.getConnection();
    try {
      const fields = [];
      const values = [];
      if (media.label) {
        fields.push("label = ?");
        values.push(media.label);
      }
      if (media.category !== undefined) {
        fields.push("category = ?");
        values.push(media.category ? media.category : null);
      }
      if (fields.length > 0) {
        values.push(media.id);
        console.log(fields, values);
        await conn.query(
          `UPDATE medias SET ${fields.join(", ")} WHERE id = ?`,
          values,
        );
      } else {
        throw new Error("No fields to update");
      }
    } catch (error) {
      console.error("Error updating media:", error);
      throw error;
    } finally {
      conn.release();
    }
    return true;
  }

  /**
   * Supprime un média de la base de données en fonction de son ID, et supprime également les fichiers associés du serveur.
   * La méthode exécute une requête SQL pour récupérer le chemin du fichier média correspondant à l'ID spécifié, puis supprime les fichiers associés du serveur.
   * Ensuite, elle exécute une requête SQL pour supprimer le média de la table "medias" de la base de données.
   * Après l'exécution de la requête de suppression, la méthode retourne un booléen indiquant si la suppression a réussi.
   * @param {string} id - L'ID du média à supprimer de la base de données.
   * @returns {Promise<boolean>} Indique si la suppression du média a réussi.
   * @throws {Error} Une erreur si la suppression échoue pour une raison quelconque, notamment si la requête SQL échoue ou si les fichiers associés ne peuvent pas être supprimés.
   */
  async remove(id: string): Promise<boolean> {
    const conn = await this.pool.getConnection();
    try {
      const result = await conn.query(`SELECT path FROM medias WHERE id = ?`, [
        id,
      ]);
      if (result.length > 0) {
        const baseName = result[0].path.replace(/\.[^/.]+$/, "");
        const publicDir = path.join(process.cwd(), "public", "medias");
        const files = await fs.readdir(publicDir);
        const toDelete = files.filter((f) => f.includes(baseName));
        for (const file of toDelete) {
          await fs.unlink(path.join(publicDir, file));
        }
      }
      await conn.query(`DELETE FROM medias WHERE id = ?`, [id]);
    } catch (error) {
      console.error("Error removing media:", error);
      throw error;
    } finally {
      conn.release();
    }
    return true;
  }
}
