import mariadb from "mariadb";
import crypto from "crypto";
import { Coworker } from "../types/coworkerTypes";

// Repository pour les opérations liées aux collaborateurs dans la base de données
export default class CoworkerRepository {
  // Constructeur qui initialise le repository avec un pool de connexions à la base de données MariaDB
  constructor(private pool: mariadb.Pool) {}

  /**
   * Récupère tous les collaborateurs de la base de données, en incluant leurs rôles associés.
   * La méthode utilise une requête SQL pour joindre les tables "coworker", "coworker_role" et "role" afin d'obtenir les informations complètes sur chaque collaborateur et leurs rôles.
   * Les résultats sont ensuite transformés en un format structuré où chaque collaborateur est représenté avec ses propriétés et une liste de ses rôles.
   * @returns {Promise<Coworker[]>} Un tableau de collaborateurs récupérés de la base de données, avec leurs propriétés et leurs rôles associés.
   */
  async getAll(): Promise<Coworker[]> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const coworkers = await conn.query(`
        SELECT c.*, r.id AS role_id, r.label AS role_label
        FROM coworker c
        LEFT JOIN coworker_role cr ON c.id = cr.coworker_id
        LEFT JOIN role r ON cr.role_id = r.id
        ORDER BY c.name
      `);
      const coworkerMap: Record<string, Coworker> = {};
      coworkers.forEach(
        (row: {
          id: string;
          name: string;
          role_id: string;
          role_label: string;
        }) => {
          if (!coworkerMap[row.id]) {
            coworkerMap[row.id] = {
              id: row.id,
              name: row.name,
              roles: [],
            };
          }
          if (row.role_id) {
            coworkerMap[row.id].roles!.push({
              id: row.role_id,
              label: row.role_label,
            });
          }
        },
      );
      return Object.values(coworkerMap);
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Récupère un collaborateur spécifique de la base de données en fonction d'une clé (id ou name) et d'une valeur correspondante.
   * La méthode utilise une requête SQL pour joindre les tables "coworker", "coworker_role" et "role" afin d'obtenir les informations complètes sur le collaborateur correspondant à la clé et à la valeur spécifiées, ainsi que ses rôles associés.
   * Les résultats sont ensuite transformés en un format structuré où le collaborateur est représenté avec ses propriétés et une liste de ses rôles.
   * Si aucun collaborateur correspondant n'est trouvé, la méthode retourne null.
   * @param {string} key - La clé à utiliser pour la recherche (id ou name).
   * @param {string} value - La valeur correspondante à rechercher pour la clé spécifiée.
   * @returns {Promise<Coworker | null>} Le collaborateur correspondant à la requête, avec ses propriétés et ses rôles associés, ou null si aucun collaborateur n'est trouvé.
   */
  async get(key: "id" | "name", value: string): Promise<Coworker | null> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const coworkers = await conn.query(
        `
        SELECT c.*, r.id AS role_id, r.label AS role_label
        FROM coworker c
        LEFT JOIN coworker_role cr ON c.id = cr.coworker_id
        LEFT JOIN role r ON cr.role_id = r.id
        WHERE c.${key} = ?
       `,
        [value],
      );
      if (!coworkers || coworkers.length === 0) return null;
      const coworkerMap: Record<string, Coworker> = {};
      coworkers.forEach(
        (row: {
          id: string;
          name: string;
          role_id: string;
          role_label: string;
        }) => {
          if (!coworkerMap[row.id]) {
            coworkerMap[row.id] = {
              id: row.id,
              name: row.name,
              roles: [],
            };
          }
          if (row.role_id) {
            coworkerMap[row.id].roles!.push({
              id: row.role_id,
              label: row.role_label,
            });
          }
        },
      );
      return Object.values(coworkerMap)[0] || null;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Crée un nouveau collaborateur dans la base de données en utilisant les propriétés fournies.
   * La méthode génère un ID unique pour le nouveau collaborateur, puis insère les données dans la table "coworker" de la base de données.
   * Si des rôles sont associés au collaborateur, la méthode insère également les relations correspondantes dans la table "coworker_role".
   * Après l'insertion, la méthode retourne l'ID du collaborateur nouvellement créé.
   * @param {Omit<Coworker, "id">} coworker - Les propriétés du collaborateur à créer, à l'exception de l'ID qui est généré automatiquement.
   * @returns {Promise<string>} L'ID du collaborateur nouvellement créé dans la base de données.
   */
  async create(coworker: Omit<Coworker, "id">): Promise<string> {
    const id = crypto.randomBytes(16).toString("hex");
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`INSERT INTO coworker (id, name) VALUES (?, ?)`, [
        id,
        coworker.name,
      ]);
      if (coworker.roles && coworker.roles.length > 0) {
        for (const role of coworker.roles) {
          await conn.query(
            `INSERT INTO coworker_role (coworker_id, role_id) VALUES (?, ?)`,
            [id, role],
          );
        }
      }
      return id;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Met à jour un collaborateur existant dans la base de données en fonction des propriétés fournies.
   * La méthode vérifie que l'ID du collaborateur est fourni, puis construit dynamiquement la requête SQL pour mettre à jour les champs spécifiés.
   * Si des rôles sont fournis, la méthode met à jour les relations correspondantes dans la table "coworker_role" en supprimant les anciennes relations et en insérant les nouvelles.
   * Après l'exécution de la requête de mise à jour, la méthode ne retourne rien.
   * @param {Partial<Coworker>} coworker - Les propriétés du collaborateur à mettre à jour, qui doivent inclure l'ID du collaborateur à mettre à jour.
   * @returns {Promise<void>} Une promesse qui se résout lorsque la mise à jour est terminée, ou rejette une erreur si l'ID n'est pas fourni ou si la mise à jour échoue.
   * @throws {Error} Une erreur si l'ID du collaborateur n'est pas fourni, ou si la mise à jour échoue pour une raison quelconque.
   */
  async update(coworker: Partial<Coworker>): Promise<void> {
    if (!coworker.id) throw new Error("ID is required for update");
    let conn;
    try {
      conn = await this.pool.getConnection();
      const fields = [];
      const values = [];
      if (coworker.name) {
        fields.push("name = ?");
        values.push(coworker.name);
      }
      if (fields.length > 0) {
        values.push(coworker.id);
        await conn.query(
          `UPDATE coworker SET ${fields.join(", ")} WHERE id = ?`,
          values,
        );
      }
      if (coworker.roles) {
        await conn.query(`DELETE FROM coworker_role WHERE coworker_id = ?`, [
          coworker.id,
        ]);
        if (coworker.roles.length > 0) {
          for (const role of coworker.roles) {
            await conn.query(
              `INSERT INTO coworker_role (coworker_id, role_id) VALUES (?, ?)`,
              [coworker.id, role],
            );
          }
        }
      }
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Supprime un collaborateur de la base de données en fonction de son ID.
   * La méthode exécute une requête SQL pour supprimer le collaborateur correspondant à l'ID spécifié de la table "coworker" de la base de données.
   * Après l'exécution de la requête de suppression, la méthode ne retourne rien.
   * @param {string} id - L'ID du collaborateur à supprimer de la base de données.
   * @returns {Promise<void>} Une promesse qui se résout lorsque la suppression est terminée, ou rejette une erreur si la suppression échoue pour une raison quelconque.
   * @throws {Error} Une erreur si la suppression échoue pour une raison quelconque.
   */
  async delete(id: string): Promise<void> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`DELETE FROM coworker WHERE id = ?`, [id]);
    } finally {
      if (conn) conn.release();
    }
  }
}
