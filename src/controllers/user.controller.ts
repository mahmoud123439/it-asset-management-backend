import { Request, Response } from "express";
import { prisma } from "../prisma";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        department: true,
      },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role, departmentId } = req.body;

    const user = await prisma.user.create({
      data: {
        email,
        password,
        role,
        departmentId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to create user" });
  }
};
