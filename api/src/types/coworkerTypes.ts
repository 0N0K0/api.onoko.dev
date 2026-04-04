import { Role } from "./roleTypes";

// Interface représentant un collaborateur
export interface Coworker {
  id: string;
  name: string;
  roles?: Role[];
}
