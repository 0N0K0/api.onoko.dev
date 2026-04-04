import RoleRepository from "../../repositories/RoleRepository";
import { Role } from "../../types/roleTypes";
import jwt from "jsonwebtoken";

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
    _args: any,
    context: { roleRepo: RoleRepository },
  ): Promise<Role[]> => {
    return await context.roleRepo.getAll();
  },

  /**
   * Récupère un rôle par ID ou label
   * Appelle la méthode get du repository des rôles pour récupérer un rôle spécifique en fonction de l'ID ou du label.
   * @param {Object} _args Les arguments de la requête, contenant la clé (id ou label) et la valeur correspondante.
   * @param {Object} context Le contexte de la requête, contenant le repository des rôles.
   * @returns {Promise<Role | null>} Le rôle correspondant à la requête, ou null si aucun rôle n'est trouvé.
   */
  role: async (
    _args: { key: "id" | "label"; value: string },
    context: { roleRepo: RoleRepository },
  ): Promise<Role | null> => {
    return await context.roleRepo.get(_args.key, _args.value);
  },

  /**
   * Crée un nouveau rôle
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode create du repository des rôles pour créer un nouveau rôle dans la base de données.
   * Après la création, récupère et retourne le rôle créé.
   * @param {Object} _args Les arguments de la mutation, contenant les propriétés du rôle à créer (sauf l'ID).
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des rôles.
   * @returns {Promise<Role | null>} Le rôle nouvellement créé, récupéré de la base de données, ou null si le rôle ne peut pas être trouvé après la création.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si le rôle ne peut pas être trouvé après la création.
   */
  createRole: async (
    _args: Omit<Role, "id">,
    context: { user: jwt.JwtPayload | null; roleRepo: RoleRepository },
  ): Promise<Role | null> => {
    if (!context.user) throw new Error("Unauthorized");
    const id = await context.roleRepo.create(_args);
    return await context.roleRepo.get("id", id);
  },

  /**
   * Met à jour un rôle existant
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode update du repository des rôles pour mettre à jour les propriétés d'un rôle existant dans la base de données.
   * Après la mise à jour, récupère et retourne le rôle mis à jour.
   * @param {Object} _args Les arguments de la mutation, contenant les propriétés du rôle à mettre à jour (doit inclure l'ID).
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des rôles.
   * @returns {Promise<Role | null>} Le rôle mis à jour, récupéré de la base de données, ou null si le rôle ne peut pas être trouvé après la mise à jour.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si le rôle ne peut pas être trouvé après la mise à jour.
   */
  updateRole: async (
    _args: Partial<Role>,
    context: { user: jwt.JwtPayload | null; roleRepo: RoleRepository },
  ): Promise<Role | null> => {
    if (!context.user) throw new Error("Unauthorized");
    if (!_args.id) throw new Error("ID is required for update");
    await context.roleRepo.update(_args);
    return await context.roleRepo.get("id", _args.id);
  },

  /**
   * Supprime un rôle existant
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode delete du repository des rôles pour supprimer un rôle existant de la base de données.
   * @param {Object} _args Les arguments de la mutation, contenant l'ID du rôle à supprimer.
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des rôles.
   * @returns {Promise<boolean>} Un booléen indiquant que la suppression a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si le rôle ne peut pas être trouvé pour la suppression.
   */
  deleteRole: async (
    _args: { id: string },
    context: { user: jwt.JwtPayload | null; roleRepo: RoleRepository },
  ): Promise<boolean> => {
    if (!context.user) throw new Error("Unauthorized");
    await context.roleRepo.delete(_args.id);
    return true;
  },
};

export default roleResolver;
