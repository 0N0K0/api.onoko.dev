import { Stack } from "./stackTypes";

export interface Category {
  id: string;
  label: string;
  entity?: string;
  description?: string;
  parent?: string;
  depth?: number;
  entities?: Stack[];
}
