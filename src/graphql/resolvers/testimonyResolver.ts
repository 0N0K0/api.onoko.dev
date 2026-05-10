import jwt from "jsonwebtoken";
import {
  isEmpty,
  checkAuth,
  validateId,
  isValidDate,
} from "../../utils/validationUtils";
import { sanitizeString, sanitizeWysiwyg } from "../../utils/stringUtils";
import { Testimony } from "../../types/testimonyTypes";
import TestimonyRepository from "../../repositories/TestimonyRepository";

// Résolveur GraphQL pour les opérations liées aux témoignages
const testimonyResolver = {
  /**
   * Récupère tous les témoignages
   * Appelle la méthode getAll du repository des témoignages pour récupérer tous les témoignages de la base de données.
   * @param {Object} _args Les arguments de la requête, qui ne sont pas utilisés dans cette opération.
   * @param {Object} context Le contexte de la requête, contenant le repository des témoignages.
   * @returns {Promise<testimony[]>} Un tableau de témoignages récupérés de la base de données.
   */
  testimonies: async (
    _args: Record<string, never>,
    context: { testimonyRepo: TestimonyRepository },
  ): Promise<Testimony[]> => {
    return await context.testimonyRepo.getAll();
  },

  /**
   * Crée un nouveau témoignage
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode create du repository des témoignages pour créer un nouveau témoignage dans la base de données.
   * Après la création, récupère et retourne le témoignage créé.
   * @param {Object} _args Les arguments de la mutation, contenant les propriétés du témoignage à créer (sauf l'ID).
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des témoignages.
   * @returns {Promise<boolean>} Indique si la création du témoignage a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si le témoignage ne peut pas être trouvé après la création.
   */
  createTestimony: async (
    _args: { input: Omit<Testimony, "id"> },
    context: {
      user: jwt.JwtPayload | null;
      testimonyRepo: TestimonyRepository;
    },
  ): Promise<boolean> => {
    checkAuth(context);
    const input = { ..._args.input };
    if (isEmpty(input.content)) throw new Error("Content is required");
    if (input.name) input.name = sanitizeString(input.name);
    if (input.company) input.company = sanitizeString(input.company);
    input.content = sanitizeWysiwyg(input.content);
    input.createdAt = new Date(input.createdAt || Date.now());
    if (!isValidDate(input.createdAt?.toISOString() ?? ""))
      throw new Error("Invalid start date");
    const result = await context.testimonyRepo.create(input);
    if (!result) throw new Error("Failed to create testimony");
    return result;
  },

  /**
   * Met à jour un témoignage existant
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode update du repository des témoignages pour mettre à jour les propriétés d'un témoignage existant dans la base de données.
   * Après la mise à jour, récupère et retourne le témoignage mis à jour.
   * @param {Object} _args Les arguments de la mutation, contenant les propriétés du témoignage à mettre à jour (doit inclure l'ID).
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des témoignages.
   * @returns {Promise<boolean>} Indique si la mise à jour du témoignage a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si le témoignage ne peut pas être trouvé après la mise à jour.
   */
  updateTestimony: async (
    _args: { id: string; input: Partial<Omit<Testimony, "id">> },
    context: {
      user: jwt.JwtPayload | null;
      testimonyRepo: TestimonyRepository;
    },
  ): Promise<boolean> => {
    checkAuth(context);
    validateId(_args.id);
    const input = { ..._args.input, id: _args.id };
    if (input.name) input.name = sanitizeString(input.name);
    if (input.company) input.company = sanitizeString(input.company);
    if (input.content) input.content = sanitizeWysiwyg(input.content);
    if (input.createdAt) {
      input.createdAt = new Date(input.createdAt);
      if (!isValidDate(input.createdAt.toISOString()))
        throw new Error("Invalid start date");
    }
    const result = await context.testimonyRepo.update(input);
    if (!result) throw new Error("Failed to update testimony");
    return result;
  },

  /**
   * Supprime un témoignage existant
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode delete du repository des témoignages pour supprimer un témoignage existant de la base de données.
   * @param {Object} _args Les arguments de la mutation, contenant l'ID du témoignage à supprimer.
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des témoignages.
   * @returns {Promise<boolean>} Indique si la suppression du témoignage a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si le témoignage ne peut pas être trouvé pour la suppression.
   */
  deleteTestimony: async (
    _args: { id: string },
    context: {
      user: jwt.JwtPayload | null;
      testimonyRepo: TestimonyRepository;
    },
  ): Promise<boolean> => {
    checkAuth(context);
    validateId(_args.id);
    const result = await context.testimonyRepo.delete(_args.id);
    if (!result) throw new Error("Failed to delete testimony");
    return result;
  },
};

export default testimonyResolver;
