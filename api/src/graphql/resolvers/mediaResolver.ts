import { MediaRepository } from "../../repositories/MediaRepository";
import { Category } from "../../types/categoryTypes";
import { Media } from "../../types/mediaTypes";
import { isValidUUID, sanitizeString } from "../../utils/validationUtils";

const mediaResolver = {
  /**
   * Récupère tous les médias organisés par catégorie
   * Appelle la méthode getAll du repository des médias pour récupérer toutes les catégories avec leurs médias associés.
   * @param {Object} _args Les arguments de la requête, qui ne sont pas utilisés dans cette opération.
   * @param {Object} context Le contexte de la requête, contenant le repository des médias.
   * @returns {Promise<Category[] | null | undefined>} Un tableau de catégories avec leurs médias associés, ou null/undefined si aucune catégorie n'est trouvée.
   */
  medias: async (
    _args: any,
    context: { mediaRepo: MediaRepository },
  ): Promise<Media[] | null | undefined> => {
    return await context.mediaRepo.getAll();
  },

  /**
   * Récupère un média par ID
   * Appelle la méthode get du repository des médias pour récupérer un média spécifique en fonction de son ID.
   * @param {Object} _args Les arguments de la requête, contenant l'ID du média à récupérer.
   * @param {Object} context Le contexte de la requête, contenant le repository des médias.
   * @returns {Promise<Media | null>} Le média correspondant à la requête, ou null si aucun média n'est trouvé.
   */
  media: async (
    _args: { id: string },
    context: { mediaRepo: MediaRepository },
  ): Promise<Media | null> => {
    return await context.mediaRepo.get(_args.id);
  },

  /**
   * Ajoute un nouveau média
   * Vérifie que le fichier est fourni et valide, puis appelle la méthode add du repository des médias pour ajouter un nouveau média à la base de données.
   * Après l'ajout, récupère et retourne le média ajouté.
   * @param {Object} _args Les arguments de la mutation, contenant le fichier à ajouter.
   * @param {Object} context Le contexte de la requête, contenant le repository des médias.
   * @returns {Promise<Media | null>} Le média ajouté, ou null si le média ne peut pas être trouvé après l'ajout.
   * @throws {Error} Une erreur si le fichier est manquant ou invalide.
   */
  addMedia: async (
    _args: { file: any; category: string },
    context: { mediaRepo: MediaRepository },
  ): Promise<Media | null> => {
    const { file } = _args;
    if (!file) throw new Error("File is required");
    const id = await context.mediaRepo.add({ file });
    return await context.mediaRepo.get(id);
  },

  /**
   * Met à jour la catégorie d'un média
   * Vérifie que l'ID du média et la nouvelle catégorie sont fournis et valides, puis appelle la méthode update du repository des médias pour mettre à jour la catégorie du média dans la base de données.
   * Après la mise à jour, récupère et retourne le média mis à jour.
   * @param {Object} _args Les arguments de la mutation, contenant l'ID du média à mettre à jour et la nouvelle catégorie.
   * @param {Object} context Le contexte de la requête, contenant le repository des médias.
   * @returns {Promise<Media | null>} Le média mis à jour, ou null si le média ne peut pas être trouvé après la mise à jour.
   * @throws {Error} Une erreur si l'ID du média ou la nouvelle catégorie est manquante ou invalide.
   */
  updateMedia: async (
    _args: { id: string; label?: string; category?: string },
    context: { mediaRepo: MediaRepository },
  ): Promise<Media | null> => {
    const { id, label, category } = _args;
    if (!id) throw new Error("ID is required");
    if (!isValidUUID(id)) throw new Error("Invalid ID");
    let sanitizedLabel: string | undefined;
    if (label) sanitizedLabel = sanitizeString(label);
    if (category && !isValidUUID(category))
      throw new Error("Invalid category ID");
    await context.mediaRepo.update({ id, label: sanitizedLabel, category });
    return await context.mediaRepo.get(id);
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
    context: { mediaRepo: MediaRepository },
  ): Promise<boolean> => {
    const { id } = _args;
    if (!id) throw new Error("ID is required");
    if (!isValidUUID(id)) throw new Error("Invalid ID");
    await context.mediaRepo.remove(id);
    return true;
  },
};

export default mediaResolver;
