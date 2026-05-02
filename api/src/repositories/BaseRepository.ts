import crypto from "crypto";
import mariadb from "mariadb";
import { withConnection, buildSetClause } from "../database/dbHelpers";

// Classe de base pour les repositories, fournissant des méthodes communes pour les opérations CRUD
export abstract class BaseRepository {
  protected abstract readonly tableName: string; // Le nom de la table associée à ce repository, à définir dans les classes dérivées

  // Constructeur qui initialise le repository avec un pool de connexions à la base de données MariaDB
  constructor(protected pool: mariadb.Pool) {}

  /**
   * Génère un ID unique pour les nouvelles entrées de la base de données en utilisant la fonction crypto.randomUUID() de Node.js.
   * Cette méthode est utilisée pour créer des identifiants uniques pour les enregistrements dans les tables de la base de données, garantissant ainsi l'unicité des clés primaires.
   * @returns {string} Un ID unique généré sous forme de chaîne de caractères.
   */
  protected generateId(): string {
    return crypto.randomUUID();
  }

  /**
   * Met à jour une entrée existante dans la base de données en fonction de son ID et des colonnes à mettre à jour.
   * La méthode construit dynamiquement la clause SET de la requête SQL en fonction des colonnes fournies, puis exécute la requête de mise à jour.
   * Si aucune colonne n'est fournie, la méthode retourne false pour indiquer que la mise à jour n'a pas été effectuée.
   * @param {string} id - L'ID de l'entrée à mettre à jour.
   * @param {Record<string, unknown>} columns - Un objet contenant les colonnes à mettre à jour et leurs nouvelles valeurs.
   * @returns {Promise<boolean>} Indique si la mise à jour a été effectuée avec succès (true) ou si aucune colonne n'a été fournie (false).
   * @throws {Error} Une erreur si la mise à jour échoue pour une raison quelconque.
   */
  protected async updateOne(
    id: string,
    columns: Record<string, unknown>,
  ): Promise<boolean> {
    const set = buildSetClause(columns);
    if (!set) return false;
    await withConnection(this.pool, (conn) =>
      conn.query(`UPDATE ${this.tableName} SET ${set.sql} WHERE id = ?`, [
        ...set.values,
        id,
      ]),
    );
    return true;
  }

  /**
   * Supprime une entrée de la base de données en fonction de son ID.
   * La méthode exécute une requête SQL pour supprimer l'entrée correspondante à l'ID spécifié de la table associée à ce repository.
   * Après l'exécution de la requête de suppression, la méthode retourne un booléen indiquant que la suppression a été effectuée avec succès.
   * @param {string} id - L'ID de l'entrée à supprimer.
   * @returns {Promise<boolean>} Indique si la suppression a été effectuée avec succès (true).
   * @throws {Error} Une erreur si la suppression échoue pour une raison quelconque.
   */
  async delete(id: string): Promise<boolean> {
    await withConnection(this.pool, (conn) =>
      conn.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]),
    );
    return true;
  }
}
