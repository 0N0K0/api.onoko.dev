import mariadb from "mariadb";
import crypto from "crypto";
import { Category } from "../types/categoryTypes";
import { withConnection, buildSetClause } from "../database/dbHelpers";

// Repository pour les opérations liées aux catégories dans la base de données
export default class CategoryRepository {
  // Constructeur qui initialise le repository avec un pool de connexions à la base de données MariaDB
  constructor(private pool: mariadb.Pool) {}

  /**
   * Récupère toutes les catégories de la base de données, en utilisant une requête récursive pour construire l'arborescence des catégories.
   * La requête utilise une Common Table Expression (CTE) récursive pour récupérer les catégories et leurs descendants, en calculant la profondeur et le chemin de chaque catégorie.
   * Les résultats sont triés par chemin pour garantir que les catégories parents apparaissent avant leurs enfants.
   * @returns {Promise<Category[]>} Un tableau de catégories récupérées de la base de données, avec leurs propriétés et relations hiérarchiques.
   * @throws {Error} Une erreur si la récupération des catégories échoue pour une raison quelconque.
   */
  async getAll(): Promise<Category[]> {
    return withConnection(this.pool, (conn) =>
      conn.query(`
        WITH RECURSIVE category_tree AS (
          SELECT id, label, entity, description, parent_id AS parent, 0 AS depth, CAST(label AS CHAR(255)) AS path
          FROM category
          WHERE parent_id IS NULL

          UNION ALL

          SELECT c.id, c.label, c.entity, c.description, c.parent_id AS parent, ct.depth + 1, CONCAT(ct.path, ' > ', c.label) AS path
          FROM category c
          JOIN category_tree ct ON c.parent_id = ct.id
        )
        SELECT id, label, entity, description, parent, depth, path FROM category_tree ORDER BY path;
        `),
    );
  }

  /**
   * Crée une nouvelle catégorie dans la base de données en utilisant les propriétés fournies.
   * La méthode génère un ID unique pour la nouvelle catégorie, puis insère les données dans la table "category" de la base de données.
   * Après l'insertion, la méthode retourne un booléen indiquant si la création a réussi.
   * @param {Omit<Category, "id">} category - Les propriétés de la catégorie à créer, à l'exception de l'ID qui est généré automatiquement.
   * @returns {Promise<boolean>} Indique si la catégorie a été créée avec succès.
   * @throws {Error} Une erreur si la création échoue pour une raison quelconque.
   */
  async create(category: Omit<Category, "id">): Promise<boolean> {
    const id = crypto.randomUUID();
    await withConnection(this.pool, (conn) =>
      conn.query(
        `INSERT INTO category (id, label, entity, description, parent_id) VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          category.label,
          category.entity,
          category.description || null,
          category.parent || null,
        ],
      ),
    );
    return true;
  }

  /**
   * Met à jour une catégorie existante dans la base de données en fonction des propriétés fournies.
   * La méthode vérifie que l'ID de la catégorie est fourni, puis construit dynamiquement la requête SQL pour mettre à jour les champs spécifiés.
   * Si le champ "parent" est défini à une valeur vide ou "null", il est traité comme une valeur NULL dans la base de données.
   * Après l'exécution de la requête de mise à jour, la méthode ne retourne rien.
   * @param {Partial<Category>} category - Les propriétés de la catégorie à mettre à jour, qui doivent inclure l'ID de la catégorie à mettre à jour.
   * @returns {Promise<boolean>} Indique si la mise à jour a réussi.
   * @throws {Error} Une erreur si l'ID de la catégorie n'est pas fourni, ou si la mise à jour échoue pour une raison quelconque.
   */
  async update(category: Partial<Category>): Promise<boolean> {
    if (!category.id) throw new Error("ID is required for update");
    // Gestion spéciale pour parent: si null, "", ou "null" on force à NULL
    const set = buildSetClause({
      label: category.label || undefined,
      entity: category.entity || undefined,
      description: category.description,
      parent_id:
        category.parent !== undefined
          ? category.parent === ""
            ? null
            : category.parent
          : undefined,
    });
    if (!set) return false;
    await withConnection(this.pool, (conn) =>
      conn.query(`UPDATE category SET ${set.sql} WHERE id = ?`, [
        ...set.values,
        category.id,
      ]),
    );
    return true;
  }

  /**
   * Supprime une catégorie de la base de données en fonction de son ID.
   * La méthode exécute une requête SQL pour supprimer la catégorie correspondante à l'ID spécifié de la table "category" de la base de données.
   * Après l'exécution de la requête de suppression, la méthode retourne un booléen indiquant si la suppression a réussi.
   * @param {string} id - L'ID de la catégorie à supprimer de la base de données.
   * @returns {Promise<boolean>} Indique si la suppression a réussi.
   * @throws {Error} Une erreur si la suppression échoue pour une raison quelconque.
   */
  async delete(id: string): Promise<boolean> {
    await withConnection(this.pool, (conn) =>
      conn.query("DELETE FROM category WHERE id = ?", [id]),
    );
    return true;
  }
}
