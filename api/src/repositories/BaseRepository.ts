import crypto from "crypto";
import mariadb from "mariadb";
import { withConnection, buildSetClause } from "../database/dbHelpers";

export abstract class BaseRepository {
  protected abstract readonly tableName: string;

  constructor(protected pool: mariadb.Pool) {}

  protected generateId(): string {
    return crypto.randomUUID();
  }

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

  async delete(id: string): Promise<boolean> {
    await withConnection(this.pool, (conn) =>
      conn.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]),
    );
    return true;
  }
}
