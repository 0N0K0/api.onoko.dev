import { Testimony } from "../types/testimonyTypes";
import { withConnection } from "../database/dbHelpers";
import { BaseRepository } from "./BaseRepository";

// Repository pour les opérations liées aux témoignages dans la base de données
export default class TestimonyRepository extends BaseRepository {
  protected readonly tableName = "testimony";

  /**
   * Récupère tous les témoignages de la base de données.
   * La méthode exécute une requête SQL pour sélectionner tous les témoignages de la table "testimony" de la base de données, en récupérant tous les champs disponibles.
   * Les résultats sont retournés sous forme d'un tableau d'objets Testimony, où chaque objet représente un témoignage avec ses propriétés correspondantes.
   * @returns {Promise<Testimony[]>} Un tableau de témoignages récupérés de la base de données, avec toutes leurs propriétés.
   * @throws {Error} Une erreur si la récupération des témoignages échoue pour une raison quelconque.
   */
  async getAll(): Promise<Testimony[]> {
    return withConnection(this.pool, (conn) =>
      conn.query(
        `SELECT id, name, company, content, created_at, \`insert\` FROM testimony ORDER BY created_at DESC`,
      ),
    );
  }

  /**
   * Crée un nouveau témoignage dans la base de données en utilisant les propriétés fournies.
   * La méthode génère un ID unique pour le nouveau témoignage, puis insère les données dans la table "testimony" de la base de données.
   * Après l'insertion, la méthode retourne un booléen indiquant si la création a réussi.
   * @param {Omit<Testimony, "id">} testimony Les propriétés du témoignage à créer, à l'exception de l'ID qui est généré automatiquement.
   * @returns {Promise<boolean>} Une promesse qui se résout avec true lorsque la création est terminée, ou rejette une erreur si la création échoue.
   * @throws {Error} Une erreur si la création échoue pour une raison quelconque.
   */
  async create(testimony: Omit<Testimony, "id">): Promise<boolean> {
    const id = this.generateId();
    await withConnection(this.pool, (conn) =>
      conn.query(
        `INSERT INTO testimony (id, name, company, content, created_at, \`insert\`) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          testimony.name,
          testimony.company || null,
          testimony.content,
          testimony.createdAt || new Date().toISOString(),
          testimony.insert || false,
        ],
      ),
    );
    return true;
  }

  /**
   * Met à jour un témoignage existant dans la base de données en fonction des propriétés fournies.
   * La méthode vérifie que l'ID du témoignage est fourni, puis construit dynamiquement la requête SQL pour mettre à jour les champs spécifiés.
   * Après l'exécution de la requête de mise à jour, la méthode retourne un booléen indiquant si la mise à jour a réussi.
   * @param {Partial<Testimony>} testimony Les propriétés du témoignage à mettre à jour, qui doivent inclure l'ID du témoignage à mettre à jour.
   * @returns {Promise<boolean>} Une promesse qui se résout avec true lorsque la mise à jour est terminée, ou rejette une erreur si l'ID n'est pas fourni ou si la mise à jour échoue.
   * @throws {Error} Une erreur si l'ID du témoignage n'est pas fourni, ou si la mise à jour échoue pour une raison quelconque.
   */
  async update(testimony: Partial<Testimony>): Promise<boolean> {
    if (!testimony.id) throw new Error("ID is required for update");
    return this.updateOne(testimony.id, {
      name: testimony.name || undefined,
      company: testimony.company || undefined,
      content: testimony.content || undefined,
      insert: testimony.insert || undefined,
    });
  }
}
