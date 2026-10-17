import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { groupSlugForRole } from "../utils/work-groups";

const JWT_SECRET = process.env.JWT_SECRET!;

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        workGroups: {
          create: {
            group: { connect: { slug: groupSlugForRole("EMPLOYEE") } },
          },
        },
      },
    });

    return res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    return res.json({
      token,
    });
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message,
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
      select: {
        id: true,
        email: true,
        role: true,
        employeeName: true,
        jobTitle: true,
        microsoft365LicenseAssigned: true,
        createdAt: true,
        department: { select: { id: true, name: true } },
        workGroups: {
          select: {
            group: { select: { slug: true, name: true } },
          },
        },
        assignments: {
          orderBy: { assignedAt: "desc" },
          select: {
            id: true,
            assignedAt: true,
            returnedAt: true,
            issuedByName: true,
            issuedBy: {
              select: { id: true, email: true, employeeName: true },
            },
            asset: {
              select: {
                id: true,
                name: true,
                serialNumber: true,
                category: true,
                status: true,
                createdAt: true,
                manufacturer: true,
                model: true,
                processor: true,
                memoryGb: true,
                storageGb: true,
                storageType: true,
                operatingSystem: true,
                windowsEdition: true,
                windowsLicenseAssigned: true,
                antivirusProduct: true,
                softwareLicenses: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch current user",
    });
  }
};
