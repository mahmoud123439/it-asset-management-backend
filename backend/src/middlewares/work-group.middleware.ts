import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";
import { handleError } from "../utils/errors";

export const workGroupMiddleware = (slug: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const membership = await prisma.userWorkGroup.findFirst({
        where: {
          userId: Number(userId),
          group: { slug },
        },
        select: { userId: true },
      });

      if (!membership) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (error) {
      handleError(error, res, "Failed to verify work group permissions");
    }
  };
};
