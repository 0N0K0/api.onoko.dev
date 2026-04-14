import { Category } from "./categoryTypes";

import { Readable } from "stream";

export type ImageFile = {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => Readable;
};

export interface Media {
  id: string;
  label?: string;
  path: string;
  type: string;
  file?: ImageFile;
  category?: string;
}
