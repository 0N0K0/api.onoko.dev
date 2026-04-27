import ProjectRepository from "../../repositories/ProjectRepository";
import { Project } from "../../types/projectTypes";
import jwt from "jsonwebtoken";
import {
  sanitizeString,
  isEmpty,
  checkAuth,
  validateId,
  isValidUrl,
  isValidDate,
  isValidPositiveInteger,
  isValidSlug,
} from "../../utils/validationUtils";
import validator from "validator";
import { sanitizeWysiwyg, slugify } from "../../utils/stringUtils";

/**
 * Sanitise et valide les champs d'un input projet (commun à create et update).
 * Modifie l'objet en place et lève une erreur si un UUID est invalide.
 * @param {Partial<Omit<Project, "id">>} input L'input projet à sanitiser et valider
 * @throws {Error} Si un champ UUID est invalide ou si un champ string est vide après sanitisation
 */
function sanitizeProjectInput(input: Partial<Omit<Project, "id">>): void {
  if (input.slug) {
    input.slug = sanitizeString(input.slug);
    if (!isValidSlug(input.slug)) throw new Error("Invalid slug");
  }
  if (input.thumbnail && !validator.isUUID(input.thumbnail as string))
    delete input.thumbnail;
  if (input.categories) {
    for (const [i, category] of input.categories.entries()) {
      if (!validator.isUUID(category as string)) delete input.categories[i];
    }
  }
  if (input.website) {
    if (input.website.url) {
      if (!isValidUrl(input.website.url))
        throw new Error("Invalid website URL");
    }
    if (input.website.label)
      input.website.label = sanitizeString(input.website.label);
  }
  if (input.mockup) {
    if (input.mockup.url) {
      if (!isValidUrl(input.mockup.url)) throw new Error("Invalid mockup URL");
    }
    if (input.mockup.label)
      input.mockup.label = sanitizeString(input.mockup.label);
    if (input.mockup.images) {
      for (const [i, image] of input.mockup.images.entries()) {
        if (!validator.isUUID(image.id)) delete input.mockup.images[i];
      }
    }
  }
  if (input.client) {
    if (input.client.label)
      input.client.label = sanitizeString(input.client.label);
    if (input.client.logo && !validator.isUUID(input.client.logo as string))
      delete input.client.logo;
  }
  if (input.manager) {
    if (input.manager.name)
      input.manager.name = sanitizeString(input.manager.name);
    if (input.manager.email) {
      input.manager.email = sanitizeString(input.manager.email);
      if (!validator.isEmail(input.manager.email))
        throw new Error("Invalid manager email");
    }
  }
  if (input.startDate) {
    input.startDate = new Date(input.startDate);
    if (!isValidDate(input.startDate?.toISOString() ?? ""))
      throw new Error("Invalid start date");
  }
  if (input.endDate) {
    input.endDate = new Date(input.endDate);
    if (!isValidDate(input.endDate?.toISOString() ?? ""))
      throw new Error("Invalid end date");
    if (input.startDate && input.endDate < input.startDate)
      throw new Error("End date cannot be before start date");
  }
  if (input.intro) {
    if (input.intro.context)
      input.intro.context = sanitizeWysiwyg(input.intro.context);
    if (input.intro.objective)
      input.intro.objective = sanitizeWysiwyg(input.intro.objective);
    if (input.intro.client)
      input.intro.client = sanitizeWysiwyg(input.intro.client);
  }
  if (input.presentation) {
    if (input.presentation.description)
      input.presentation.description = sanitizeWysiwyg(
        input.presentation.description,
      );
    if (input.presentation.issue)
      input.presentation.issue = sanitizeWysiwyg(input.presentation.issue);
    if (input.presentation.audience)
      input.presentation.audience = sanitizeWysiwyg(
        input.presentation.audience,
      );
  }
  if (input.need) {
    if (input.need.features)
      input.need.features = sanitizeWysiwyg(input.need.features);
    if (input.need.functionalConstraints)
      input.need.functionalConstraints = sanitizeWysiwyg(
        input.need.functionalConstraints,
      );
    if (input.need.technicalConstraints)
      input.need.technicalConstraints = sanitizeWysiwyg(
        input.need.technicalConstraints,
      );
  }
  if (input.organization) {
    if (input.organization.workload)
      input.organization.workload = sanitizeWysiwyg(
        input.organization.workload,
      );
    if (input.organization.anticipation)
      input.organization.anticipation = sanitizeWysiwyg(
        input.organization.anticipation,
      );
    if (input.organization.methodology)
      input.organization.methodology = sanitizeWysiwyg(
        input.organization.methodology,
      );
    if (input.organization.evolution)
      input.organization.evolution = sanitizeWysiwyg(
        input.organization.evolution,
      );
    if (input.organization.validation)
      input.organization.validation = sanitizeWysiwyg(
        input.organization.validation,
      );
  }
  if (input.coworkers) {
    for (const [i, coworker] of input.coworkers.entries()) {
      if (!validator.isUUID(coworker.id)) delete input.coworkers[i];
      if (coworker.roles) {
        for (const [j, role] of coworker.roles.entries()) {
          if (!validator.isUUID(role)) delete coworker.roles[j];
        }
      }
    }
  }
  if (input.roles) {
    for (const [i, role] of input.roles.entries()) {
      if (!validator.isUUID(role as string)) delete input.roles[i];
    }
  }
  if (input.stacks) {
    for (const [i, stack] of input.stacks.entries()) {
      if (stack.id && !validator.isUUID(stack.id)) delete input.stacks[i];
      if (stack.section) stack.section = sanitizeString(stack.section);
      if (stack.version) stack.version = sanitizeString(stack.version);
    }
  }
  if (input.kpis) {
    console.log(input.kpis);
    if (input.kpis.issues && !isValidPositiveInteger(input.kpis.issues))
      throw new Error("Invalid issues KPI");
    if (input.kpis.points && !isValidPositiveInteger(input.kpis.points))
      throw new Error("Invalid points KPI");
    if (input.kpis.commits && !isValidPositiveInteger(input.kpis.commits))
      throw new Error("Invalid commits KPI");
    if (
      input.kpis.pullRequests &&
      !isValidPositiveInteger(input.kpis.pullRequests)
    )
      throw new Error("Invalid pull requests KPI");
  }
  if (input.feedback) {
    if (input.feedback.general)
      input.feedback.general = sanitizeWysiwyg(input.feedback.general);
    if (input.feedback.client)
      input.feedback.client = sanitizeWysiwyg(input.feedback.client);
  }
}

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
    _args: Record<string, never>,
    context: { projectRepo: ProjectRepository },
  ): Promise<Project[]> => {
    return await context.projectRepo.getAll();
  },

  /**
   * Crée un nouveau projet
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode create du repository des projets pour créer un nouveau projet dans la base de données.
   * Après la création, récupère et retourne le projet créé.
   * @param {Object} _args Les arguments de la mutation, contenant les propriétés du projet à créer (sauf l'ID).
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des projets.
   * @returns {Promise<boolean>} Indique si la création du projet a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si le projet ne peut pas être trouvé après la création.
   */
  createProject: async (
    _args: { input: Omit<Project, "id"> },
    context: { user: jwt.JwtPayload | null; projectRepo: ProjectRepository },
  ): Promise<boolean> => {
    checkAuth(context);
    const input = { ..._args.input };
    if (isEmpty(input.label)) throw new Error("Label is required");
    input.label = sanitizeString(input.label);
    sanitizeProjectInput(input);
    if (isEmpty(input.slug)) input.slug = slugify(input.label);
    const result = await context.projectRepo.create(input);
    if (!result) throw new Error("Failed to create project");
    return result;
  },

  /**
   * Met à jour un projet existant
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode update du repository des projets pour mettre à jour les propriétés d'un projet existant dans la base de données.
   * Après la mise à jour, récupère et retourne le projet mis à jour.
   * @param {Object} _args Les arguments de la mutation, contenant l'ID du projet à mettre à jour et les propriétés à mettre à jour.
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des projets.
   * @returns {Promise<boolean>} Indique si la mise à jour du projet a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si le projet ne peut pas être trouvé après la mise à jour.
   */
  updateProject: async (
    _args: { id: string; input: Partial<Omit<Project, "id">> },
    context: { user: jwt.JwtPayload | null; projectRepo: ProjectRepository },
  ): Promise<boolean> => {
    checkAuth(context);
    validateId(_args.id);

    const input = { ..._args.input, id: _args.id };
    if (input.label) input.label = sanitizeString(input.label);
    sanitizeProjectInput(input);
    const result = await context.projectRepo.update(_args.id, input);
    if (!result) throw new Error("Failed to update project");
    return result;
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
    checkAuth(context);
    validateId(_args.id);
    const result = await context.projectRepo.delete(_args.id);
    if (!result) throw new Error("Failed to delete project");
    return result;
  },
};

export default projectResolver;
