import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { HttpError, handleError } from "../utils/errors";

export const onboardDevice = async (req: Request, res: Response) => {
  try {
    const { email, password, employeeName, jobTitle, issuedByName, asset } =
      req.body;
    const issuedByUserId = Number((req as any).user.userId);
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new HttpError(
        409,
        "An account already exists for this email. Use a different email to create a new employee account.",
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await prisma.$transaction(async (tx) => {
      const employee = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "EMPLOYEE",
          employeeName,
          jobTitle,
          microsoft365LicenseAssigned:
            asset.softwareLicenses.includes("Microsoft 365"),
          workGroups: {
            create: {
              group: { connect: { slug: "employees" } },
            },
          },
        },
        select: {
          id: true,
          email: true,
          role: true,
          employeeName: true,
          jobTitle: true,
          department: { select: { name: true } },
        },
      });

      const createdAsset = await tx.asset.create({
        data: { ...asset, status: "ASSIGNED" },
      });

      const assignment = await tx.assetAssignment.create({
        data: {
          userId: employee.id,
          assetId: createdAsset.id,
          issuedByUserId,
          issuedByName,
        },
        include: {
          issuedBy: { select: { id: true, email: true, employeeName: true } },
        },
      });

      return { employee, asset: createdAsset, assignment };
    });

    res.status(201).json(result);
  } catch (error) {
    handleError(error, res, "Failed to create employee account and assign device", {
      unique: "An account or asset with these details already exists",
    });
  }
};
