import { Response } from "express";
import { z } from "zod";
import { HttpError } from "./errors";

export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
};

export const buildMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

/**
 * Validates req.query against a Zod schema.
 * Empty strings (e.g. ?search=&status=) are treated as "not provided".
 * Sends a 400 and returns null when validation fails.
 */
export const parseQuery = <T extends z.ZodType>(
  schema: T,
  query: unknown,
  res: Response,
): z.output<T> | null => {
  const source = (query ?? {}) as Record<string, unknown>;
  const cleaned: Record<string, unknown> = {};

  for (const key of Object.keys(source)) {
    if (source[key] !== "") {
      cleaned[key] = source[key];
    }
  }

  const result = schema.safeParse(cleaned);

  if (!result.success) {
    res.status(400).json({
      message: "Validation failed",
      errors: result.error.issues,
    });
    return null;
  }

  return result.data;
};

export const parseId = (value: unknown): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "Invalid id");
  }

  return id;
};
