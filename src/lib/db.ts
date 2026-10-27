import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _loanaidPool: Pool | undefined;
}

export const pool =
  global._loanaidPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  });

if (!global._loanaidPool) {
  global._loanaidPool = pool;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}
