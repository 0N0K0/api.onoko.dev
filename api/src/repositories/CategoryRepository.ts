import mariadb from "mariadb";
import crypto from "crypto";
import { Category } from "../types/categoryTypes";

// Repository pour les opérations liées aux catégories dans la base de données
export default class CategoryRepository {
  // Constructeur qui initialise le repository avec un pool de connexions à la base de données MariaDB
  constructor(private pool: mariadb.Pool) {}

  /**
   * Récupère toutes les catégories de la base de données, en utilisant une requête récursive pour construire l'arborescence des catégories.
   * La requête utilise une Common Table Expression (CTE) récursive pour récupérer les catégories et leurs descendants, en calculant la profondeur et le chemin de chaque catégorie.
   * Les résultats sont triés par chemin pour garantir que les catégories parents apparaissent avant leurs enfants.
   * @returns {Promise<Category[]>} Un tableau de catégories récupérées de la base de données, avec leurs propriétés et relations hiérarchiques.
   */
  async getAll(): Promise<Category[]> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      return await conn.query(`
        WITH RECURSIVE category_tree AS (
          SELECT id, label, entity, description, parent_id AS parent, 0 AS depth, CAST(label AS CHAR(255)) AS path
          FROM category
          WHERE parent_id IS NULL

          UNION ALL

          SELECT c.id, c.label, c.entity, c.description, c.parent_id AS parent, ct.depth + 1, CONCAT(ct.path, ' > ', c.label) AS path
          FROM category c
          JOIN category_tree ct ON c.parent_id = ct.id
        )
        SELECT id, label, entity, description, parent, depth FROM category_tree ORDER BY path;
        `);
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Récupère une catégorie spécifique de la base de données en fonction de son ID.
   * La méthode utilise la liste complète des catégories récupérées par getAll() pour trouver la catégorie correspondante, puis utilise une fonction récursive pour trouver tous les descendants de cette catégorie.
   * Si aucune catégorie correspondante n'est trouvée, la méthode retourne null.
   * @param {string} id - L'ID de la catégorie à rechercher.
   * @returns {Promise<Category[] | null>} Un tableau de catégories correspondant à la requête, ou null si aucune catégorie n'est trouvée.
   */
  async get(id: string): Promise<Category[] | null> {
    const categories = await this.getAll();
    const category = categories.find((c) => c.id === id);
    if (!category) return null;
    const findDescendants = (parentId: string): Category[] => {
      const children = categories.filter((c) => c.parent === parentId);
      return children.flatMap((child) => [child, ...findDescendants(child.id)]);
    };
    const descendants = findDescendants(category.id);
    return [category, ...descendants];
  }

  /**
   * Crée une nouvelle catégorie dans la base de données en utilisant les propriétés fournies.
   * La méthode génère un ID unique pour la nouvelle catégorie, puis insère les données dans la table "category" de la base de données.
   * Après l'insertion, la méthode retourne l'ID de la catégorie nouvellement créée.
   * @param {Omit<Category, "id">} category - Les propriétés de la catégorie à créer, à l'exception de l'ID qui est généré automatiquement.
   * @returns {Promise<string>} L'ID de la catégorie nouvellement créée dans la base de données.
   */
  async create(category: Omit<Category, "id">): Promise<string> {
    const id = crypto.randomUUID();

    let conn;

    try {
      conn = await this.pool.getConnection();
      await conn.query(
        `INSERT INTO category (id, label, entity, description, parent_id) VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          category.label,
          category.entity,
          category.description || null,
          category.parent || null,
        ],
      );
    } finally {
      if (conn) conn.release();
    }
    return id;
  }

  /**
   * Met à jour une catégorie existante dans la base de données en fonction des propriétés fournies.
   * La méthode vérifie que l'ID de la catégorie est fourni, puis construit dynamiquement la requête SQL pour mettre à jour les champs spécifiés.
   * Si le champ "parent" est défini à une valeur vide ou "null", il est traité comme une valeur NULL dans la base de données.
   * Après l'exécution de la requête de mise à jour, la méthode ne retourne rien.
   * @param {Partial<Category>} category - Les propriétés de la catégorie à mettre à jour, qui doivent inclure l'ID de la catégorie à mettre à jour.
   * @returns {Promise<void>} Une promesse qui se résout lorsque la mise à jour est terminée, ou rejette une erreur si l'ID n'est pas fourni ou si la mise à jour échoue.
   * @throws {Error} Une erreur si l'ID de la catégorie n'est pas fourni, ou si la mise à jour échoue pour une raison quelconque.
   */
  async update(category: Partial<Category>): Promise<void> {
    if (!category.id) throw new Error("ID is required for update");
    let conn;
    try {
      conn = await this.pool.getConnection();
      const fields = [];
      const values = [];
      if (category.label) {
        fields.push("label = ?");
        values.push(category.label);
      }
      if (category.entity) {
        fields.push("entity = ?");
        values.push(category.entity);
      }
      if (category.description !== undefined) {
        fields.push("description = ?");
        values.push(category.description);
      }
      // Gestion spéciale pour parent: si null, "", ou "null" on force à NULL
      if (category.parent !== undefined) {
        fields.push("parent_id = ?");
        if (category.parent === "") {
          values.push(null);
        } else {
          values.push(category.parent);
        }
      }
      // On exécute la requête même si la seule modif est parent_id = NULL
      if (fields.length === 0) return;
      values.push(category.id);
      await conn.query(
        `UPDATE category SET ${fields.join(", ")} WHERE id = ?`,
        values,
      );
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Supprime une catégorie de la base de données en fonction de son ID.
   * La méthode exécute une requête SQL pour supprimer la catégorie correspondante à l'ID spécifié de la table "category" de la base de données.
   * Après l'exécution de la requête de suppression, la méthode ne retourne rien.
   * @param {string} id - L'ID de la catégorie à supprimer de la base de données.
   * @returns {Promise<void>} Une promesse qui se résout lorsque la suppression est terminée, ou rejette une erreur si la suppression échoue pour une raison quelconque.
   * @throws {Error} Une erreur si la suppression échoue pour une raison quelconque.
   */
  async delete(id: string): Promise<void> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query("DELETE FROM category WHERE id = ?", [id]);
    } finally {
      if (conn) conn.release();
    }
  }
}
