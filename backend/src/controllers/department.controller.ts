import { Request, Response } from "express";
import { prisma } from "../prisma";
import { HttpError, handleError } from "../utils/errors";
import { parseId } from "../utils/query";

export const getDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    res.json(departments);
  } catch (error) {
    handleError(error, res, "Failed to fetch departments");
  }
};

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    const department = await prisma.department.create({
      data: { name },
    });

    res.status(201).json(department);
  } catch (error) {
    handleError(error, res, "Failed to create department", {
      unique: "A department with this name already exists",
    });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    const { name } = req.body;

    const department = await prisma.department.update({
      where: { id },
      data: { name },
    });

    res.json(department);
  } catch (error) {
    handleError(error, res, "Failed to update department", {
      unique: "A department with this name already exists",
      notFound: "Department not found",
    });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);

    const usersCount = await prisma.user.count({
      where: { departmentId: id },
    });

    if (usersCount > 0) {
      throw new HttpError(
        409,
        "Cannot delete a department that still has users",
      );
    }

    await prisma.department.delete({
      where: { id },
    });

    res.json({
      message: "Department deleted successfully",
    });
  } catch (error) {
    handleError(error, res, "Failed to delete department", {
      notFound: "Department not found",
    });
  }
};
