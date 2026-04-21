import mariadb from "mariadb";
import { Media } from "../types/mediaTypes";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { MEDIA_BASE_PATH } from "../constants/mediaConstants";
import { withConnection, buildSetClause } from "../database/dbHelpers";
import { promises as fsPromises, createWriteStream } from "fs";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import sharp from "sharp";
export class MediaRepository {
  constructor(private pool: mariadb.Pool) {}

  /**
   * Récupère tous les médias de la base de données, en utilisant une requête SQL pour sélectionner les champs pertinents de la table "medias".
   * Les résultats sont ensuite transformés en un format structuré où chaque média est représenté avec ses propriétés, y compris le chemin complet du fichier média.
   * @returns {Promise<Media[] | undefined>} Un tableau de médias récupérés de la base de données, avec leurs propriétés correspondantes. Si aucun média n'est trouvé, retourne un tableau vide.
   * @throws {Error} Une erreur si la récupération des médias échoue pour une raison quelconque.
   */
  async getAll(): Promise<Media[] | undefined> {
    return withConnection(this.pool, async (conn) => {
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
    });
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
    await withConnection(this.pool, async (conn) => {
      if (!media.file) throw new Error("File is required to add media");
      const id = crypto.randomUUID();
      const label = media.file.filename;
      const filePath = await this._saveImageFile(media.file);
      await conn.query(
        `INSERT INTO medias (id, path, type, label) VALUES (?, ?, ?, ?)`,
        [
          id,
          filePath,
          media.file.mimetype === "image/svg+xml" ? "svg" : "webp",
          label,
        ],
      );
    });
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
    if (!media.id) throw new Error("ID is required to update media");
    await withConnection(this.pool, async (conn) => {
      const set = buildSetClause({
        label: media.label || undefined,
        category:
          media.category !== undefined ? media.category || null : undefined,
      });
      if (!set) throw new Error("No fields to update");
      await conn.query(`UPDATE medias SET ${set.sql} WHERE id = ?`, [
        ...set.values,
        media.id,
      ]);
    });
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
    await withConnection(this.pool, async (conn) => {
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
    });
    return true;
  }

  /**
   * Enregistre un fichier média sur le serveur, en gérant à la fois les images raster (JPEG, PNG, WebP) et les images vectorielles (SVG).
   * Pour les images SVG, le fichier est enregistré directement après avoir calculé un hash de son contenu pour éviter les doublons.
   * Pour les images raster, le fichier est traité avec Sharp pour générer plusieurs tailles d'image au format WebP, en utilisant également un hash du contenu pour éviter les doublons.
   * La méthode retourne le nom du fichier enregistré, qui peut être utilisé pour construire le chemin d'accès complet du média.
   * @param {Object} imageFile - L'objet représentant le fichier média à enregistrer, contenant les propriétés filename, mimetype et createReadStream.
   * @returns {Promise<string>} Le nom du fichier enregistré sur le serveur, qui peut être utilisé pour construire le chemin d'accès complet du média.
   * @throws {Error} Une erreur si l'enregistrement du fichier échoue pour une raison quelconque, notamment si le stream de lecture du fichier échoue ou si le traitement de l'image avec Sharp échoue.
   */
  private async _saveImageFile(imageFile: {
    filename: string;
    mimetype: string;
    createReadStream: () => import("stream").Readable;
  }): Promise<string> {
    const { mkdir, rename, unlink } = fsPromises;
    const publicDir = path.join(process.cwd(), "public", "medias");
    await mkdir(publicDir, { recursive: true });

    const isSvg =
      imageFile.mimetype === "image/svg+xml" ||
      imageFile.filename.endsWith(".svg");

    const tempId = crypto.randomBytes(8).toString("hex");

    if (isSvg) {
      // Hash calculé à la volée sans bufferiser le fichier entier
      const hash = crypto.createHash("sha256");
      const hashThrough = new Transform({
        transform(chunk: Buffer, _enc, cb) {
          hash.update(chunk);
          cb(null, chunk);
        },
      });
      const tempPath = path.join(publicDir, `_tmp_${tempId}.svg`);
      try {
        await pipeline(
          imageFile.createReadStream(),
          hashThrough,
          createWriteStream(tempPath),
        );
        const baseName = hash.digest("hex");
        await rename(tempPath, path.join(publicDir, `${baseName}.svg`));
        return `${baseName}.svg`;
      } catch (err) {
        await unlink(tempPath).catch(() => {});
        throw err;
      }
    }

    // Image raster : stream vers sharp, plusieurs tailles via clone()
    // Un seul passage du stream en mémoire — pas de bufferisation complète
    const hash = crypto.createHash("sha256");
    const widths: Record<string, number> = {
      xl: 1920,
      l: 1392,
      m: 1056,
      s: 720,
      xs: 400,
    };

    const sharpStream = sharp();

    // Les clones doivent être créés AVANT que le pipe commence
    const resizeOps = Object.entries(widths).map(([size, width]) => {
      const tempPath = path.join(publicDir, `_tmp_${tempId}_${size}.webp`);
      return {
        tempPath,
        finalName: (baseName: string) =>
          path.join(publicDir, `${baseName}_${size}.webp`),
        promise: sharpStream
          .clone()
          .resize(width, undefined, { withoutEnlargement: true })
          .webp()
          .toFile(tempPath),
      };
    });

    const readStream = imageFile.createReadStream();
    readStream.on("data", (chunk: Buffer) => hash.update(chunk));
    readStream.on("error", (err) => sharpStream.destroy(err));
    readStream.pipe(sharpStream);

    try {
      await Promise.all(resizeOps.map((op) => op.promise));
      const baseName = hash.digest("hex");
      await Promise.all(
        resizeOps.map(({ tempPath, finalName }) =>
          rename(tempPath, finalName(baseName)),
        ),
      );
      return `${baseName}.webp`;
    } catch (err) {
      await Promise.all(
        resizeOps.map(({ tempPath }) => unlink(tempPath).catch(() => {})),
      );
      throw err;
    }
  }
}
