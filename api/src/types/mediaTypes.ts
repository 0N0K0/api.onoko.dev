import { Category } from "./categoryTypes";

export type ImageFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

export interface Media {
  id: string;
  label?: string;
  path: string;
  type: string;
  file?: ImageFile;
  category?: string;
}
