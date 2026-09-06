import { Router } from "express";
import { createTable, deleteTable, getTable, getTableByNumber, getTables, regenerateTableQrCode, updateTable } from "../controllers/tableController.js";
import { blockDemoWrites, requireAdmin } from "../middleware/authMiddleware.js";

export const tableRoutes = Router();

tableRoutes.get("/", requireAdmin, getTables);
tableRoutes.get("/by-number/:number", getTableByNumber);
tableRoutes.get("/:id", getTable);
tableRoutes.post("/", requireAdmin, blockDemoWrites, createTable);
tableRoutes.put("/:id", requireAdmin, blockDemoWrites, updateTable);
tableRoutes.post("/:id/regenerate-qr", requireAdmin, blockDemoWrites, regenerateTableQrCode);
tableRoutes.delete("/:id", requireAdmin, blockDemoWrites, deleteTable);
