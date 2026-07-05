import type { Request, Response } from "express";
import webpush from "web-push";
import { z } from "zod";
import { prisma } from "../prisma/client.js";
import { env } from "../utils/env.js";

export const isPushConfigured = Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);

if (isPushConfigured) {
  webpush.setVapidDetails(env.VAPID_MAILTO, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

// Exportujeme konfigurovaný webpush instance pre notificationService
export { webpush };

export function getVapidPublicKey(_req: Request, res: Response) {
  if (!isPushConfigured) return res.status(503).json({ message: "Push notifications are not configured" });
  res.send(env.VAPID_PUBLIC_KEY);
}

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

const deviceSchema = z.object({
  deviceId: z.string().min(1),
  pushSubscription: pushSubscriptionSchema,
});

export async function registerDevice(req: Request, res: Response) {
  if (!isPushConfigured) return res.status(503).json({ message: "Push notifications are not configured" });
  const { deviceId, pushSubscription } = deviceSchema.parse(req.body);

  await prisma.device.upsert({
    where: { deviceId },
    update: {
      pushToken: JSON.stringify(pushSubscription),
      isNotificationEnabled: true,
    },
    create: {
      deviceId,
      pushToken: JSON.stringify(pushSubscription),
      isNotificationEnabled: true,
    },
  });

  return res.status(200).json({ ok: true });
}
