import { Router } from "express";
import { createCategory, getCategories } from "../controllers/categoryController.js";
import { requireAdmin } from "../middleware/authMiddleware.js";

export const categoryRoutes = Router();

categoryRoutes.get("/", getCategories);
categoryRoutes.post("/", requireAdmin, createCategory);
