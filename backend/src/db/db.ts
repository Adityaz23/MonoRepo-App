import { Pool, type QueryResult, type QueryResultRow } from 'pg'
import { env } from '../config/env'
import { logger } from '../lib/logger';
export const pool = new Pool({
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  password: env.DB_PASSWORD,
  user: env.DB_USER,
  database: env.DB_NAME
})

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?:unknown[]
): Promise<QueryResult<T>>{
  const result = await pool.query<T>(text, params as any[])
  return result;
}

// Testing the db connection ->
//
export async function assertDbConnection() {
  try { await pool.query("SELECT 1"); logger.info("Connected to postgres.")}

  catch (e) {
    console.error(e)
  }
}
