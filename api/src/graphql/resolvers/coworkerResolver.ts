import CoworkerRepository from "../../repositories/CoworkerRepository";
import { Coworker } from "../../types/coworkerTypes";
import jwt from "jsonwebtoken";
import {
  sanitizeString,
  isEmpty,
  isValidUUID,
  checkAuth,
  validateId,
} from "../../utils/validationUtils";

// Résolveur GraphQL pour les opérations liées aux coworkers
const coworkerResolver = {
  /**
   * Récupère tous les coworkers
   * Appelle la méthode getAll du repository des coworkers pour récupérer tous les coworkers de la base de données.
   * @param {Object} _args Les arguments de la requête, qui ne sont pas utilisés dans cette opération.
   * @param {Object} context Le contexte de la requête, contenant le repository des coworkers.
   * @returns {Promise<Coworker[]>} Un tableau de coworkers récupérés de la base de données.
   */
  coworkers: async (
    _args: Record<string, never>,
    context: { coworkerRepo: CoworkerRepository },
  ): Promise<Coworker[]> => {
    return await context.coworkerRepo.getAll();
  },

  /**
   * Crée un nouveau coworker
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode create du repository des coworkers pour créer un nouveau coworker dans la base de données.
   * Après la création, retourne un booléen indiquant si la création a réussi.
   * @param {Object} _args Les arguments de la mutation, contenant les propriétés du coworker à créer (sauf l'ID).
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des coworkers.
   * @returns {Promise<boolean>} Indique si la création a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si la création échoue.
   */
  createCoworker: async (
    _args: { input: Omit<Coworker, "id"> },
    context: { user: jwt.JwtPayload | null; coworkerRepo: CoworkerRepository },
  ): Promise<boolean> => {
    checkAuth(context);
    const input = { ..._args.input };
    if (isEmpty(input.name)) throw new Error("Name is required");
    input.name = sanitizeString(input.name);
    const result = await context.coworkerRepo.create(input);
    if (!result) throw new Error("Failed to create coworker");
    return result;
  },

  /**
   * Met à jour un coworker existant
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode update du repository des coworkers pour mettre à jour les propriétés d'un coworker existant dans la base de données.
   * Après la mise à jour, retourne un booléen indiquant si la mise à jour a réussi.
   * @param {Object} _args Les arguments de la mutation, contenant les propriétés du coworker à mettre à jour (doit inclure l'ID).
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des coworkers.
   * @returns {Promise<boolean>} Indique si la mise à jour a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si la mise à jour échoue.
   */
  updateCoworker: async (
    _args: { id: string; input: Partial<Omit<Coworker, "id">> },
    context: { user: jwt.JwtPayload | null; coworkerRepo: CoworkerRepository },
  ): Promise<boolean> => {
    checkAuth(context);
    validateId(_args.id);
    const input = { ..._args.input, id: _args.id };
    if (input.name) input.name = sanitizeString(input.name);
    const result = await context.coworkerRepo.update(input);
    if (!result) throw new Error("Failed to update coworker");
    return result;
  },

  /**
   * Supprime un coworker existant
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode delete du repository des coworkers pour supprimer un coworker existant de la base de données.
   * @param {Object} _args Les arguments de la mutation, contenant l'ID du coworker à supprimer.
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des coworkers.
   * @returns {Promise<boolean>} Un booléen indiquant que la suppression a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si la suppression échoue.
   */
  deleteCoworker: async (
    _args: { id: string },
    context: { user: jwt.JwtPayload | null; coworkerRepo: CoworkerRepository },
  ): Promise<boolean> => {
    checkAuth(context);
    validateId(_args.id);
    const result = await context.coworkerRepo.delete(_args.id);
    if (!result) throw new Error("Failed to delete coworker");
    return result;
  },
};

export default coworkerResolver;
