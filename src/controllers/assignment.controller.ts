import { Request, Response } from "express";
import { prisma } from "../prisma";

export const assignAsset = async (req: Request, res: Response) => {
  try {
    const { userId, assetId } = req.body;

    const asset = await prisma.asset.findUnique({
      where: {
        id: assetId,
      },
    });

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    if (asset.status !== "AVAILABLE") {
      return res.status(400).json({
        message: "Asset is not available",
      });
    }

    const assignment = await prisma.assetAssignment.create({
      data: {
        userId,
        assetId,
      },
    });

    await prisma.asset.update({
      where: {
        id: assetId,
      },
      data: {
        status: "ASSIGNED",
      },
    });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({
      message: "Failed to assign asset",
    });
  }
};

export const returnAsset = async (req: Request, res: Response) => {
  try {
    const { assetId } = req.body;

    const assignment = await prisma.assetAssignment.findFirst({
      where: {
        assetId,
        returnedAt: null,
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    if (!assignment) {
      return res.status(404).json({
        message: "Active assignment not found",
      });
    }

    await prisma.assetAssignment.update({
      where: {
        id: assignment.id,
      },
      data: {
        returnedAt: new Date(),
      },
    });

    await prisma.asset.update({
      where: {
        id: assetId,
      },
      data: {
        status: "AVAILABLE",
      },
    });

    res.json({
      message: "Asset returned successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to return asset",
    });
  }
};
