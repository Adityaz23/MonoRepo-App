import fs from 'node:fs'
import path from 'path'
import { logger } from '../lib/logger'
import { query } from './db'
const migrationDir = path.resolve(process.cwd(), 'src', 'migrations')
async function runMigrations() {
  logger.info(`Looking for migrations in: ${migrationDir}`)
  const files = fs
    .readdirSync(migrationDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
  if (files.length === 0) {
    logger.info('No migrations found')
    return
  }
  for (const file of files) {
    const fullPath = path.join(migrationDir, file)
    const sql = fs.readFileSync(fullPath, 'utf8')
    logger.info(`Running migrations : ${file}`)

    await query(sql)
    logger.info(`Finished migration.`)
  }
}
runMigrations()
  .then(() => {
    logger.info('All migrations completed successfully.')
    process.exit(0)
  })
  .catch(err => {
    logger.error(`Migration failed ${(err as Error).message}`)
    process.exit(1)
  })
