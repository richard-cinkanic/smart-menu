import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client.js";

const imageSchema = z.string().trim().refine((value) => value === "" || value.startsWith("data:image/") || z.string().url().safeParse(value).success, "Invalid image URL");
const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.coerce.number().refine((price) => price > 0, { message: "Cena musí byť väčšia ako 0 €." }),
  imageUrl: imageSchema.default(""),
  available: z.boolean().default(true),
  categoryId: z.string().uuid()
});
const serializeProduct = <T extends { price: unknown }>(product: T) => ({ ...product, price: Number(product.price) });
const paramId = (req: Request) => z.string().parse(req.params.id);
const activeCategoryNames = ["Káva", "Čaje", "Nealkoholické nápoje", "Nealkoholické miešané nápoje", "Pivo", "Víno", "Miešané nápoje", "Dezerty"];

export async function getProducts(_req: Request, res: Response) { const products = await prisma.product.findMany({ where: { available: true, category: { name: { in: activeCategoryNames } } }, include: { category: true }, orderBy: { name: "asc" } }); return res.json(products.map(serializeProduct)); }
export async function getAdminProducts(_req: Request, res: Response) { const products = await prisma.product.findMany({ where: { category: { name: { in: activeCategoryNames } } }, include: { category: true }, orderBy: [{ category: { name: "asc" } }, { name: "asc" }] }); return res.json(products.map(serializeProduct)); }
export async function getProduct(req: Request, res: Response) { const product = await prisma.product.findUnique({ where: { id: paramId(req) }, include: { category: true } }); if (!product) return res.status(404).json({ message: "Product not found" }); return res.json(serializeProduct(product)); }
export async function createProduct(req: Request, res: Response) { const data = productSchema.parse(req.body); const product = await prisma.product.create({ data, include: { category: true } }); return res.status(201).json(serializeProduct(product)); }
export async function updateProduct(req: Request, res: Response) { const data = productSchema.partial().parse(req.body); const product = await prisma.product.update({ where: { id: paramId(req) }, data, include: { category: true } }); return res.json(serializeProduct(product)); }
export async function deleteProduct(req: Request, res: Response) { await prisma.product.delete({ where: { id: paramId(req) } }); return res.status(204).send(); }
