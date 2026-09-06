import { Router } from "express";
import { createOrder, getOrder, getOrderAnalytics, getOrders, updateOrderStatus } from "../controllers/orderController.js";
import { optionalAuth, requireAdmin } from "../middleware/authMiddleware.js";

export const orderRoutes = Router();

orderRoutes.get("/", requireAdmin, getOrders);
orderRoutes.get("/analytics/summary", requireAdmin, getOrderAnalytics);
orderRoutes.get("/:id", getOrder);
orderRoutes.post("/", optionalAuth, createOrder);
orderRoutes.put("/:id/status", requireAdmin, updateOrderStatus);
