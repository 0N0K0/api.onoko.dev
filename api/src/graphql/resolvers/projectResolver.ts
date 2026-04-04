import ProjectRepository from "../../repositories/ProjectRepository";
import { Project } from "../../types/projectTypes";
import jwt from "jsonwebtoken";

// Résolveur GraphQL pour les opérations liées aux projets
const projectResolver = {
  /**
   * Récupère tous les projets
   * Appelle la méthode getAll du repository des projets pour récupérer tous les projets de la base de données.
   * @param {Object} _args Les arguments de la requête, qui ne sont pas utilisés dans cette opération.
   * @param {Object} context Le contexte de la requête, contenant le repository des projets.
   * @returns {Promise<Project[]>} Un tableau de projets récupérés de la base de données.
   */
  projects: async (
    _args: any,
    context: { projectRepo: ProjectRepository },
  ): Promise<Project[]> => {
    return await context.projectRepo.getAll();
  },

  /**
   * Récupère un projet par ID ou label
   * Appelle la méthode get du repository des projets pour récupérer un projet spécifique en fonction de l'ID ou du label.
   * @param {Object} _args Les arguments de la requête, contenant la clé (id ou label) et la valeur correspondante.
   * @param {Object} context Le contexte de la requête, contenant le repository des projets.
   * @returns {Promise<Project | null>} Le projet correspondant à la requête, ou null si aucun projet n'est trouvé.
   */
  project: async (
    _args: { key: "id" | "label"; value: string },
    context: { projectRepo: ProjectRepository },
  ): Promise<Project | null> => {
    return await context.projectRepo.get(_args.key, _args.value);
  },

  /**
   * Crée un nouveau projet
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode create du repository des projets pour créer un nouveau projet dans la base de données.
   * Après la création, récupère et retourne le projet créé.
   * @param {Object} _args Les arguments de la mutation, contenant les propriétés du projet à créer (sauf l'ID).
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des projets.
   * @returns {Promise<Project | null>} Le projet nouvellement créé, récupéré de la base de données, ou null si le projet ne peut pas être trouvé après la création.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si le projet ne peut pas être trouvé après la création.
   */
  createProject: async (
    _args: { input: Omit<Project, "id"> },
    context: { user: jwt.JwtPayload | null; projectRepo: ProjectRepository },
  ): Promise<Project | null> => {
    if (!context.user) throw new Error("Unauthorized");
    const id = await context.projectRepo.create(_args.input);
    return await context.projectRepo.get("id", id);
  },

  /**
   * Met à jour un projet existant
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode update du repository des projets pour mettre à jour les propriétés d'un projet existant dans la base de données.
   * Après la mise à jour, récupère et retourne le projet mis à jour.
   * @param {Object} _args Les arguments de la mutation, contenant l'ID du projet à mettre à jour et les propriétés à mettre à jour.
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des projets.
   * @returns {Promise<Project | null>} Le projet mis à jour, récupéré de la base de données, ou null si le projet ne peut pas être trouvé après la mise à jour.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si le projet ne peut pas être trouvé après la mise à jour.
   */
  updateProject: async (
    _args: { id: string; input: Partial<Omit<Project, "id">> },
    context: { user: jwt.JwtPayload | null; projectRepo: ProjectRepository },
  ): Promise<Project | null> => {
    if (!context.user) throw new Error("Unauthorized");
    await context.projectRepo.update(_args.id, _args.input);
    return await context.projectRepo.get("id", _args.id);
  },

  /**
   * Supprime un projet existant
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode delete du repository des projets pour supprimer un projet existant de la base de données.
   * @param {Object} _args Les arguments de la mutation, contenant l'ID du projet à supprimer.
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des projets.
   * @returns {Promise<boolean>} Un booléen indiquant que la suppression a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si le projet ne peut pas être trouvé pour la suppression.
   */
  deleteProject: async (
    _args: { id: string },
    context: { user: jwt.JwtPayload | null; projectRepo: ProjectRepository },
  ): Promise<boolean> => {
    if (!context.user) throw new Error("Unauthorized");
    await context.projectRepo.delete(_args.id);
    return true;
  },
};

export default projectResolver;
