import { createApp } from "./app";
import { env } from "./config/env";
import { assertDbConnection } from "./db/db";
import { logger } from "./lib/logger";
import http  from "node:http";
async function bootstrap() {
  try {
    await assertDbConnection()
    const app = createApp()
    const server = http.createServer(app)
    const port = Number(env.PORT) || 5002
    server.listen(port, () => {
      logger.info(`Server is listening to port: http://localhost:${port}`)
    })
  }
  catch (err) {
    logger.error(`Failed to start the server....,${(err as Error).message}`)
    process.exit(1)
  }
}
bootstrap()
