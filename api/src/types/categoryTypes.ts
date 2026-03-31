import { Stack } from "./stackTypes";

export interface Category {
  id: string;
  label: string;
  entity?: string;
  description?: string;
  parent?: Category | string | null;
  children?: Category[];
  entities?: Stack[];
}
