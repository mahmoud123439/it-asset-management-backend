import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { HttpError, handleError } from "../utils/errors";
import { buildMeta, parseQuery } from "../utils/query";
import { assignmentQuerySchema } from "../validations/assignment.validation";
import { isUserInWorkGroup } from "../utils/work-groups";

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const query = parseQuery(assignmentQuerySchema, req.query, res);

    if (!query) return;

    const { page, limit, userId: requestedUserId, assetId, active } = query;

    const where: Prisma.AssetAssignmentWhereInput = {};

    if (requestedUserId) where.userId = requestedUserId;
    if (assetId) where.assetId = assetId;
    if (active === "true") where.returnedAt = null;
    if (active === "false") where.returnedAt = { not: null };
    const userId = Number((req as any).user.userId);
    if (!(await isUserInWorkGroup(userId, "it"))) {
      where.userId = userId;
    }

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

export const replaceRequestedAsset = async (req: Request, res: Response) => {
  try {
    const {
      requestId,
      replacementAssetId,
      originalAssetStatus,
      issuedByName,
      resolutionNote,
    } = req.body;
    const issuedByUserId = Number((req as any).user.userId);

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const deviceRequest = await tx.deviceChangeRequest.findUnique({
        where: { id: requestId },
        select: { id: true, userId: true, assetId: true, type: true, status: true },
      });

      if (!deviceRequest) {
        throw new HttpError(404, "Device request not found");
      }
      if (
        deviceRequest.type !== "REPLACE_DEVICE" ||
        deviceRequest.status !== "APPROVED" ||
        !deviceRequest.assetId
      ) {
        throw new HttpError(409, "Only an approved device replacement request can be processed");
      }

      const activeAssignment = await tx.assetAssignment.findFirst({
        where: {
          userId: deviceRequest.userId,
          assetId: deviceRequest.assetId,
          returnedAt: null,
        },
        select: { id: true },
      });
      if (!activeAssignment) {
        throw new HttpError(409, "The original device is no longer assigned to this employee");
      }

      const replacement = await tx.asset.findUnique({
        where: { id: replacementAssetId },
        select: { id: true, status: true },
      });
      if (!replacement) {
        throw new HttpError(404, "Replacement asset not found");
      }
      if (replacement.status !== "AVAILABLE") {
        throw new HttpError(409, "Replacement asset is not available");
      }

      const originalAssignmentUpdate = await tx.assetAssignment.updateMany({
        where: { id: activeAssignment.id, returnedAt: null },
        data: { returnedAt: new Date() },
      });
      if (originalAssignmentUpdate.count !== 1) {
        throw new HttpError(409, "The original device assignment has changed");
      }

      const originalAssetUpdate = await tx.asset.updateMany({
        where: { id: deviceRequest.assetId, status: "ASSIGNED" },
        data: { status: originalAssetStatus },
      });
      if (originalAssetUpdate.count !== 1) {
        throw new HttpError(409, "The original device status has changed");
      }

      const replacementUpdate = await tx.asset.updateMany({
        where: { id: replacementAssetId, status: "AVAILABLE" },
        data: { status: "ASSIGNED" },
      });
      if (replacementUpdate.count !== 1) {
        throw new HttpError(409, "Replacement asset is no longer available");
      }

      await tx.assetAssignment.create({
        data: {
          userId: deviceRequest.userId,
          assetId: replacementAssetId,
          issuedByUserId,
          issuedByName,
        },
      });

      const requestUpdate = await tx.deviceChangeRequest.updateMany({
        where: { id: requestId, status: "APPROVED" },
        data: {
          status: "COMPLETED",
          resolutionNote: resolutionNote || "Device replaced and assignment updated",
          reviewedById: issuedByUserId,
          reviewedAt: new Date(),
        },
      });
      if (requestUpdate.count !== 1) {
        throw new HttpError(409, "The device request has already been updated");
      }

      return tx.deviceChangeRequest.findUniqueOrThrow({
        where: { id: requestId },
        select: {
          id: true,
          type: true,
          message: true,
          status: true,
          resolutionNote: true,
          reviewedAt: true,
          createdAt: true,
          user: {
            select: { id: true, email: true, employeeName: true, jobTitle: true },
          },
          asset: {
            select: {
              id: true,
              name: true,
              serialNumber: true,
              category: true,
              memoryGb: true,
              storageGb: true,
              storageType: true,
            },
          },
        },
      });
    });

    res.json(updatedRequest);
  } catch (error) {
    handleError(error, res, "Failed to replace assigned device");
  }
};
