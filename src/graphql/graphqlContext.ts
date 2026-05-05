import CategoryRepository from "../repositories/CategoryRepository";
import StackRepository from "../repositories/StackRepository";
import RoleRepository from "../repositories/RoleRepository";
import CoworkerRepository from "../repositories/CoworkerRepository";
import ProjectRepository from "../repositories/ProjectRepository";
import { SettingsRepository } from "../repositories/SettingsRepository";
import { Pool } from "mariadb/*";
import jwt from "jsonwebtoken";
import { MediaRepository } from "../repositories/MediaRepository";

/**
 * Fonction pour créer le contexte GraphQL, qui sera passé à tous les résolveurs.
 * Le contexte contient les informations de l'utilisateur authentifié (s'il y en a un) et les instances des repositories pour accéder aux données.
 * @param {jwt.JwtPayload | null} param.user Les informations de l'utilisateur authentifié, ou null s'il n'y en a pas.
 * @param {Pool} param.pool La pool de connexions à la base de données, utilisée pour créer les instances des repositories.
 * @param {string} param.ip L'adresse IP du client effectuant la requête GraphQL.
 * @returns {{
 *             user: jwt.JwtPayload | null;
 *             ip: string;
 *             settingsRepo: SettingsRepository;
 *             categoryRepo: CategoryRepository;
 *             stackRepo: StackRepository;
 *             roleRepo: RoleRepository;
 *             coworkerRepo: CoworkerRepository;
 *             projectRepo: ProjectRepository;
 *             mediaRepo: MediaRepository;
 *           }} Le contexte GraphQL contenant les informations de l'utilisateur et les repositories.
 * @throws {Error} Une erreur si la création du contexte échoue.
 */
export function getGraphqlContext({
  user,
  pool,
  ip,
}: {
  user: jwt.JwtPayload | null;
  pool: Pool;
  ip: string;
}): {
  user: jwt.JwtPayload | null;
  ip: string;
  settingsRepo: SettingsRepository;
  categoryRepo: CategoryRepository;
  stackRepo: StackRepository;
  roleRepo: RoleRepository;
  coworkerRepo: CoworkerRepository;
  projectRepo: ProjectRepository;
  mediaRepo: MediaRepository;
} {
  return {
    user,
    ip,
    settingsRepo: new SettingsRepository(pool),
    categoryRepo: new CategoryRepository(pool),
    stackRepo: new StackRepository(pool),
    roleRepo: new RoleRepository(pool),
    coworkerRepo: new CoworkerRepository(pool),
    projectRepo: new ProjectRepository(pool),
    mediaRepo: new MediaRepository(pool),
  };
}
