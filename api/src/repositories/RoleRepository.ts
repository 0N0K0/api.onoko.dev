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
   * @throws {Error} Une erreur si la récupération des rôles échoue pour une raison quelconque.
   */
  async getAll(): Promise<Role[]> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      return await conn.query(`SELECT id, label FROM role ORDER BY label ASC`);
    } catch (error) {
      console.error("Error retrieving roles:", error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Crée un nouveau rôle dans la base de données en utilisant les propriétés fournies.
   * La méthode génère un ID unique pour le nouveau rôle, puis insère les données dans la table "role" de la base de données.
   * Après l'insertion, la méthode retourne un booléen indiquant si la création a réussi.
   * @param {Omit<Role, "id">} role - Les propriétés du rôle à créer, à l'exception de l'ID qui est généré automatiquement.
   * @returns {Promise<boolean>} Une promesse qui se résout avec true lorsque la création est terminée, ou rejette une erreur si la création échoue.
   * @throws {Error} Une erreur si la création échoue pour une raison quelconque.
   */
  async create(role: Omit<Role, "id">): Promise<boolean> {
    const id = crypto.randomUUID();

    let conn;

    try {
      conn = await this.pool.getConnection();
      await conn.query(`INSERT INTO role (id, label) VALUES (?, ?)`, [
        id,
        role.label,
      ]);
    } catch (error) {
      console.error("Error creating role:", error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
    return true;
  }

  /**
   * Met à jour un rôle existant dans la base de données en fonction des propriétés fournies.
   * La méthode vérifie que l'ID du rôle est fourni, puis construit dynamiquement la requête SQL pour mettre à jour les champs spécifiés.
   * Après l'exécution de la requête de mise à jour, la méthode retourne un booléen indiquant si la mise à jour a réussi.
   * @param {Partial<Role>} role - Les propriétés du rôle à mettre à jour, qui doivent inclure l'ID du rôle à mettre à jour.
   * @returns {Promise<boolean>} Une promesse qui se résout avec true lorsque la mise à jour est terminée, ou rejette une erreur si l'ID n'est pas fourni ou si la mise à jour échoue.
   * @throws {Error} Une erreur si l'ID du rôle n'est pas fourni, ou si la mise à jour échoue pour une raison quelconque.
   */
  async update(role: Partial<Role>): Promise<boolean> {
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
      if (fields.length === 0) return false; // No fields to update
      values.push(role.id); // ID for WHERE clause
      await conn.query(
        `UPDATE role SET ${fields.join(", ")} WHERE id = ?`,
        values,
      );
    } catch (error) {
      console.error("Error updating role:", error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
    return true;
  }

  /**
   * Supprime un rôle de la base de données en fonction de son ID.
   * La méthode exécute une requête SQL pour supprimer le rôle correspondant à l'ID spécifié de la table "role" de la base de données.
   * Après l'exécution de la requête de suppression, la méthode retourne un booléen indiquant si la suppression a réussi.
   * @param {string} id - L'ID du rôle à supprimer de la base de données.
   * @returns {Promise<boolean>} Une promesse qui se résout avec true lorsque la suppression est terminée, ou rejette une erreur si la suppression échoue pour une raison quelconque.
   * @throws {Error} Une erreur si la suppression échoue pour une raison quelconque.
   */
  async delete(id: string): Promise<boolean> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`DELETE FROM role WHERE id = ?`, [id]);
    } catch (error) {
      console.error("Error deleting role:", error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
    return true;
  }
}
