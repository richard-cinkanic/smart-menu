import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "./env.js";

export function hashPassword(password: string) { return bcrypt.hash(password, 12); }
export function verifyPassword(password: string, passwordHash: string) { return bcrypt.compare(password, passwordHash); }
export function signToken(payload: { customerId: string; email: string; role: string }) { return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" }); }
export function verifyToken(token: string) { return jwt.verify(token, env.JWT_SECRET) as { customerId: string; email: string; role: string }; }
