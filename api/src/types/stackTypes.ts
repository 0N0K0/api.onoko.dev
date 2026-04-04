import { Category } from "./categoryTypes";

// Interface représentant une stack
export interface Stack {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  iconUrl?: string;
  versions: string[];
  skills: string[];
  category?: Category | string | null;
}
