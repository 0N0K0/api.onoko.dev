import validator from "validator";
import sanitizeHtml from "sanitize-html";

/**
 * Convertit une chaîne de caractères en slug (format URL-friendly)
 * @param {string} text La chaîne à convertir
 * @return {string} Le slug généré
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD") // décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, "") // supprime les diacritiques
    .toLowerCase()
    .trim()
    .replace(/[\.\/\\]/g, "-") // remplace points, slashs, backslashs par -
    .replace(/\s+/g, "-") // remplace les espaces par -
    .replace(/[^a-z0-9\-_]/g, "") // supprime tout sauf a-z, 0-9, - et _
    .replace(/\-\-+/g, "-") // remplace les -- par un seul -
    .replace(/^\-+|\-+$/g, ""); // supprime les - en début/fin
}

/**
 * Nettoie une chaîne pour éviter les injections XSS
 * @param {string} str La chaîne à nettoyer
 * @param {{ preserveEntities?: boolean }} [options] Options de nettoyage
 * @return {string} La chaîne nettoyée
 */
export function sanitizeString(
  str: string,
  options?: { preserveEntities?: boolean },
): string {
  const trimmed = str.trim();

  if (!options?.preserveEntities) {
    return validator.escape(trimmed);
  }

  const preservedEntities = ["&shy;", "&#8203;", "&nbsp;"];
  const placeholders = new Map<string, string>();
  let protectedValue = trimmed;

  preservedEntities.forEach((entity, index) => {
    const token = `__ENTITY_${index}__`;
    const re = new RegExp(entity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    protectedValue = protectedValue.replace(re, token);
    placeholders.set(token, entity);
  });

  let escaped = validator.escape(protectedValue);
  placeholders.forEach((entity, token) => {
    escaped = escaped.replaceAll(token, entity);
  });

  return escaped;
}

/**
 * Nettoie une chaîne HTML pour une utilisation dans un éditeur WYSIWYG, en autorisant uniquement les balises et attributs nécessaires et en empêchant les attaques XSS
 * @param {string} html La chaîne HTML à nettoyer
 * @return {string} La chaîne HTML nettoyée
 */
export function sanitizeWysiwyg(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      "*": ["class", "style", "data-*"],
    },
    allowedSchemes: ["data", "http", "https"],
  });
}
