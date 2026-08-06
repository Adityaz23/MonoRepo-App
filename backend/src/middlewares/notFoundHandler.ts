import type { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../lib/errors";

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new NotFoundError("Route not found"))
}
