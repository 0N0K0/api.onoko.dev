// Interface représentant une stack
export interface Stack {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  versions: string[];
  skills: string[];
  category?: string | null;
}
