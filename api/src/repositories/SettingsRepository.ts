import mariadb from "mariadb";
import { withConnection } from "../database/dbHelpers";

// Repository pour les opérations liées aux paramètres de configuration dans la base de données
export class SettingsRepository {
  // Constructeur qui initialise le repository avec un pool de connexions à la base de données MariaDB
  constructor(private pool: mariadb.Pool) {}

  /**
   * Récupère la valeur d'un paramètre de configuration spécifique de la base de données en fonction de sa clé.
   * La méthode exécute une requête SQL pour sélectionner la valeur du paramètre correspondant à la clé spécifiée de la table "settings" de la base de données.
   * Si un paramètre correspondant est trouvé, sa valeur est retournée sous forme de chaîne de caractères. Si aucun paramètre n'est trouvé, la méthode retourne null.
   * @param {string} key - La clé du paramètre de configuration à récupérer.
   * @returns {Promise<string | null>} La valeur du paramètre de configuration correspondant à la clé spécifiée, ou null si aucun paramètre n'est trouvé.
   */
  async get(key: string): Promise<string | null> {
    return withConnection(this.pool, async (conn) => {
      const rows = await conn.query(
        "SELECT value FROM settings WHERE `key` = ?",
        [key],
      );
      return rows.length > 0 ? rows[0].value : null;
    });
  }

  /**
   * Définit ou met à jour la valeur d'un paramètre de configuration dans la base de données en fonction de sa clé.
   * La méthode exécute une requête SQL pour insérer ou mettre à jour la valeur du paramètre correspondant à la clé spécifiée dans la table "settings" de la base de données.
   * Si un paramètre avec la clé spécifiée existe déjà, sa valeur est mise à jour. Sinon, un nouveau paramètre est créé avec la clé et la valeur fournies.
   * Après l'exécution de la requête d'insertion ou de mise à jour, la méthode ne retourne rien.
   * @param {string} key - La clé du paramètre de configuration à définir ou mettre à jour.
   * @param {string} value - La valeur du paramètre de configuration à définir ou mettre à jour.
   * @returns {Promise<void>} Une promesse qui se résout lorsque l'opération est terminée, ou rejette une erreur si l'opération échoue pour une raison quelconque.
   * @throws {Error} Une erreur si l'opération échoue pour une raison quelconque.
   */
  getPool(): mariadb.Pool {
    return this.pool;
  }

  /**
   * Définit ou met à jour la valeur d'un paramètre de configuration dans la base de données en fonction de sa clé.
   * La méthode exécute une requête SQL pour insérer ou mettre à jour la valeur du paramètre correspondant à la clé spécifiée dans la table "settings" de la base de données.
   * Si un paramètre avec la clé spécifiée existe déjà, sa valeur est mise à jour. Sinon, un nouveau paramètre est créé avec la clé et la valeur fournies.
   * Après l'exécution de la requête d'insertion ou de mise à jour, la méthode ne retourne rien.
   * @param {string} key - La clé du paramètre de configuration à définir ou mettre à jour.
   * @param {string} value - La valeur du paramètre de configuration à définir ou mettre à jour.
   * @returns {Promise<void>} Une promesse qui se résout lorsque l'opération est terminée, ou rejette une erreur si l'opération échoue pour une raison quelconque.
   * @throws {Error} Une erreur si l'opération échoue pour une raison quelconque.
   */
  async set(key: string, value: string): Promise<void> {
    await withConnection(this.pool, (conn) =>
      conn.query(
        "INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
        [key, value],
      ),
    );
  }
}
