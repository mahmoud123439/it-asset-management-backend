import { Response } from "express";
import { Prisma } from "@prisma/client";
import { logger } from "../logger";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    Object.setPrototypeOf(this, HttpError.prototype);
    this.name = "HttpError";
    this.status = status;
  }
}

interface ErrorMessages {
  unique?: string;
  notFound?: string;
  foreignKey?: string;
  foreignKeyStatus?: number;
}

/**
 * Central error mapper for controllers.
 * - HttpError            -> its own status + message
 * - Prisma P2002 (unique) -> 409
 * - Prisma P2025 (missing) -> 404
 * - Prisma P2003 (foreign key) -> 409 (or custom status)
 * - anything else         -> logged, then 500 with a generic message
 */
export const handleError = (
  error: unknown,
  res: Response,
  fallback: string,
  messages: ErrorMessages = {},
) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message:
          messages.unique ?? "A record with the same unique value already exists",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        message: messages.notFound ?? "Record not found",
      });
    }

    if (error.code === "P2003") {
      return res.status(messages.foreignKeyStatus ?? 409).json({
        message:
          messages.foreignKey ?? "Operation conflicts with related records",
      });
    }
  }

  logger.error({
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  return res.status(500).json({ message: fallback });
};
