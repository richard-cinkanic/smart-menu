import { Router } from "express";
import { createProduct, deleteProduct, getAdminProducts, getProduct, getProducts, updateProduct } from "../controllers/productController.js";
import { requireAdmin } from "../middleware/authMiddleware.js";

export const productRoutes = Router();

productRoutes.get("/", getProducts);
productRoutes.get("/admin/all", requireAdmin, getAdminProducts);
productRoutes.get("/:id", getProduct);
productRoutes.post("/", requireAdmin, createProduct);
productRoutes.put("/:id", requireAdmin, updateProduct);
productRoutes.delete("/:id", requireAdmin, deleteProduct);
