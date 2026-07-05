import { Router } from "express";
import { authRoutes } from "./authRoutes.js";
import { categoryRoutes } from "./categoryRoutes.js";
import { orderRoutes } from "./orderRoutes.js";
import { productRoutes } from "./productRoutes.js";
import { tableRoutes } from "./tableRoutes.js";
import { notificationRoutes } from "./notificationRoutes.js";
import { deviceRoutes } from "./deviceRoutes.js";

export const apiRoutes = Router();
apiRoutes.get("/health", (_req, res) => res.json({ status: "ok", service: "SmartMenuAI" }));
apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/products", productRoutes);
apiRoutes.use("/categories", categoryRoutes);
apiRoutes.use("/orders", orderRoutes);
apiRoutes.use("/tables", tableRoutes);
apiRoutes.use("/notifications", notificationRoutes);  // GET /api/notifications/vapidPublicKey
apiRoutes.use("/devices", deviceRoutes);              // POST /api/devices