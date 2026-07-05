import { Router } from "express";
import { getVapidPublicKey } from "../controllers/notificationController.js";

export const notificationRoutes = Router();

// GET /api/notifications/vapidPublicKey
notificationRoutes.get("/vapidPublicKey", getVapidPublicKey);
