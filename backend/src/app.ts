import express from "express";
import helmet from "helmet";
import cors from "cors";
import { notFoundHandler } from "./middlewares/notFoundHandler";
import { errorHandler } from "./middlewares/errorHandler";
export function createApp() {
  const app = express();
  app.use(helmet);
  app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));
  app.use(express.json);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
