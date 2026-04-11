import ProjectRepository from "../../repositories/ProjectRepository";
import { Project } from "../../types/projectTypes";
import jwt from "jsonwebtoken";
import {
  sanitizeString,
  isEmpty,
  isValidUUID,
} from "../../utils/validationUtils";

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
    const input = { ..._args.input };
    if (isEmpty(input.label)) throw new Error("Label is required");
    input.label = sanitizeString(input.label);
    if (input.thumbnail && !isValidUUID(input.thumbnail as string))
      throw new Error("Invalid thumbnail ID");
    if (input.categories) {
      for (const category of input.categories) {
        if (!isValidUUID(category as string))
          throw new Error("Invalid category ID");
      }
    }
    if (input.website) {
      if (input.website.url)
        input.website.url = sanitizeString(input.website.url);
      if (input.website.label)
        input.website.label = sanitizeString(input.website.label);
    }
    if (input.mockup) {
      if (input.mockup.url) input.mockup.url = sanitizeString(input.mockup.url);
      if (input.mockup.label)
        input.mockup.label = sanitizeString(input.mockup.label);
      if (input.mockup.images) {
        for (const image of input.mockup.images) {
          if (!isValidUUID(image as string))
            throw new Error("Invalid mockup image ID");
        }
      }
    }
    if (input.client) {
      if (input.client.label)
        input.client.label = sanitizeString(input.client.label);
      if (input.client.logo && !isValidUUID(input.client.logo as string))
        throw new Error("Invalid client logo ID");
    }
    if (input.manager) {
      if (input.manager.name)
        input.manager.name = sanitizeString(input.manager.name);
      if (input.manager.email)
        input.manager.email = sanitizeString(input.manager.email);
    }
    if (input.startDate) input.startDate = new Date(input.startDate);
    if (input.endDate) input.endDate = new Date(input.endDate);
    if (input.intro) {
      if (input.intro.context)
        input.intro.context = sanitizeString(input.intro.context);
      if (input.intro.objective)
        input.intro.objective = sanitizeString(input.intro.objective);
      if (input.intro.client)
        input.intro.client = sanitizeString(input.intro.client);
    }
    if (input.presentation) {
      if (input.presentation.description)
        input.presentation.description = sanitizeString(
          input.presentation.description,
        );
      if (input.presentation.issue)
        input.presentation.issue = sanitizeString(input.presentation.issue);
      if (input.presentation.audience)
        input.presentation.audience = sanitizeString(
          input.presentation.audience,
        );
    }
    if (input.need) {
      if (input.need.features)
        input.need.features = sanitizeString(input.need.features);
      if (input.need.functionalConstraints)
        input.need.functionalConstraints = sanitizeString(
          input.need.functionalConstraints,
        );
      if (input.need.technicalConstraints)
        input.need.technicalConstraints = sanitizeString(
          input.need.technicalConstraints,
        );
    }
    if (input.organization) {
      if (input.organization.workload)
        input.organization.workload = sanitizeString(
          input.organization.workload,
        );
      if (input.organization.anticipation)
        input.organization.anticipation = sanitizeString(
          input.organization.anticipation,
        );
      if (input.organization.methodology)
        input.organization.methodology = sanitizeString(
          input.organization.methodology,
        );
      if (input.organization.evolution)
        input.organization.evolution = sanitizeString(
          input.organization.evolution,
        );
      if (input.organization.validation)
        input.organization.validation = sanitizeString(
          input.organization.validation,
        );
    }
    if (input.coworkers) {
      for (const coworker of input.coworkers) {
        if (!isValidUUID(coworker.id)) throw new Error("Invalid coworker ID");
        if (coworker.roles) {
          for (const role of coworker.roles) {
            if (!isValidUUID(role.id)) throw new Error("Invalid role ID");
          }
        }
      }
    }
    if (input.roles) {
      for (const role of input.roles) {
        if (!isValidUUID(role as string)) throw new Error("Invalid role ID");
      }
    }
    if (input.stacks) {
      for (const stack of input.stacks) {
        if (stack.id && !isValidUUID(stack.id))
          throw new Error("Invalid stack ID");
        if (stack.section) stack.section = sanitizeString(stack.section);
        if (stack.version) stack.version = sanitizeString(stack.version);
      }
    }
    if (input.feedback) {
      if (input.feedback.general)
        input.feedback.general = sanitizeString(input.feedback.general);
      if (input.feedback.client)
        input.feedback.client = sanitizeString(input.feedback.client);
    }
    const id = await context.projectRepo.create(input);
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
    if (!_args.id) throw new Error("ID is required");
    if (!isValidUUID(_args.id)) throw new Error("Invalid ID");

    const input = { ..._args.input };
    if (input.label) input.label = sanitizeString(input.label);
    if (input.thumbnail && !isValidUUID(input.thumbnail as string))
      throw new Error("Invalid thumbnail ID");
    if (input.categories) {
      for (const category of input.categories) {
        if (!isValidUUID(category as string))
          throw new Error("Invalid category ID");
      }
    }
    if (input.website) {
      if (input.website.url)
        input.website.url = sanitizeString(input.website.url);
      if (input.website.label)
        input.website.label = sanitizeString(input.website.label);
    }
    if (input.mockup) {
      if (input.mockup.url) input.mockup.url = sanitizeString(input.mockup.url);
      if (input.mockup.label)
        input.mockup.label = sanitizeString(input.mockup.label);
      if (input.mockup.images) {
        for (const image of input.mockup.images) {
          if (!isValidUUID(image as string))
            throw new Error("Invalid mockup image ID");
        }
      }
    }
    if (input.client) {
      if (input.client.label)
        input.client.label = sanitizeString(input.client.label);
      if (input.client.logo && !isValidUUID(input.client.logo as string))
        throw new Error("Invalid client logo ID");
    }
    if (input.manager) {
      if (input.manager.name)
        input.manager.name = sanitizeString(input.manager.name);
      if (input.manager.email)
        input.manager.email = sanitizeString(input.manager.email);
    }
    if (input.startDate) input.startDate = new Date(input.startDate);
    if (input.endDate) input.endDate = new Date(input.endDate);
    if (input.intro) {
      if (input.intro.context)
        input.intro.context = sanitizeString(input.intro.context);
      if (input.intro.objective)
        input.intro.objective = sanitizeString(input.intro.objective);
      if (input.intro.client)
        input.intro.client = sanitizeString(input.intro.client);
    }
    if (input.presentation) {
      if (input.presentation.description)
        input.presentation.description = sanitizeString(
          input.presentation.description,
        );
      if (input.presentation.issue)
        input.presentation.issue = sanitizeString(input.presentation.issue);
      if (input.presentation.audience)
        input.presentation.audience = sanitizeString(
          input.presentation.audience,
        );
    }
    if (input.need) {
      if (input.need.features)
        input.need.features = sanitizeString(input.need.features);
      if (input.need.functionalConstraints)
        input.need.functionalConstraints = sanitizeString(
          input.need.functionalConstraints,
        );
      if (input.need.technicalConstraints)
        input.need.technicalConstraints = sanitizeString(
          input.need.technicalConstraints,
        );
    }
    if (input.organization) {
      if (input.organization.workload)
        input.organization.workload = sanitizeString(
          input.organization.workload,
        );
      if (input.organization.anticipation)
        input.organization.anticipation = sanitizeString(
          input.organization.anticipation,
        );
      if (input.organization.methodology)
        input.organization.methodology = sanitizeString(
          input.organization.methodology,
        );
      if (input.organization.evolution)
        input.organization.evolution = sanitizeString(
          input.organization.evolution,
        );
      if (input.organization.validation)
        input.organization.validation = sanitizeString(
          input.organization.validation,
        );
    }
    if (input.coworkers) {
      for (const coworker of input.coworkers) {
        if (!isValidUUID(coworker.id)) throw new Error("Invalid coworker ID");
        if (coworker.roles) {
          for (const role of coworker.roles) {
            if (!isValidUUID(role.id)) throw new Error("Invalid role ID");
          }
        }
      }
    }
    if (input.roles) {
      for (const role of input.roles) {
        if (!isValidUUID(role as string)) throw new Error("Invalid role ID");
      }
    }
    if (input.stacks) {
      for (const stack of input.stacks) {
        if (stack.id && !isValidUUID(stack.id))
          throw new Error("Invalid stack ID");
        if (stack.section) stack.section = sanitizeString(stack.section);
        if (stack.version) stack.version = sanitizeString(stack.version);
      }
    }
    if (input.feedback) {
      if (input.feedback.general)
        input.feedback.general = sanitizeString(input.feedback.general);
      if (input.feedback.client)
        input.feedback.client = sanitizeString(input.feedback.client);
    }
    await context.projectRepo.update(_args.id, input);
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
    if (!_args.id) throw new Error("ID is required");
    if (!isValidUUID(_args.id)) throw new Error("Invalid ID");
    await context.projectRepo.delete(_args.id);
    return true;
  },
};

export default projectResolver;
