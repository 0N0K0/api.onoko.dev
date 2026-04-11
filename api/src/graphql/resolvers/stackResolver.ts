import { StackRepository } from "../../repositories/StackRepository";
import { Category } from "../../types/categoryTypes";
import { ImageFile } from "../../types/imageTypes";
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
    _args: any,
    context: { stackRepo: StackRepository },
  ): Promise<Stack[]> => {
    return await context.stackRepo.getAll();
  },

  /**
   * Récupère les stacks d'une catégorie spécifique
   * Appelle la méthode getAllByCategory du repository des stacks pour récupérer les stacks associées à une catégorie spécifique en fonction de l'ID ou du label de la catégorie.
   * @param {Object} _args Les arguments de la requête, contenant la clé (id ou label) et la valeur correspondante de la catégorie.
   * @param {Object} context Le contexte de la requête, contenant le repository des stacks.
   * @returns {Promise<Category | null | undefined>} La catégorie avec les stacks associées correspondant à la requête, ou null/undefined si aucune catégorie n'est trouvée.
   */
  stacksByCategory: async (
    _args: { key: "id" | "label"; value: string },
    context: { stackRepo: StackRepository },
  ): Promise<Category | null | undefined> => {
    return await context.stackRepo.getAllByCategory(_args.key, _args.value);
  },

  /**
   * Récupère une stack par ID ou label
   * Appelle la méthode get du repository des stacks pour récupérer une stack spécifique en fonction de l'ID ou du label.
   * @param {Object} _args Les arguments de la requête, contenant la clé (id ou label) et la valeur correspondante.
   * @param {Object} context Le contexte de la requête, contenant le repository des stacks.
   * @returns {Promise<Stack | null>} La stack correspondant à la requête, ou null si aucune stack n'est trouvée.
   */
  stack: async (
    _args: { key: "id" | "label"; value: string },
    context: { stackRepo: StackRepository },
  ): Promise<Stack | null> => {
    return await context.stackRepo.get(_args.key, _args.value);
  },

  /**
   * Crée une nouvelle stack
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode create du repository des stacks pour créer une nouvelle stack dans la base de données.
   * Après la création, récupère et retourne la stack créée.
   * @param {Object} _args Les arguments de la mutation, contenant les propriétés de la stack à créer (sauf l'ID) et le fichier d'icône.
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des stacks.
   * @returns {Promise<Stack | null>} La stack nouvellement créée, récupérée de la base de données, ou null si la stack ne peut pas être trouvée après la création.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si la stack ne peut pas être trouvée après la création.
   */
  createStack: async (
    _args: Omit<Stack, "id"> & {
      iconFile: ImageFile;
    },
    context: { user: jwt.JwtPayload | null; stackRepo: StackRepository },
  ): Promise<Stack | null> => {
    if (!context.user) throw new Error("Unauthorized");
    const input = { ..._args };
    // Sanitize tous les champs string pertinents
    if (isEmpty(input.label)) throw new Error("Label is required");
    input.label = sanitizeString(input.label);
    if (input.icon && !isValidUUID(input.icon as string))
      throw new Error("Invalid icon ID");
    if (input.description)
      input.description = sanitizeString(input.description);
    if (input.versions) input.versions = input.versions.map(sanitizeString);
    if (input.skills) input.skills = input.skills.map(sanitizeString);
    if (input.category) {
      if (typeof input.category === "string") {
        input.category = sanitizeString(input.category);
      } else if (typeof input.category === "object" && input.category.label) {
        input.category.id = sanitizeString(input.category.id);
      }
    }
    const id = await context.stackRepo.create(input);
    return await context.stackRepo.get("id", id);
  },

  /**
   * Met à jour une stack existante
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode update du repository des stacks pour mettre à jour les propriétés d'une stack existante dans la base de données.
   * Après la mise à jour, récupère et retourne la stack mise à jour.
   * @param {Object} _args Les arguments de la mutation, contenant les propriétés de la stack à mettre à jour (doit inclure l'ID) et le fichier d'icône.
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des stacks.
   * @returns {Promise<Stack | null>} La stack mise à jour, récupérée de la base de données, ou null si la stack ne peut pas être trouvée après la mise à jour.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si la stack ne peut pas être trouvée après la mise à jour.
   */
  updateStack: async (
    _args: Partial<Stack> & {
      iconFile?: ImageFile;
    },
    context: { user: jwt.JwtPayload | null; stackRepo: StackRepository },
  ): Promise<Stack | null> => {
    if (!context.user) throw new Error("Unauthorized");
    if (!_args.id) throw new Error("ID is required for update");
    if (!isValidUUID(_args.id)) throw new Error("Invalid ID");
    const input = { ..._args };
    if (input.id) input.id = sanitizeString(input.id);
    if (input.label) input.label = sanitizeString(input.label);
    if (input.icon && !isValidUUID(input.icon as string))
      throw new Error("Invalid icon ID");
    if (input.description)
      input.description = sanitizeString(input.description);
    if (input.versions) input.versions = input.versions.map(sanitizeString);
    if (input.skills) input.skills = input.skills.map(sanitizeString);
    if (input.category) {
      if (typeof input.category === "string") {
        input.category = sanitizeString(input.category);
      } else if (typeof input.category === "object" && input.category.label) {
        input.category.id = sanitizeString(input.category.id);
      }
    }
    await context.stackRepo.update(input);
    return await context.stackRepo.get("id", _args.id);
  },

  /**
   * Supprime une stack existante
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode delete du repository des stacks pour supprimer une stack existante de la base de données.
   * @param {Object} _args Les arguments de la mutation, contenant l'ID de la stack à supprimer.
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des stacks.
   * @returns {Promise<boolean>} Un booléen indiquant que la suppression a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si la stack ne peut pas être trouvée pour la suppression.
   */
  deleteStack: async (
    _args: { id: string },
    context: { user: jwt.JwtPayload | null; stackRepo: StackRepository },
  ): Promise<boolean> => {
    if (!context.user) throw new Error("Unauthorized");
    if (!_args.id) throw new Error("ID is required");
    if (!isValidUUID(_args.id)) throw new Error("Invalid ID");
    await context.stackRepo.delete(_args.id);
    return true;
  },
};

export default stackResolver;
