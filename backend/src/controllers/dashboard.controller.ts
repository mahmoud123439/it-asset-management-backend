import { Request, Response } from "express";
import { prisma } from "../prisma";
import { isUserInWorkGroup } from "../utils/work-groups";

export const getStats = async (req: Request, res: Response) => {
  try {
    const userId = Number((req as any).user.userId);
    if (!(await isUserInWorkGroup(userId, "it"))) {
      const [totalAssets, assignedAssets] = await Promise.all([
        prisma.assetAssignment.findMany({
          where: { userId, returnedAt: null },
          distinct: ["assetId"],
          select: { assetId: true },
        }),
        prisma.assetAssignment.count({
          where: { userId, returnedAt: null },
        }),
      ]);

      return res.json({
        totalUsers: 1,
        totalAssets: totalAssets.length,
        availableAssets: 0,
        assignedAssets,
      });
    }

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
