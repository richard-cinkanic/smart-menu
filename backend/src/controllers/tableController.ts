import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client.js";
import { generateTableQrCode, tableMenuUrl } from "../services/qrCodeService.js";

const tableSchema = z.object({
  number: z.number().int().positive(),
  qrTargetUrl: z.string().url().optional().or(z.literal("")),
  restaurantId: z.string().uuid().optional()
});
const tableUpdateSchema = z.object({
  number: z.number().int().positive(),
  qrTargetUrl: z.string().url().optional().or(z.literal(""))
});
const tableNumberSchema = z.coerce.number().int().positive();
const paramId = (req: Request) => z.string().uuid().parse(req.params.id);

type TableWithRestaurant = NonNullable<Awaited<ReturnType<typeof findTableWithRestaurant>>>;

function findTableWithRestaurant(id: string) {
  return prisma.table.findUnique({ where: { id }, include: { restaurant: true } });
}

function serializeTable(table: TableWithRestaurant) {
  return { ...table, menuUrl: table.qrTargetUrl || tableMenuUrl(table.number) };
}

function normalizeQrTargetUrl(url?: string) {
  const trimmed = url?.trim();
  return trimmed ? trimmed : null;
}

async function getRestaurant(restaurantId?: string) {
  if (restaurantId) return prisma.restaurant.findUnique({ where: { id: restaurantId } });
  return prisma.restaurant.findFirst({ orderBy: { createdAt: "asc" } });
}

export async function getTables(_req: Request, res: Response) {
  const tables = await prisma.table.findMany({ include: { restaurant: true }, orderBy: { number: "asc" } });
  return res.json(tables.map(serializeTable));
}

export async function getTable(req: Request, res: Response) {
  const table = await findTableWithRestaurant(paramId(req));
  if (!table) return res.status(404).json({ message: "Table not found" });
  return res.json(serializeTable(table));
}

export async function getTableByNumber(req: Request, res: Response) {
  const number = tableNumberSchema.parse(req.params.number);
  const restaurant = await getRestaurant();
  if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

  const table = await prisma.table.upsert({
    where: { restaurantId_number: { restaurantId: restaurant.id, number } },
    update: {},
    create: { number, restaurantId: restaurant.id, qrCode: "generating" },
    include: { restaurant: true }
  });

  if (table.qrCode === "generating") {
    const qrCode = await generateTableQrCode(table.number, table.qrTargetUrl);
    const updated = await prisma.table.update({ where: { id: table.id }, data: { qrCode }, include: { restaurant: true } });
    return res.json(serializeTable(updated));
  }

  return res.json(serializeTable(table));
}

export async function createTable(req: Request, res: Response) {
  const data = tableSchema.parse(req.body);
  const restaurant = await getRestaurant(data.restaurantId);
  if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

  const qrTargetUrl = normalizeQrTargetUrl(data.qrTargetUrl);
  const table = await prisma.table.create({ data: { number: data.number, qrTargetUrl, restaurantId: restaurant.id, qrCode: "generating" } });
  const updated = await prisma.table.update({
    where: { id: table.id },
    data: { qrCode: await generateTableQrCode(table.number, qrTargetUrl) },
    include: { restaurant: true }
  });
  return res.status(201).json(serializeTable(updated));
}

export async function updateTable(req: Request, res: Response) {
  const data = tableUpdateSchema.parse(req.body);
  const table = await prisma.table.findUnique({ where: { id: paramId(req) } });
  if (!table) return res.status(404).json({ message: "Table not found" });
  const qrTargetUrl = normalizeQrTargetUrl(data.qrTargetUrl);

  const updated = await prisma.table.update({
    where: { id: table.id },
    data: { number: data.number, qrTargetUrl, qrCode: await generateTableQrCode(data.number, qrTargetUrl) },
    include: { restaurant: true }
  });
  return res.json(serializeTable(updated));
}

export async function regenerateTableQrCode(req: Request, res: Response) {
  const table = await prisma.table.findUnique({ where: { id: paramId(req) } });
  if (!table) return res.status(404).json({ message: "Table not found" });

  const updated = await prisma.table.update({
    where: { id: table.id },
    data: { qrCode: await generateTableQrCode(table.number, table.qrTargetUrl) },
    include: { restaurant: true }
  });
  return res.json(serializeTable(updated));
}

export async function deleteTable(req: Request, res: Response) {
  const table = await prisma.table.findUnique({ where: { id: paramId(req) } });
  if (!table) return res.status(404).json({ message: "Table not found" });
  await prisma.table.delete({ where: { id: table.id } });
  return res.status(204).send();
}
