import { Request, Response } from "express";
import { prisma } from "../prisma";

export const getStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();

    const totalAssets = await prisma.asset.count();

    const availableAssets = await prisma.asset.count({
      where: {
        status: "AVAILABLE",
      },
    });

    const assignedAssets = await prisma.asset.count({
      where: {
        status: "ASSIGNED",
      },
    });

    res.json({
      totalUsers,
      totalAssets,
      availableAssets,
      assignedAssets,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load dashboard stats",
    });
  }
};



