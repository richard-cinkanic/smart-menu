import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/auth.js";

declare global { namespace Express { interface Request { user?: { customerId: string; email: string; role: string } } } }

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) { try { req.user = verifyToken(header.slice(7)); } catch { req.user = undefined; } }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  optionalAuth(req, res, () => { if (!req.user) return res.status(401).json({ message: "Authentication required" }); next(); });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "ADMIN") return res.status(403).json({ message: "Admin access required" });
    next();
  });
}
