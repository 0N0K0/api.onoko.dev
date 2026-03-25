import mariadb from "mariadb";

export class SettingsRepository {
  private pool: mariadb.Pool;

  constructor(pool: mariadb.Pool) {
    this.pool = pool;
  }

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
