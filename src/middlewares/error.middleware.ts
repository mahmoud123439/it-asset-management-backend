import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    message: "Internal Server Error"
  });
};
