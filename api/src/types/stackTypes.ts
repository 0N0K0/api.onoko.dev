import { Category } from "./categoryTypes";

export interface Stack {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  iconeUrl?: string;
  versions: string[];
  category?: Category | string | null;
}
