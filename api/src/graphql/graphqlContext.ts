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
 * @param {Object} param - Un objet contenant le token JWT de l'utilisateur et la pool de connexions à la base de données.
 * @param {jwt.JwtPayload | null} param.user - Les informations de l'utilisateur extraites du token JWT, ou null si l'utilisateur n'est pas authentifié.
 * @param {Pool} param.pool - La pool de connexions à la base de données, utilisée pour créer les instances des repositories.
 * @throws {Error} Une erreur si la création du contexte échoue pour une raison quelconque.
 * @returns {{
 *             user: jwt.JwtPayload | null;
 *             settingsRepo: SettingsRepository;
 *             categoryRepo: CategoryRepository;
 *             stackRepo: StackRepository;
 *             roleRepo: RoleRepository;
 *             coworkerRepo: CoworkerRepository;
 *             projectRepo: ProjectRepository;
 *             mediaRepo: MediaRepository;
 *           }} Un objet représentant le contexte GraphQL, avec les propriétés user, settingsRepo, categoryRepo, stackRepo, roleRepo, coworkerRepo, projectRepo et mediaRepo.
 */
export function getGraphqlContext({
  user,
  pool,
  ip,
}: {
  user: jwt.JwtPayload | null;
  pool: Pool;
  ip: string;
}) {
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
