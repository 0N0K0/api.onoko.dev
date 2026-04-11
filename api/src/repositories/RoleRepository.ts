import mariadb from "mariadb";
import crypto from "crypto";
import { Role } from "../types/roleTypes";

// Repository pour les opérations liées aux rôles dans la base de données
export default class RoleRepository {
  // Constructeur qui initialise le repository avec un pool de connexions à la base de données MariaDB
  constructor(private pool: mariadb.Pool) {}

  /**
   * Récupère tous les rôles de la base de données.
   * La méthode exécute une requête SQL pour sélectionner tous les rôles de la table "role" de la base de données, en récupérant les champs "id" et "label".
   * Les résultats sont retournés sous forme d'un tableau d'objets Role, où chaque objet représente un rôle avec ses propriétés correspondantes.
   * @returns {Promise<Role[]>} Un tableau de rôles récupérés de la base de données, avec leurs propriétés "id" et "label".
   */
  async getAll(): Promise<Role[]> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      return await conn.query(`SELECT id, label FROM role`);
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Récupère un rôle spécifique de la base de données en fonction d'une clé (id ou label) et d'une valeur correspondante.
   * La méthode exécute une requête SQL pour sélectionner le rôle correspondant à la clé et à la valeur spécifiées de la table "role" de la base de données, en récupérant les champs "id" et "label".
   * Si un rôle correspondant est trouvé, il est retourné sous forme d'un objet Role avec ses propriétés correspondantes. Si aucun rôle n'est trouvé, la méthode retourne null.
   * @param {string} key - La clé à utiliser pour la recherche (id ou label).
   * @param {string} value - La valeur correspondante à rechercher pour la clé spécifiée.
   * @returns {Promise<Role | null>} Le rôle correspondant à la requête, avec ses propriétés "id" et "label", ou null si aucun rôle n'est trouvé.
   */
  async get(key: "id" | "label", value: string): Promise<Role | null> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const results = await conn.query(
        `SELECT id, label FROM role WHERE ${key} = ?`,
        [value],
      );
      return results[0] || null;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Crée un nouveau rôle dans la base de données en utilisant les propriétés fournies.
   * La méthode génère un ID unique pour le nouveau rôle, puis insère les données dans la table "role" de la base de données.
   * Après l'insertion, la méthode retourne l'ID du rôle nouvellement créé.
   * @param {Omit<Role, "id">} role - Les propriétés du rôle à créer, à l'exception de l'ID qui est généré automatiquement.
   * @returns {Promise<string>} L'ID du rôle nouvellement créé dans la base de données.
   */
  async create(role: Omit<Role, "id">): Promise<string> {
    const id = crypto.randomUUID();

    let conn;

    try {
      conn = await this.pool.getConnection();
      await conn.query(`INSERT INTO role (id, label) VALUES (?, ?)`, [
        id,
        role.label,
      ]);
      return id;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Met à jour un rôle existant dans la base de données en fonction des propriétés fournies.
   * La méthode vérifie que l'ID du rôle est fourni, puis construit dynamiquement la requête SQL pour mettre à jour les champs spécifiés.
   * Après l'exécution de la requête de mise à jour, la méthode ne retourne rien.
   * @param {Partial<Role>} role - Les propriétés du rôle à mettre à jour, qui doivent inclure l'ID du rôle à mettre à jour.
   * @returns {Promise<void>} Une promesse qui se résout lorsque la mise à jour est terminée, ou rejette une erreur si l'ID n'est pas fourni ou si la mise à jour échoue.
   * @throws {Error} Une erreur si l'ID du rôle n'est pas fourni, ou si la mise à jour échoue pour une raison quelconque.
   */
  async update(role: Partial<Role>): Promise<void> {
    if (!role.id) throw new Error("ID is required for update");
    let conn;
    try {
      conn = await this.pool.getConnection();
      const fields = [];
      const values = [];
      if (role.label) {
        fields.push("label = ?");
        values.push(role.label);
      }
      if (fields.length === 0) return; // No fields to update
      values.push(role.id); // ID for WHERE clause
      await conn.query(
        `UPDATE role SET ${fields.join(", ")} WHERE id = ?`,
        values,
      );
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Supprime un rôle de la base de données en fonction de son ID.
   * La méthode exécute une requête SQL pour supprimer le rôle correspondant à l'ID spécifié de la table "role" de la base de données.
   * Après l'exécution de la requête de suppression, la méthode ne retourne rien.
   * @param {string} id - L'ID du rôle à supprimer de la base de données.
   * @returns {Promise<void>} Une promesse qui se résout lorsque la suppression est terminée, ou rejette une erreur si la suppression échoue pour une raison quelconque.
   * @throws {Error} Une erreur si la suppression échoue pour une raison quelconque.
   */
  async delete(id: string): Promise<void> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`DELETE FROM role WHERE id = ?`, [id]);
    } finally {
      if (conn) conn.release();
    }
  }
}
