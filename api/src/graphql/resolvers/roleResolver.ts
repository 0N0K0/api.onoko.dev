import RoleRepository from "../../repositories/RoleRepository";
import { Role } from "../../types/roleTypes";
import jwt from "jsonwebtoken";
import {
  sanitizeString,
  isEmpty,
  isValidUUID,
} from "../../utils/validationUtils";

// Résolveur GraphQL pour les opérations liées aux rôles
const roleResolver = {
  /**
   * Récupère tous les rôles
   * Appelle la méthode getAll du repository des rôles pour récupérer tous les rôles de la base de données.
   * @param {Object} _args Les arguments de la requête, qui ne sont pas utilisés dans cette opération.
   * @param {Object} context Le contexte de la requête, contenant le repository des rôles.
   * @returns {Promise<Role[]>} Un tableau de rôles récupérés de la base de données.
   */
  roles: async (
    _args: Record<string, never>,
    context: { roleRepo: RoleRepository },
  ): Promise<Role[]> => {
    return await context.roleRepo.getAll();
  },

  /**
   * Crée un nouveau rôle
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode create du repository des rôles pour créer un nouveau rôle dans la base de données.
   * Après la création, récupère et retourne le rôle créé.
   * @param {Object} _args Les arguments de la mutation, contenant les propriétés du rôle à créer (sauf l'ID).
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des rôles.
   * @returns {Promise<boolean>} Indique si la création du rôle a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si le rôle ne peut pas être trouvé après la création.
   */
  createRole: async (
    _args: { input: Omit<Role, "id"> },
    context: { user: jwt.JwtPayload | null; roleRepo: RoleRepository },
  ): Promise<boolean> => {
    if (!context.user) throw new Error("Unauthorized");
    const input = { ..._args.input };
    if (isEmpty(input.label)) throw new Error("Label is required");
    input.label = sanitizeString(input.label);
    const result = await context.roleRepo.create(input);
    if (!result) throw new Error("Failed to create role");
    return result;
  },

  /**
   * Met à jour un rôle existant
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode update du repository des rôles pour mettre à jour les propriétés d'un rôle existant dans la base de données.
   * Après la mise à jour, récupère et retourne le rôle mis à jour.
   * @param {Object} _args Les arguments de la mutation, contenant les propriétés du rôle à mettre à jour (doit inclure l'ID).
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des rôles.
   * @returns {Promise<boolean>} Indique si la mise à jour du rôle a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si le rôle ne peut pas être trouvé après la mise à jour.
   */
  updateRole: async (
    _args: { id: string; input: Partial<Omit<Role, "id">> },
    context: { user: jwt.JwtPayload | null; roleRepo: RoleRepository },
  ): Promise<boolean> => {
    if (!context.user) throw new Error("Unauthorized");
    if (!_args.id) throw new Error("ID is required");
    if (!isValidUUID(_args.id)) throw new Error("Invalid ID");
    const input = { ..._args.input, id: _args.id };
    if (input.label) input.label = sanitizeString(input.label);
    const result = await context.roleRepo.update(input);
    if (!result) throw new Error("Failed to update role");
    return result;
  },

  /**
   * Supprime un rôle existant
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode delete du repository des rôles pour supprimer un rôle existant de la base de données.
   * @param {Object} _args Les arguments de la mutation, contenant l'ID du rôle à supprimer.
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des rôles.
   * @returns {Promise<boolean>} Indique si la suppression du rôle a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si le rôle ne peut pas être trouvé pour la suppression.
   */
  deleteRole: async (
    _args: { id: string },
    context: { user: jwt.JwtPayload | null; roleRepo: RoleRepository },
  ): Promise<boolean> => {
    if (!context.user) throw new Error("Unauthorized");
    if (!_args.id) throw new Error("ID is required");
    if (!isValidUUID(_args.id)) throw new Error("Invalid ID");
    const result = await context.roleRepo.delete(_args.id);
    if (!result) throw new Error("Failed to delete role");
    return result;
  },
};

export default roleResolver;
