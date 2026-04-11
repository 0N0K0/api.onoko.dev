import CoworkerRepository from "../../repositories/CoworkerRepository";
import { Coworker } from "../../types/coworkerTypes";
import jwt from "jsonwebtoken";
import {
  sanitizeString,
  isEmpty,
  isValidUUID,
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
    _args: any,
    context: { coworkerRepo: CoworkerRepository },
  ): Promise<Coworker[]> => {
    return await context.coworkerRepo.getAll();
  },

  /**
   * Crée un nouveau coworker
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode create du repository des coworkers pour créer un nouveau coworker dans la base de données.
   * Après la création, récupère et retourne le coworker créé.
   * @param {Object} _args Les arguments de la mutation, contenant les propriétés du coworker à créer (sauf l'ID).
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des coworkers.
   * @returns {Promise<Coworker | null>} Le coworker nouvellement créé, récupéré de la base de données, ou null si le coworker ne peut pas être trouvé après la création.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si le coworker ne peut pas être trouvé après la création.
   */
  createCoworker: async (
    _args: Omit<Coworker, "id">,
    context: { user: jwt.JwtPayload | null; coworkerRepo: CoworkerRepository },
  ): Promise<Coworker | null> => {
    if (!context.user) throw new Error("Unauthorized");
    const input = { ..._args };
    if (isEmpty(input.name)) throw new Error("Name is required");
    input.name = sanitizeString(input.name);
    const id = await context.coworkerRepo.create(input);
    return await context.coworkerRepo.get(id);
  },

  /**
   * Met à jour un coworker existant
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode update du repository des coworkers pour mettre à jour les propriétés d'un coworker existant dans la base de données.
   * Après la mise à jour, récupère et retourne le coworker mis à jour.
   * @param {Object} _args Les arguments de la mutation, contenant les propriétés du coworker à mettre à jour (doit inclure l'ID).
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des coworkers.
   * @returns {Promise<Coworker | null>} Le coworker mis à jour, récupéré de la base de données, ou null si le coworker ne peut pas être trouvé après la mise à jour.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si le coworker ne peut pas être trouvé après la mise à jour.
   */
  updateCoworker: async (
    _args: Partial<Coworker>,
    context: { user: jwt.JwtPayload | null; coworkerRepo: CoworkerRepository },
  ): Promise<Coworker | null> => {
    if (!context.user) throw new Error("Unauthorized");
    if (!_args.id) throw new Error("ID is required");
    if (!isValidUUID(_args.id)) throw new Error("Invalid ID");
    const input = { ..._args };
    if (input.name) input.name = sanitizeString(input.name);
    await context.coworkerRepo.update(input);
    return await context.coworkerRepo.get(_args.id);
  },

  /**
   * Supprime un coworker existant
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode delete du repository des coworkers pour supprimer un coworker existant de la base de données.
   * @param {Object} _args Les arguments de la mutation, contenant l'ID du coworker à supprimer.
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des coworkers.
   * @returns {Promise<boolean>} Un booléen indiquant que la suppression a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié.
   */
  deleteCoworker: async (
    _args: { id: string },
    context: { user: jwt.JwtPayload | null; coworkerRepo: CoworkerRepository },
  ): Promise<boolean> => {
    if (!context.user) throw new Error("Unauthorized");
    if (!_args.id) throw new Error("ID is required");
    if (!isValidUUID(_args.id)) throw new Error("Invalid ID");
    await context.coworkerRepo.delete(_args.id);
    return true;
  },
};

export default coworkerResolver;
