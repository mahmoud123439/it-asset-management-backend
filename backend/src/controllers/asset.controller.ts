import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { HttpError, handleError } from "../utils/errors";
import { buildMeta, parseId, parseQuery } from "../utils/query";
import { assetQuerySchema } from "../validations/asset.validation";
import { isUserInWorkGroup } from "../utils/work-groups";

export const getAssets = async (req: Request, res: Response) => {
  try {
    const query = parseQuery(assetQuerySchema, req.query, res);

    if (!query) return;

    const { page, limit, search, status, category, sortBy, order } = query;

    const where: Prisma.AssetWhereInput = {};

    if (status) where.status = status;

    if (category) {
      where.category = { equals: category, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { serialNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const userId = Number((req as any).user.userId);
    if (!(await isUserInWorkGroup(userId, "it"))) {
      where.assignments = {
        some: { userId, returnedAt: null },
      };
    }

    const [data, total] = await prisma.$transaction([
      prisma.asset.findMany({
        where,
        orderBy: { [sortBy]: order } as Prisma.AssetOrderByWithRelationInput,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ]);

    res.json({ data, meta: buildMeta(page, limit, total) });
  } catch (error) {
    handleError(error, res, "Failed to fetch assets");
  }
};

export const getAssetById = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    const userId = Number((req as any).user.userId);
    const canViewAll = await isUserInWorkGroup(userId, "it");
    const asset = await prisma.asset.findUnique({
      where: {
        id,
        ...(!canViewAll && {
          assignments: { some: { userId, returnedAt: null } },
        }),
      },
    });

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    res.json(asset);
  } catch (error) {
    handleError(error, res, "Failed to fetch asset");
  }
};

export const createAsset = async (req: Request, res: Response) => {
  try {
    const {
      name,
      serialNumber,
      category,
      status,
      manufacturer,
      model,
      processor,
      memoryGb,
      storageGb,
      storageType,
      operatingSystem,
      windowsEdition,
      windowsLicenseAssigned,
      antivirusProduct,
      softwareLicenses,
    } = req.body;

    const asset = await prisma.asset.create({
      data: {
        name,
        serialNumber,
        category,
        status,
        manufacturer,
        model,
        processor,
        memoryGb,
        storageGb,
        storageType,
        operatingSystem,
        windowsEdition,
        windowsLicenseAssigned,
        antivirusProduct,
        softwareLicenses,
      },
    });

    res.status(201).json(asset);
  } catch (error) {
    handleError(error, res, "Failed to create asset", {
      unique: "An asset with this serial number already exists",
    });
  }
};

export const updateAsset = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    const {
      name,
      serialNumber,
      category,
      status,
      manufacturer,
      model,
      processor,
      memoryGb,
      storageGb,
      storageType,
      operatingSystem,
      windowsEdition,
      windowsLicenseAssigned,
      antivirusProduct,
      softwareLicenses,
    } = req.body;

    const existing = await prisma.asset.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new HttpError(404, "Asset not found");
    }

    if (existing.status === "ASSIGNED" && status !== "ASSIGNED") {
      throw new HttpError(
        400,
        "Asset is currently assigned. Return it before changing its status",
      );
    }

    if (existing.status !== "ASSIGNED" && status === "ASSIGNED") {
      throw new HttpError(
        400,
        "Status ASSIGNED can only be set by assigning the asset to a user",
      );
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        name,
        serialNumber,
        category,
        status,
        ...(manufacturer !== undefined && { manufacturer }),
        ...(model !== undefined && { model }),
        ...(processor !== undefined && { processor }),
        ...(memoryGb !== undefined && { memoryGb }),
        ...(storageGb !== undefined && { storageGb }),
        ...(storageType !== undefined && { storageType }),
        ...(operatingSystem !== undefined && { operatingSystem }),
        ...(windowsEdition !== undefined && { windowsEdition }),
        ...(windowsLicenseAssigned !== undefined && {
          windowsLicenseAssigned,
        }),
        ...(antivirusProduct !== undefined && { antivirusProduct }),
        ...(softwareLicenses !== undefined && { softwareLicenses }),
      },
    });

    res.json(asset);
  } catch (error) {
    handleError(error, res, "Failed to update asset", {
      unique: "An asset with this serial number already exists",
      notFound: "Asset not found",
    });
  }
};

export const updateWindowsLicense = async (req: Request, res: Response) => {
  try {
    const asset = await prisma.asset.update({
      where: { id: parseId(req.params.id) },
      data: { windowsLicenseAssigned: req.body.assigned },
      select: {
        id: true,
        windowsLicenseAssigned: true,
      },
    });

    res.json(asset);
  } catch (error) {
    handleError(error, res, "Failed to update Windows license assignment", {
      notFound: "Asset not found",
    });
  }
};

export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);

    const existing = await prisma.asset.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!existing) {
      throw new HttpError(404, "Asset not found");
    }

    if (existing.status === "ASSIGNED") {
      throw new HttpError(
        409,
        "Cannot delete an asset that is currently assigned",
      );
    }

    await prisma.asset.delete({
      where: { id },
    });

    res.json({
      message: "Asset deleted successfully",
    });
  } catch (error) {
    handleError(error, res, "Failed to delete asset", {
      notFound: "Asset not found",
      foreignKey: "Cannot delete an asset that has assignment history",
    });
  }
};
