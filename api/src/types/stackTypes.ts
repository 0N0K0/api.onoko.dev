import { Category } from "./categoryTypes";

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
