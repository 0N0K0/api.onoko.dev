import path from "path";
import { promises as fsPromises } from "fs";
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
  const chunks: Buffer[] = [];
  for await (const chunk of imageFile.createReadStream()) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const buffer = Buffer.concat(chunks);
  const { mkdir, writeFile, unlink } = fsPromises;
  const publicDir = path.join(process.cwd(), "public", "medias");
  await mkdir(publicDir, { recursive: true });

  // Hashe le contenu de l'image pour le nom de fichier
  const baseName = crypto.createHash("sha256").update(buffer).digest("hex");
  let imageExt = "webp";
  let imagePath = path.join(publicDir, `${baseName}.${imageExt}`);

  if (
    imageFile.mimetype === "image/svg+xml" ||
    imageFile.filename.endsWith(".svg")
  ) {
    imageExt = "svg";
    imagePath = path.join(publicDir, `${baseName}.${imageExt}`);
    try {
      await unlink(imagePath);
    } catch {}
    await writeFile(imagePath, buffer);
  } else {
    try {
      await unlink(imagePath);
    } catch {}
    const image = sharp(buffer);
    const metadata = await image.metadata();
    let widths: { [key: string]: number } = {
      xl: 1920,
      l: 1392,
      m: 1056,
      s: 720,
      xs: 400,
    };
    for (const width in widths) {
      const resizedPath = path.join(publicDir, `${baseName}_${width}.webp`);
      if (metadata.width && metadata.width > widths[width]) {
        await image.resize(widths[width]).webp().toFile(resizedPath);
      } else {
        await image.webp().toFile(resizedPath);
      }
    }
  }
  return `${baseName}.${imageExt}`;
}
