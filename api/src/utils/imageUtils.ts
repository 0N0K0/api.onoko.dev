import path from "path";
import { promises as fsPromises } from "fs";
import sharp from "sharp";
import crypto from "crypto";

/**
 * Enregistre un fichier image dans un répertoire public spécifié, en redimensionnant l'image si nécessaire et en la convertissant au format WebP. Le nom du fichier est généré à partir d'un hash du contenu de l'image pour éviter les collisions. Si le fichier est une image SVG, il est enregistré tel quel sans conversion.
 * @param {Object} iconFile - L'objet représentant le fichier image à enregistrer, contenant un buffer de données, le type MIME et le nom original du fichier.
 * @param {string} directory - Le nom du répertoire public dans lequel enregistrer l'image (par exemple "icons").
 * @param {number} maxDim - La dimension maximale (en pixels) pour la largeur ou la hauteur de l'image. Si l'image dépasse cette dimension, elle sera redimensionnée proportionnellement.
 * @returns {Promise<string>} Le nom du fichier enregistré (avec extension) qui peut être utilisé pour accéder à l'image via une URL publique.
 * @throws {Error} Une erreur si le processus d'enregistrement de l'image échoue pour une raison quelconque (par exemple, problème d'écriture de fichier, format d'image non supporté, etc.).
 */
export async function saveImageFile(
  iconFile: { buffer: Buffer; mimetype: string; originalname: string },
  directory: string,
  maxDim: number,
): Promise<string> {
  const buffer = Buffer.from(iconFile.buffer);
  const { mkdir, writeFile, unlink } = fsPromises;
  const publicDir = path.join(process.cwd(), "public", directory);
  await mkdir(publicDir, { recursive: true });

  // Hashe le contenu de l'image pour le nom de fichier
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  let iconExt = "webp";
  let iconType = iconFile.mimetype;
  let baseName = hash;
  let iconPath = path.join(publicDir, `${baseName}.webp`);

  if (iconType === "image/svg+xml" || iconFile.originalname.endsWith(".svg")) {
    iconExt = "svg";
    iconPath = path.join(publicDir, `${baseName}.svg`);
    try {
      await unlink(iconPath);
    } catch {}
    await writeFile(iconPath, buffer);
    return `${baseName}.svg`;
  } else {
    try {
      await unlink(iconPath);
    } catch {}
    const image = sharp(buffer);
    const metadata = await image.metadata();
    let width = metadata.width || maxDim;
    let height = metadata.height || maxDim;
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
    return `${baseName}.webp`;
  }
}
