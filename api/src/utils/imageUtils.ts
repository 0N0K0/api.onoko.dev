import path from "path";
import { promises as fsPromises } from "fs";
import sharp from "sharp";

export async function saveImageFile(
  fileName: string,
  iconFile: { buffer: Buffer; mimetype: string; originalname: string },
  directory: string,
  maxDim: number,
): Promise<string> {
  const { mkdir, writeFile, unlink } = fsPromises;
  const publicDir = path.join(process.cwd(), "public", directory);
  await mkdir(publicDir, { recursive: true });

  let iconExt = "webp";
  let iconPath = path.join(publicDir, `${fileName}.webp`);
  let iconType = iconFile.mimetype;

  // Supprimer les fichiers existants (webp/svg)
  for (const ext of ["webp", "svg"]) {
    const filePath = path.join(publicDir, `${fileName}.${ext}`);
    try {
      await unlink(filePath);
    } catch {}
  }

  if (iconType === "image/svg+xml" || iconFile.originalname.endsWith(".svg")) {
    iconExt = "svg";
    iconPath = path.join(publicDir, `${fileName}.svg`);
    await writeFile(iconPath, iconFile.buffer);
  } else {
    const image = sharp(iconFile.buffer);
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
  }
  return `${fileName}.${iconExt}`;
}
