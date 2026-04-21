import mariadb from "mariadb";

/**
 * Exécute une opération avec une connexion obtenue du pool.
 * La connexion est libérée dans tous les cas (succès ou erreur).
 */
export async function withConnection<T>(
  pool: mariadb.Pool,
  fn: (conn: mariadb.Connection) => Promise<T>,
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    return await fn(conn);
  } finally {
    conn.release();
  }
}

/**
 * Exécute une opération dans une transaction.
 * Commit automatique en cas de succès, rollback en cas d'erreur.
 * La connexion est libérée dans tous les cas.
 */
export async function withTransaction<T>(
  pool: mariadb.Pool,
  fn: (conn: mariadb.Connection) => Promise<T>,
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Construit la clause SET d'une requête UPDATE dynamique.
 * Les entrées dont la valeur est `undefined` sont exclues.
 * Retourne `null` si aucune entrée ne reste (rien à mettre à jour).
 */
export function buildSetClause(
  columns: Record<string, unknown>,
): { sql: string; values: unknown[] } | null {
  const entries = Object.entries(columns).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return null;
  return {
    sql: entries.map(([col]) => `${col} = ?`).join(", "),
    values: entries.map(([, v]) => v),
  };
}
