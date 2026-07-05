export const DEVICE_KEY = "sm-device-id";

// funkcia ktora vygenruje id zariadenia a ulozi ho do lokalnej pamate
export function getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_KEY);

    if (deviceId) return deviceId;

    if (typeof crypto === "undefined" || typeof crypto.randomUUID !== "function") {
        // fallback pre prostredia bez crypto.randomUUID (napr. IE)
        deviceId = "device-" + Math.random().toString(36).substr(2, 9);
    } else {
        deviceId = crypto.randomUUID();
    }
    localStorage.setItem(DEVICE_KEY, deviceId);
    return deviceId;
}

// funkcia ktora zaregistruje zariadenie na serveri
export function registerDevice(customerId?: string) {
    const deviceId = getOrCreateDeviceId();
}