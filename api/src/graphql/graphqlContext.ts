import CategoryRepository from "../repositories/CategoryRepository";
import { StackRepository } from "../repositories/StackRepository";
import RoleRepository from "../repositories/RoleRepository";
import CoworkerRepository from "../repositories/CoworkerRepository";
import ProjectRepository from "../repositories/ProjectRepository";
import { SettingsRepository } from "../repositories/SettingsRepository";

export function getGraphqlContext({ user, pool }: { user: any; pool: any }) {
  return {
    user,
    settingsRepo: new SettingsRepository(pool),
    categoryRepo: new CategoryRepository(pool),
    stackRepo: new StackRepository(pool),
    roleRepo: new RoleRepository(pool),
    coworkerRepo: new CoworkerRepository(pool),
    projectRepo: new ProjectRepository(pool),
  };
}
