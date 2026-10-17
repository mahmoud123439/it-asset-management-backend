import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { HttpError, handleError } from "../utils/errors";
import { buildMeta, parseQuery } from "../utils/query";
import { assignmentQuerySchema } from "../validations/assignment.validation";

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const query = parseQuery(assignmentQuerySchema, req.query, res);

    if (!query) return;

    const { page, limit, userId, assetId, active } = query;

    const where: Prisma.AssetAssignmentWhereInput = {};

    if (userId) where.userId = userId;
    if (assetId) where.assetId = assetId;
    if (active === "true") where.returnedAt = null;
    if (active === "false") where.returnedAt = { not: null };

    const [data, total] = await prisma.$transaction([
      prisma.assetAssignment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          asset: {
            select: {
              id: true,
              name: true,
              serialNumber: true,
            },
          },
        },
        orderBy: {
          assignedAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.assetAssignment.count({ where }),
    ]);

    res.json({ data, meta: buildMeta(page, limit, total) });
  } catch (error) {
    handleError(error, res, "Failed to fetch assignments");
  }
};

export const assignAsset = async (req: Request, res: Response) => {
  try {
    const { userId, assetId } = req.body;

    const assignment = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new HttpError(404, "User not found");
      }

      const asset = await tx.asset.findUnique({
        where: { id: assetId },
        select: { id: true },
      });

      if (!asset) {
        throw new HttpError(404, "Asset not found");
      }

      // Atomic guard: only flips AVAILABLE -> ASSIGNED, so two concurrent
      // requests cannot assign the same asset twice.
      const updated = await tx.asset.updateMany({
        where: { id: assetId, status: "AVAILABLE" },
        data: { status: "ASSIGNED" },
      });

      if (updated.count === 0) {
        throw new HttpError(400, "Asset is not available");
      }

      return tx.assetAssignment.create({
        data: {
          userId,
          assetId,
        },
      });
    });

    res.status(201).json(assignment);
  } catch (error) {
    handleError(error, res, "Failed to assign asset");
  }
};

export const returnAsset = async (req: Request, res: Response) => {
  try {
    const { assetId } = req.body;

    await prisma.$transaction(async (tx) => {
      const assignment = await tx.assetAssignment.findFirst({
        where: {
          assetId,
          returnedAt: null,
        },
        orderBy: {
          assignedAt: "desc",
        },
      });

      if (!assignment) {
        throw new HttpError(404, "Active assignment not found");
      }

      await tx.assetAssignment.update({
        where: {
          id: assignment.id,
        },
        data: {
          returnedAt: new Date(),
        },
      });

      await tx.asset.update({
        where: {
          id: assetId,
        },
        data: {
          status: "AVAILABLE",
        },
      });
    });

    res.json({
      message: "Asset returned successfully",
    });
  } catch (error) {
    handleError(error, res, "Failed to return asset");
  }
};
