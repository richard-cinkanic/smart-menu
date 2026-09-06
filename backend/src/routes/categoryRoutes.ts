import { Router } from "express";
import { createCategory, getCategories } from "../controllers/categoryController.js";
import { blockDemoWrites, requireAdmin } from "../middleware/authMiddleware.js";

export const categoryRoutes = Router();

categoryRoutes.get("/", getCategories);
categoryRoutes.post("/", requireAdmin, blockDemoWrites, createCategory);
