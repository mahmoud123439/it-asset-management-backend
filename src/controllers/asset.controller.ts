import { Request, Response } from "express";
import { prisma } from "../prisma";

export const getAssets = async (req: Request, res: Response) => {
  try {
    const assets = await prisma.asset.findMany();

    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch assets" });
  }
};

export const getAssetById = async (req: Request, res: Response) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch asset" });
  }
};

export const createAsset = async (req: Request, res: Response) => {
  try {
    const { name, serialNumber, category, status } = req.body;

    const asset = await prisma.asset.create({
      data: {
        name,
        serialNumber,
        category,
        status,
      },
    });

    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: "Failed to create asset" });
  }
};

export const updateAsset = async (req: Request, res: Response) => {
  try {
    const { name, serialNumber, category, status } = req.body;

    const asset = await prisma.asset.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        name,
        serialNumber,
        category,
        status,
      },
    });

    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: "Failed to update asset" });
  }
};

export const deleteAsset = async (req: Request, res: Response) => {
  try {
    await prisma.asset.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    res.json({
      message: "Asset deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete asset",
    });
  }
};
