import QRCode from "qrcode";
import { env } from "../utils/env.js";

export function tableMenuUrl(tableNumber: number | string) { return `${env.PUBLIC_APP_URL}/menu?table=${tableNumber}`; }
export async function generateQrCodeForUrl(url: string) { return QRCode.toDataURL(url, { margin: 2, width: 320 }); }
export async function generateTableQrCode(tableNumber: number | string, customUrl?: string | null) { return generateQrCodeForUrl(customUrl || tableMenuUrl(tableNumber)); }
