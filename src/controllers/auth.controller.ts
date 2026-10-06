import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";

export const register = async (
  req: Request,
  res: Response
) => {
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
      },
    });

    return res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};