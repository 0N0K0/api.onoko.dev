import { Role } from "./roleTypes";

export interface Coworker {
  id: string;
  name: string;
  roles?: Role[];
}
