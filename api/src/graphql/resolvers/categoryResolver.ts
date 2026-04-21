import CategoryRepository from "../../repositories/CategoryRepository";
import { Category } from "../../types/categoryTypes";
import jwt from "jsonwebtoken";
import {
  sanitizeString,
  isEmpty,
  isValidUUID,
  checkAuth,
  validateId,
} from "../../utils/validationUtils";

// Résolveur GraphQL pour les opérations liées aux catégories
const categoryResolver = {
  /**
   * Récupère toutes les catégories
   * Appelle la méthode getAll du repository des catégories pour récupérer toutes les catégories de la base de données.
   * @param {Object} _args Les arguments de la requête, qui ne sont pas utilisés dans cette opération.
   * @param {Object} context Le contexte de la requête, contenant le repository des catégories.
   * @returns {Promise<Category[]>} Un tableau de catégories récupérées de la base de données.
   */
  categories: async (
    _args: Record<string, never>,
    context: { categoryRepo: CategoryRepository },
  ): Promise<Category[]> => {
    return await context.categoryRepo.getAll();
  },

  /**
   * Crée une nouvelle catégorie
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode create du repository des catégories pour créer une nouvelle catégorie dans la base de données.
   * Après la création, récupère et retourne la catégorie créée.
   * @param {Object} _args Les arguments de la mutation, contenant les propriétés de la catégorie à créer (sauf l'ID).
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des catégories.
   * @returns {Promise<Category>} La catégorie nouvellement créée, récupérée de la base de données.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si la catégorie ne peut pas être trouvée après la création.
   */
  createCategory: async (
    _args: { input: Omit<Category, "id"> },
    context: { user: jwt.JwtPayload | null; categoryRepo: CategoryRepository },
  ): Promise<boolean> => {
    checkAuth(context);
    const input = { ..._args.input };
    if (isEmpty(input.label)) throw new Error("Label is required");
    input.label = sanitizeString(input.label);

    if (!input.entity || isEmpty(input.entity))
      throw new Error("Entity is required");
    input.entity = sanitizeString(input.entity);

    if (input.description)
      input.description = sanitizeString(input.description);

    if (input.parent && !isValidUUID(input.parent)) delete input.parent;

    const result = await context.categoryRepo.create(input);
    if (!result) throw new Error("Failed to create category");
    return result;
  },

  /**
   * Met à jour une catégorie existante
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode update du repository des catégories pour mettre à jour les propriétés d'une catégorie existante dans la base de données.
   * Après la mise à jour, récupère et retourne la catégorie mise à jour.
   * @param {Object} _args Les arguments de la mutation, contenant les propriétés de la catégorie à mettre à jour (doit inclure l'ID).
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des catégories.
   * @returns {Promise<boolean>} Indique si la mise à jour a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié, si l'ID n'est pas fourni ou si la catégorie ne peut pas être trouvée après la mise à jour.
   */
  updateCategory: async (
    _args: { id: string; input: Partial<Omit<Category, "id">> },
    context: { user: jwt.JwtPayload | null; categoryRepo: CategoryRepository },
  ): Promise<boolean> => {
    checkAuth(context);
    validateId(_args.id);
    const input = { ..._args.input, id: _args.id };
    if (input.label) input.label = sanitizeString(input.label);
    if (input.entity) input.entity = sanitizeString(input.entity);
    if (input.description)
      input.description = sanitizeString(input.description);
    if (input.parent && !isValidUUID(input.parent)) delete input.parent;
    const result = await context.categoryRepo.update(input);
    if (!result) throw new Error("Failed to update category");
    return result;
  },

  /**
   * Supprime une catégorie
   * Vérifie que l'utilisateur est authentifié, puis appelle la méthode delete du repository des catégories pour supprimer une catégorie de la base de données en fonction de son ID.
   * @param {Object} _args Les arguments de la mutation, contenant l'ID de la catégorie à supprimer.
   * @param {Object} context Le contexte de la requête, contenant les informations de l'utilisateur et le repository des catégories.
   * @returns {Promise<boolean>} Un booléen indiquant que la suppression a réussi.
   * @throws {Error} Une erreur si l'utilisateur n'est pas authentifié ou si l'ID n'est pas fourni.
   */
  deleteCategory: async (
    _args: { id: string },
    context: { user: jwt.JwtPayload | null; categoryRepo: CategoryRepository },
  ): Promise<boolean> => {
    checkAuth(context);
    validateId(_args.id);
    const result = await context.categoryRepo.delete(_args.id);
    if (!result) throw new Error("Failed to delete category");
    return result;
  },
};

export default categoryResolver;
