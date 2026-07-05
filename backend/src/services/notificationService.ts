import { prisma } from "../prisma/client.js";
import { isPushConfigured, webpush } from "../controllers/notificationController.js";

export async function findDevicesByOrderOrigin(orderId: string): Promise<any[]> {
  // Find all devices that are linked to this order through OrderNotification
  const notifications = await prisma.orderNotification.findMany({
    where: { orderId },
    include: {
      device: true,
    },
  });

  return notifications
    .map((n) => n.device)
    .filter((device) => device && device.isNotificationEnabled);
}

export async function sendPushNotification(
  deviceId: string,
  title: string,
  message: string,
  orderId?: string
): Promise<void> {
  if (!isPushConfigured) return;

  try {
    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device?.pushToken) {
      console.log(`Device ${deviceId} has no pushToken, skipping push`);
      return;
    }

    const subscription = JSON.parse(device.pushToken);
    const payload = JSON.stringify({ title, message, orderId });
    await webpush.sendNotification(subscription, payload);
    console.log(`📱 Push sent to device ${deviceId}: ${title}`);
  } catch (error) {
    console.error(`Failed to send push notification to device ${deviceId}:`, error);
    // Don't throw, just log - notifications are not critical
  }
}

export async function notifyOrderStatusChange(
  orderId: string,
  newStatus: string
): Promise<void> {
  if (!isPushConfigured) return;

  try {
    // Find all devices linked to this order
    const devices = await findDevicesByOrderOrigin(orderId);

    if (devices.length === 0) {
      console.log(`No devices found for order ${orderId}, skipping notifications`);
      return;
    }

    // Send notification to each device
    let title = "Zmena stavu objednávky"; 
    let message = "";

    switch (newStatus) {
      case "CONFIRMED":
        message = "Práve sme potvrdili tvoju objednávku! 🥳";
        break;
      case "PREPARING":
        message = "Už chystáme tvoju objednávku! 👩‍🍳";
        break;
      case "READY":
        message = "Tvoja objednávka je hotová! ☕";
        break;
      case "DELIVERED":
        message = "Doručili sme ti objednávku! 🍪";
        break;
      case "CANCELLED":
        message = "Tvoja objednávka bola bohužiaľ zrušená. 😔";
        break;
      default:
        message = "Stav vašej objednávky sa zmenil.";
    }

    await Promise.all(
      devices.map((device) =>
        sendPushNotification(device.id, title, message, orderId)
      )
    );

    console.log(
      `Notified ${devices.length} device(s) for order ${orderId} with status ${newStatus}`
    );
  } catch (error) {
    console.error(
      `Error in notifyOrderStatusChange for order ${orderId}:`,
      error
    );
    // Don't throw - notification errors shouldn't break the order update
  }
}
