import { Category } from "./categoryTypes";
import { ImageFile } from "./imageTypes";

// Interface représentant une stack
export interface Stack {
  id: string;
  label: string;
  icon?: string;
  iconUrl?: string;
  iconFile?: ImageFile;
  description?: string;
  versions: string[];
  skills: string[];
  category?: Category | string | null;
}
