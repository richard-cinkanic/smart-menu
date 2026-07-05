// Tento hook sa stara o registraciu service workera a push notifikacii
// Pri registracii sa ziska VAPID kluc z backendu a vytvori push subscription
// Subscription sa posle na backend spolu s deviceId, aby sme mohli posielat notifikacie na spravne zariadenie
import { useEffect } from "react";
import { getOrCreateDeviceId } from "../utils/deviceStorage";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePush() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    
    // Ak už máme povolenie (napr. z minula), zaregistrujeme ho hneď na pozadí
    if (Notification.permission === "granted") {
      setupPush();
    }
  }, []);

  async function setupPush() {
    try {
      console.log("Push setup: starting...");
      const registration = await navigator.serviceWorker.register("/service-worker.js");
      console.log("Push setup: SW registered");

      console.log("Push setup: fetching VAPID key...");
      const r = await fetch("/api/notifications/vapidPublicKey");
      if (!r.ok) {
        console.error("Push setup: failed to fetch VAPID key");
        return;
      }
      const vapidPublicKey = await r.text();

      console.log("Push setup: subscribing to pushManager...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log("Push setup: sending to backend...");
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: getOrCreateDeviceId(),
          pushSubscription: subscription,
        }),
      });
      console.log("Push setup: backend responded with", res.status);
      return true;
    } catch (err) {
      console.error("Push setup failed:", err);
      return false;
    }
  }

  // Túto funkciu zavoláme manuálne po kliknutí na tlačidlo "Odoslať objednávku"
  async function requestPushPermission() {
    if (!("Notification" in window)) return false;
    
    // Ak už je zamietnuté, nemá zmysel pýtať znova, browser to aj tak ignoruje
    if (Notification.permission === "denied") {
      console.warn("Push permission already denied");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log("Push setup: user responded to prompt with", permission);
      if (permission === "granted") {
        return await setupPush();
      }
    } catch (err) {
      console.error("Error requesting push permission:", err);
    }
    return false;
  }

  return { requestPushPermission };
}