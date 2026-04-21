import path from "path";
import { promises as fsPromises, createWriteStream } from "fs";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import sharp from "sharp";
import crypto from "crypto";

/**
 * Enregistre un fichier image dans un répertoire public spécifié, en redimensionnant l'image si nécessaire et en la convertissant au format WebP. Le nom du fichier est généré à partir d'un hash du contenu de l'image pour éviter les collisions. Si le fichier est une image SVG, il est enregistré tel quel sans conversion.
 * @param {Object} imageFile - L'objet représentant le fichier image à enregistrer, contenant un buffer de données, le type MIME et le nom original du fichier.
 * @returns {Promise<string>} Le nom du fichier enregistré (avec extension) qui peut être utilisé pour accéder à l'image via une URL publique.
 * @throws {Error} Une erreur si le processus d'enregistrement de l'image échoue pour une raison quelconque (par exemple, problème d'écriture de fichier, format d'image non supporté, etc.).
 */
export async function saveImageFile(imageFile: {
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
