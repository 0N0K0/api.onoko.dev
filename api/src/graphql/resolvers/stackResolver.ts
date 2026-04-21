import { StackRepository } from "../../repositories/StackRepository";
import { Stack } from "../../types/stackTypes";
import jwt from "jsonwebtoken";
import {
  sanitizeString,
  isEmpty,
  isValidUUID,
} from "../../utils/validationUtils";

const stackResolver = {
  /**
   * Récupère toutes les stacks
   * Appelle la méthode getAll du repository des stacks pour récupérer toutes les stacks de la base de données.
   * @param {Object} _args Les arguments de la requête, qui ne sont pas utilisés dans cette opération.
   * @param {Object} context Le contexte de la requête, contenant le repository des stacks.
   * @returns {Promise<Stack[]>} Un tableau de stacks récupérées de la base de données.
   */
  stacks: async (
    _args: Record<string, never>,
    context: { stackRepo: StackRepository },
  ): Promise<Stack[]> => {
    return await context.stackRepo.getAll();
  },

  /**
   * Crée une nouvelle stack
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode create du repository des stacks pour créer une nouvelle stack dans la base de données.
   * Après la création, récupère et retourne la stack créée.
   * @param {Object} _args Les arguments de la mutation, contenant les propriétés de la stack à créer (sauf l'ID) et le fichier d'icône.
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des stacks.
   * @returns {Promise<boolean>} Indique si la création de la stack a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si la stack ne peut pas être trouvée après la création.
   */
  createStack: async (
    _args: { input: Omit<Stack, "id"> },
    context: { user: jwt.JwtPayload | null; stackRepo: StackRepository },
  ): Promise<boolean> => {
    if (!context.user) throw new Error("Unauthorized");
    const input = { ..._args.input };
    // Sanitize tous les champs string pertinents
    if (isEmpty(input.label)) throw new Error("Label is required");
    input.label = sanitizeString(input.label);
    if (input.icon && !isValidUUID(input.icon as string))
      throw new Error("Invalid icon ID");
    if (input.description)
      input.description = sanitizeString(input.description);
    if (input.versions) input.versions = input.versions.map(sanitizeString);
    if (input.skills) input.skills = input.skills.map(sanitizeString);
    if (input.category) input.category = sanitizeString(input.category);
    const result = await context.stackRepo.create(input);
    if (!result) throw new Error("Failed to create stack");
    return result;
  },

  /**
   * Met à jour une stack existante
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode update du repository des stacks pour mettre à jour les propriétés d'une stack existante dans la base de données.
   * Après la mise à jour, récupère et retourne la stack mise à jour.
   * @param {Object} _args Les arguments de la mutation, contenant les propriétés de la stack à mettre à jour (doit inclure l'ID).
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des stacks.
   * @returns {Promise<boolean>} Indique si la mise à jour de la stack a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si la stack ne peut pas être trouvée après la mise à jour.
   */
  updateStack: async (
    _args: { id: string; input: Partial<Omit<Stack, "id">> },
    context: { user: jwt.JwtPayload | null; stackRepo: StackRepository },
  ): Promise<boolean> => {
    if (!context.user) throw new Error("Unauthorized");
    if (!_args.id) throw new Error("ID is required for update");
    if (!isValidUUID(_args.id)) throw new Error("Invalid ID");
    const input = { ..._args.input, id: _args.id };
    if (input.id) input.id = sanitizeString(input.id);
    if (input.label) input.label = sanitizeString(input.label);
    if (input.icon && !isValidUUID(input.icon as string))
      throw new Error("Invalid icon ID");
    if (input.description)
      input.description = sanitizeString(input.description);
    if (input.versions) input.versions = input.versions.map(sanitizeString);
    if (input.skills) input.skills = input.skills.map(sanitizeString);
    if (input.category) input.category = sanitizeString(input.category);

    const result = await context.stackRepo.update(input);
    if (!result) throw new Error("Failed to update stack");
    return result;
  },

  /**
   * Supprime une stack existante
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode delete du repository des stacks pour supprimer une stack existante de la base de données.
   * @param {Object} _args Les arguments de la mutation, contenant l'ID de la stack à supprimer.
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des stacks.
   * @returns {Promise<boolean>} Indique si la suppression de la stack a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si la stack ne peut pas être trouvée pour la suppression.
   */
  deleteStack: async (
    _args: { id: string },
    context: { user: jwt.JwtPayload | null; stackRepo: StackRepository },
  ): Promise<boolean> => {
    if (!context.user) throw new Error("Unauthorized");
    if (!_args.id) throw new Error("ID is required");
    if (!isValidUUID(_args.id)) throw new Error("Invalid ID");
    const result = await context.stackRepo.delete(_args.id);
    if (!result) throw new Error("Failed to delete stack");
    return true;
  },
};

export default stackResolver;
