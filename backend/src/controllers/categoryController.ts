import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client.js";

const categorySchema = z.object({ name: z.string().min(1), restaurantId: z.string().uuid() });
const activeCategoryNames = ["Káva", "Čaje", "Nealkoholické nápoje", "Nealkoholické miešané nápoje", "Pivo", "Víno", "Miešané nápoje", "Dezerty"];
export async function getCategories(_req: Request, res: Response) { const categories = await prisma.category.findMany({ where: { name: { in: activeCategoryNames } }, orderBy: { name: "asc" } }); return res.json(categories); }
export async function createCategory(req: Request, res: Response) { const data = categorySchema.parse(req.body); const category = await prisma.category.create({ data }); return res.status(201).json(category); }
