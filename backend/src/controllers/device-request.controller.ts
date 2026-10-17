import { DeviceRequestStatus, Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../prisma";
import { HttpError, handleError } from "../utils/errors";
import { parseId } from "../utils/query";
import { isUserInWorkGroup } from "../utils/work-groups";

const requestSelection = {
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
      manufacturer: true,
      model: true,
      memoryGb: true,
      storageGb: true,
      storageType: true,
    },
  },
} satisfies Prisma.DeviceChangeRequestSelect;

export const getDeviceRequests = async (req: Request, res: Response) => {
  try {
    const userId = Number((req as any).user.userId);
    const scope = req.query.scope;
    if (scope !== undefined && scope !== "mine") {
      return res.status(400).json({ message: "Invalid request scope" });
    }
    const canReview = await isUserInWorkGroup(userId, "it");
    const requests = await prisma.deviceChangeRequest.findMany({
      where: canReview && scope !== "mine" ? {} : { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: requestSelection,
    });

    res.json(requests);
  } catch (error) {
    handleError(error, res, "Failed to fetch device requests");
  }
};

export const createDeviceRequest = async (req: Request, res: Response) => {
  try {
    const userId = Number((req as any).user.userId);
    const { assetId, type, message } = req.body;
    const activeAssignment = await prisma.assetAssignment.findFirst({
      where: { userId, assetId, returnedAt: null },
      select: { id: true },
    });

    if (!activeAssignment) {
      throw new HttpError(403, "You can only request a change for a device assigned to you");
    }

    const createdRequest = await prisma.deviceChangeRequest.create({
      data: { userId, assetId, type, message },
      select: requestSelection,
    });

    res.status(201).json(createdRequest);
  } catch (error) {
    handleError(error, res, "Failed to create device request", {
      notFound: "Assigned device not found",
    });
  }
};

export const reviewDeviceRequest = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    const reviewerId = Number((req as any).user.userId);
    const { status, resolutionNote } = req.body;
    const existing = await prisma.deviceChangeRequest.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!existing) {
      throw new HttpError(404, "Device request not found");
    }

    const canTransition =
      (existing.status === "PENDING" &&
        (status === "APPROVED" || status === "REJECTED")) ||
      (existing.status === "APPROVED" && status === "COMPLETED");

    if (!canTransition) {
      throw new HttpError(409, `Cannot change request from ${existing.status} to ${status}`);
    }

    if (status === "REJECTED" && !resolutionNote) {
      throw new HttpError(400, "A reason is required when rejecting a request");
    }

    const updated = await prisma.deviceChangeRequest.updateMany({
      where: { id, status: existing.status },
      data: {
        status: status as DeviceRequestStatus,
        resolutionNote,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });

    if (updated.count !== 1) {
      throw new HttpError(409, "The device request has already been updated");
    }

    const updatedRequest = await prisma.deviceChangeRequest.findUniqueOrThrow({
      where: { id },
      select: requestSelection,
    });
    res.json(updatedRequest);
  } catch (error) {
    handleError(error, res, "Failed to review device request");
  }
};
