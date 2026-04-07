import { Category } from "./categoryTypes";
import { ImageFile } from "./imageTypes";
import { Media } from "./mediaTypes";

// Interface représentant une stack
export interface Stack {
  id: string;
  label: string;
  icon?: Media | string;
  description?: string;
  versions: string[];
  skills: string[];
  category?: Category | string | null;
}
