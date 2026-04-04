import { Stack } from "./stackTypes";

// Interface représentant une catégorie
export interface Category {
  id: string;
  label: string;
  entity?: string;
  description?: string;
  parent?: string;
  depth?: number;
  entities?: Stack[];
}
