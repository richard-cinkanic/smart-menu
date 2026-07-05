import { Router } from "express";
import { registerDevice } from "../controllers/notificationController.js";

export const deviceRoutes = Router();

// POST /api/devices  — registracia zariadenia a push subscription
deviceRoutes.post("/", registerDevice);
