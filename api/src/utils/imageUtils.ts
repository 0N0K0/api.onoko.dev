import path from "path";
import { promises as fsPromises } from "fs";
import sharp from "sharp";

import crypto from "crypto";

export async function saveImageFile(
  iconFile: { buffer: Buffer; mimetype: string; originalname: string },
  directory: string,
  maxDim: number,
): Promise<string> {
  const buffer = Buffer.from(iconFile.buffer);
  const { mkdir, writeFile, unlink } = fsPromises;
  const publicDir = path.join(process.cwd(), "public", directory);
  await mkdir(publicDir, { recursive: true });

  // Hash du contenu de l'image pour le nom de fichier
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
