import type { Request, Response } from "express";
import { OrderStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma/client.js";
import { notifyOrderStatusChange } from "../services/notificationService.js";

const orderSchema = z.object({ customerId: z.string().uuid().optional(), tableId: z.string().uuid().nullable().optional(), deviceId: z.string().optional(), items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().positive() })).min(1) });
const statusSchema = z.object({ status: z.nativeEnum(OrderStatus) });

type OrderWithRelations = Prisma.OrderGetPayload<{ include: { customer: true; table: true; items: { include: { product: true } } } }>;

function paramId(req: Request) {
  return z.string().parse(req.params.id);
}

function serializeOrder(order: OrderWithRelations) {
  return { ...order, totalPrice: Number(order.totalPrice), items: order.items.map((item) => ({ ...item, price: Number(item.price), product: { ...item.product, price: Number(item.product.price) } })) };
}

export async function getOrders(_req: Request, res: Response) {
  const orders = await prisma.order.findMany({ include: { customer: true, table: true, items: { include: { product: true } } }, orderBy: { createdAt: "desc" } });
  return res.json(orders.map(serializeOrder));
}

export async function getOrder(req: Request, res: Response) {
  const order = await prisma.order.findUnique({ where: { id: paramId(req) }, include: { customer: true, table: true, items: { include: { product: true } } } });
  if (!order) return res.status(404).json({ message: "Order not found" });
  return res.json(serializeOrder(order));
}

export async function createOrder(req: Request, res: Response) {
  const data = orderSchema.parse(req.body);
  const products = await prisma.product.findMany({ where: { id: { in: data.items.map((item) => item.productId) }, available: true } });
  const productMap = new Map(products.map((product) => [product.id, product]));
  const items = data.items.map((item) => { const product = productMap.get(item.productId); if (!product) throw new Error(`Product ${item.productId} is not available`); return { productId: item.productId, quantity: item.quantity, price: product.price }; });
  const totalPrice = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const order = await prisma.order.create({ data: { customerId: req.user?.customerId ?? data.customerId, tableId: data.tableId ?? undefined, totalPrice, items: { create: items } }, include: { customer: true, table: true, items: { include: { product: true } } } });
  
  // linknutie objeandvky na cislo zaraidenia
  if (data.deviceId) {
    try {
      const device = await prisma.device.findUnique({
        where: { deviceId: data.deviceId }
      });
      if (device) {
        await prisma.orderNotification.create({
          data: {
            orderId: order.id,
            deviceId: device.id,
          },
        });
      } else {
        console.warn(`Device with deviceId ${data.deviceId} not found, skipping order link.`);
      }
    } catch (error) {
      console.error(`Failed to create OrderNotification for device ${data.deviceId}:`, error);
      // dont throw - logni notifikaciu, ale objednavka sa vytvori aj tak
    }
  }
  
  return res.status(201).json(serializeOrder(order));
}

export async function updateOrderStatus(req: Request, res: Response) {
  const data = statusSchema.parse(req.body);
  const order = await prisma.order.update({ 
    where: { id: paramId(req) }, 
    data, 
    include: { customer: true, table: true, items: { include: { product: true } } } });

    await notifyOrderStatusChange(order.id, data.status); // Notify devices about the order status change

  return res.json(serializeOrder(order));
}

export async function getOrderAnalytics(_req: Request, res: Response) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [orders, activeOrderCount, topProducts] = await Promise.all([
    prisma.order.findMany({
      where: { status: { not: OrderStatus.CANCELLED } },
      select: { totalPrice: true, createdAt: true }
    }),
    prisma.order.count({
      where: { status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY] } }
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10
    })
  ]);

  const dailyOrders = orders.filter((order) => order.createdAt >= today);
  const dailyRevenue = dailyOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0);
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice), 0);
  const topProductIds = topProducts.map((item) => item.productId);
  const products = await prisma.product.findMany({ where: { id: { in: topProductIds } }, select: { id: true, name: true } });
  const productNames = new Map(products.map((product) => [product.id, product.name]));
  const topProductsWithNames = topProducts.map((item) => ({
    productId: item.productId,
    name: productNames.get(item.productId) ?? "Neznámy produkt",
    quantity: item._sum.quantity ?? 0
  }));

  return res.json({
    dailyRevenue,
    orderCount: orders.length,
    dailyOrderCount: dailyOrders.length,
    activeOrderCount,
    averageOrderValue: orders.length ? totalRevenue / orders.length : 0,
    topProduct: topProductsWithNames[0] ?? null,
    topProducts: topProductsWithNames
  });
}
