import { MediaRepository } from "../../repositories/MediaRepository";
import { ImageFile, Media } from "../../types/mediaTypes";
import jwt from "jsonwebtoken";
import {
  sanitizeString,
  checkAuth,
  validateId,
} from "../../utils/validationUtils";
import validator from "validator";

const mediaResolver = {
  /**
   * Récupère tous les médias organisés par catégorie
   * Appelle la méthode getAll du repository des médias pour récupérer toutes les catégories avec leurs médias associés.
   * @param {Object} _args Les arguments de la requête, qui ne sont pas utilisés dans cette opération.
   * @param {Object} context Le contexte de la requête, contenant le repository des médias.
   * @returns {Promise<Category[] | null | undefined>} Un tableau de catégories avec leurs médias associés, ou null/undefined si aucune catégorie n'est trouvée.
   */
  medias: async (
    _args: Record<string, never>,
    context: { mediaRepo: MediaRepository },
  ): Promise<Media[] | null | undefined> => {
    return await context.mediaRepo.getAll();
  },

  /**
   * Ajoute un nouveau média
   * Vérifie que le fichier est fourni et valide, puis appelle la méthode add du repository des médias pour ajouter un nouveau média à la base de données.
   * Après l'ajout, récupère et retourne le média ajouté.
   * @param {Object} _args Les arguments de la mutation, contenant le fichier à ajouter.
   * @param {Object} context Le contexte de la requête, contenant le repository des médias.
   * @returns {Promise<boolean>} Indique si l'ajout du média a réussi.
   * @throws {Error} Une erreur si le fichier est manquant ou invalide.
   */
  addMedia: async (
    _args: { input: { file: any } },
    context: { user: jwt.JwtPayload | null; mediaRepo: MediaRepository },
  ): Promise<boolean> => {
    checkAuth(context);
    const upload = _args.input?.file;
    if (!upload) throw new Error("File is required");
    const file: ImageFile = await (upload.promise ?? upload);
    const result = await context.mediaRepo.add({ file });
    if (!result) throw new Error("Failed to add media");
    return result;
  },

  /**
   * Met à jour la catégorie d'un média
   * Vérifie que l'ID du média et la nouvelle catégorie sont fournis et valides, puis appelle la méthode update du repository des médias pour mettre à jour la catégorie du média dans la base de données.
   * Après la mise à jour, récupère et retourne le média mis à jour.
   * @param {Object} _args Les arguments de la mutation, contenant l'ID du média à mettre à jour et la nouvelle catégorie.
   * @param {Object} context Le contexte de la requête, contenant le repository des médias.
   * @returns {Promise<boolean>} Indique si la mise à jour du média a réussi.
   * @throws {Error} Une erreur si l'ID du média ou la nouvelle catégorie est manquante ou invalide.
   */
  updateMedia: async (
    _args: { id: string; input: { label?: string; category?: string } },
    context: { user: jwt.JwtPayload | null; mediaRepo: MediaRepository },
  ): Promise<boolean> => {
    checkAuth(context);
    validateId(_args.id);
    const { id, input } = _args;
    const { label, category } = input;
    let sanitizedLabel: string | undefined;
    if (label) sanitizedLabel = sanitizeString(label);
    if (category && !validator.isUUID(category)) delete input.category;
    const result = await context.mediaRepo.update({
      id,
      label: sanitizedLabel,
      category,
    });
    if (!result) throw new Error("Failed to update media");
    return result;
  },

  /**
   * Supprime un média
   * Vérifie que l'ID du média est fourni et valide, puis appelle la méthode remove du repository des médias pour supprimer le média de la base de données.
   * @param {Object} _args Les arguments de la mutation, contenant l'ID du média à supprimer.
   * @param {Object} context Le contexte de la requête, contenant le repository des médias.
   * @returns {Promise<boolean>} true si la suppression a réussi, ou une erreur si l'ID est manquant ou invalide.
   * @throws {Error} Une erreur si l'ID du média est manquant ou invalide.
   */
  removeMedia: async (
    _args: { id: string },
    context: { user: jwt.JwtPayload | null; mediaRepo: MediaRepository },
  ): Promise<boolean> => {
    checkAuth(context);
    validateId(_args.id);
    const { id } = _args;
    const result = await context.mediaRepo.remove(id);
    if (!result) throw new Error("Failed to remove media");
    return result;
  },
};

export default mediaResolver;
