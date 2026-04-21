import mariadb from "mariadb";
import crypto from "crypto";
import { Coworker } from "../types/coworkerTypes";
import {
  withConnection,
  withTransaction,
  buildSetClause,
} from "../database/dbHelpers";

// Repository pour les opérations liées aux collaborateurs dans la base de données
export default class CoworkerRepository {
  // Constructeur qui initialise le repository avec un pool de connexions à la base de données MariaDB
  constructor(private pool: mariadb.Pool) {}

  /**
   * Récupère tous les collaborateurs de la base de données, en incluant leurs rôles associés.
   * La méthode utilise une requête SQL pour joindre les tables "coworker", "coworker_role" et "role" afin d'obtenir les informations complètes sur chaque collaborateur et leurs rôles.
   * Les résultats sont ensuite transformés en un format structuré où chaque collaborateur est représenté avec ses propriétés et une liste de ses rôles.
   * @returns {Promise<Coworker[]>} Un tableau de collaborateurs récupérés de la base de données, avec leurs propriétés et leurs rôles associés.
   * @throws {Error} Une erreur si la récupération des collaborateurs échoue pour une raison quelconque.
   */
  async getAll(): Promise<Coworker[]> {
    return withConnection(this.pool, async (conn) => {
      const coworkers = await conn.query(`
        SELECT c.*, cr.role_id AS role_id
        FROM coworker c
        LEFT JOIN coworker_role cr ON c.id = cr.coworker_id
        ORDER BY c.name
      `);
      const coworkerMap: Record<string, Coworker> = {};
      coworkers.forEach(
        (row: { id: string; name: string; role_id: string }) => {
          if (!coworkerMap[row.id]) {
            coworkerMap[row.id] = {
              id: row.id,
              name: row.name,
              roles: [],
            };
          }
          if (row.role_id) {
            coworkerMap[row.id].roles!.push(row.role_id);
          }
        },
      );
      return Object.values(coworkerMap);
    });
  }

  /**
   * Crée un nouveau collaborateur dans la base de données en utilisant les propriétés fournies.
   * La méthode génère un ID unique pour le nouveau collaborateur, puis insère les données dans la table "coworker" de la base de données.
   * Si des rôles sont associés au collaborateur, la méthode insère également les relations correspondantes dans la table "coworker_role".
   * Après l'insertion, la méthode retourne l'ID du collaborateur nouvellement créé.
   * @param {Omit<Coworker, "id">} coworker - Les propriétés du collaborateur à créer, à l'exception de l'ID qui est généré automatiquement.
   * @returns {Promise<boolean>} Indique si la création a réussi.
   * @throws {Error} Une erreur si la création échoue pour une raison quelconque.
   */
  async create(coworker: Omit<Coworker, "id">): Promise<boolean> {
    const id = crypto.randomUUID();
    await withTransaction(this.pool, async (conn) => {
      await conn.query(`INSERT INTO coworker (id, name) VALUES (?, ?)`, [
        id,
        coworker.name,
      ]);
      if (coworker.roles && coworker.roles.length > 0) {
        await conn.batch(
          `INSERT INTO coworker_role (coworker_id, role_id) VALUES (?, ?)`,
          coworker.roles.map((role) => [id, role]),
        );
      }
    });
    return true;
  }

  /**
   * Met à jour un collaborateur existant dans la base de données en fonction des propriétés fournies.
   * La méthode vérifie que l'ID du collaborateur est fourni, puis construit dynamiquement la requête SQL pour mettre à jour les champs spécifiés.
   * Si des rôles sont fournis, la méthode met à jour les relations correspondantes dans la table "coworker_role" en supprimant les anciennes relations et en insérant les nouvelles.
   * Après l'exécution de la requête de mise à jour, la méthode retourne un booléen indiquant si la mise à jour a réussi.
   * @param {Partial<Coworker>} coworker - Les propriétés du collaborateur à mettre à jour, qui doivent inclure l'ID du collaborateur à mettre à jour.
   * @returns {Promise<boolean>} Indique si la mise à jour a réussi.
   * @throws {Error} Une erreur si l'ID du collaborateur n'est pas fourni, ou si la mise à jour échoue pour une raison quelconque.
   */
  async update(coworker: Partial<Coworker>): Promise<boolean> {
    if (!coworker.id) throw new Error("ID is required for update");
    await withConnection(this.pool, async (conn) => {
      const set = buildSetClause({ name: coworker.name || undefined });
      if (set) {
        await conn.query(`UPDATE coworker SET ${set.sql} WHERE id = ?`, [
          ...set.values,
          coworker.id,
        ]);
      }
      if (coworker.roles) {
        await conn.query(`DELETE FROM coworker_role WHERE coworker_id = ?`, [
          coworker.id,
        ]);
        if (coworker.roles.length > 0) {
          await conn.batch(
            `INSERT INTO coworker_role (coworker_id, role_id) VALUES (?, ?)`,
            coworker.roles.map((role) => [coworker.id, role]),
          );
        }
      }
    });
    return true;
  }

  /**
   * Supprime un collaborateur de la base de données en fonction de son ID.
   * La méthode exécute une requête SQL pour supprimer le collaborateur correspondant à l'ID spécifié de la table "coworker" de la base de données.
   * Après l'exécution de la requête de suppression, la méthode retourne un booléen indiquant si la suppression a réussi.
   * @param {string} id - L'ID du collaborateur à supprimer de la base de données.
   * @returns {Promise<boolean>} Indique si la suppression a réussi.
   * @throws {Error} Une erreur si la suppression échoue pour une raison quelconque.
   */
  async delete(id: string): Promise<boolean> {
    await withConnection(this.pool, (conn) =>
      conn.query(`DELETE FROM coworker WHERE id = ?`, [id]),
    );
    return true;
  }
}
