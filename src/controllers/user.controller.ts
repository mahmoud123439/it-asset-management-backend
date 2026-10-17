import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { handleError } from "../utils/errors";
import { buildMeta, parseQuery } from "../utils/query";
import { userQuerySchema } from "../validations/user.validation";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const query = parseQuery(userQuerySchema, req.query, res);

    if (!query) return;

    const { page, limit, search, role, departmentId } = query;

    const where: Prisma.UserWhereInput = {};

    if (role) where.role = role;
    if (departmentId) where.departmentId = departmentId;
    if (search) where.email = { contains: search, mode: "insensitive" };

    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          department: true,
        },
        orderBy: { id: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ data, meta: buildMeta(page, limit, total) });
  } catch (error) {
    handleError(error, res, "Failed to fetch users");
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role, departmentId } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        departmentId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        departmentId: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    handleError(error, res, "Failed to create user", {
      unique: "A user with this email already exists",
      foreignKey: "Department not found",
      foreignKeyStatus: 400,
    });
  }
};
