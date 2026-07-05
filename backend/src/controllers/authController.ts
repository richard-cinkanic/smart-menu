import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client.js";
import { signToken, verifyPassword } from "../utils/auth.js";

const authSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

export async function register(_req: Request, res: Response) {
  return res.status(403).json({ message: "Public registration is disabled" });
}

export async function login(req: Request, res: Response) {
  const data = authSchema.parse(req.body);
  const customer = await prisma.customer.findUnique({ where: { email: data.email.toLowerCase() } });
  if (!customer || !(await verifyPassword(data.password, customer.passwordHash))) return res.status(401).json({ message: "Invalid email or password" });
  if (customer.role !== "ADMIN") return res.status(403).json({ message: "Admin access required" });
  const token = signToken({ customerId: customer.id, email: customer.email, role: customer.role });
  return res.json({ token, customer: { id: customer.id, email: customer.email, role: customer.role } });
}
