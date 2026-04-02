import { Role } from "./RoleTypes";

export interface Coworker {
  id: string;
  name: string;
  roles?: Role[];
}
