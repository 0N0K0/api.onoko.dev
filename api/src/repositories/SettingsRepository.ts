import mariadb from "mariadb";

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
    let conn;
    try {
      conn = await this.pool.getConnection();
      const rows = await conn.query(
        "SELECT value FROM settings WHERE `key` = ?",
        [key],
      );
      if (rows.length > 0) {
        return rows[0].value;
      }
      return null;
    } finally {
      if (conn) conn.release();
    }
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

  async set(key: string, value: string): Promise<void> {
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(
        "INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
        [key, value],
      );
    } finally {
      if (conn) conn.release();
    }
  }
}
