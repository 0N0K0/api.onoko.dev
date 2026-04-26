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
