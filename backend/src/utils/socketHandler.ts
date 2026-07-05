// TODO: Implementovat WebSocket fallback pomocou socket.io (optional)
// Po `npm i socket.io` (backend) a `npm i socket.io-client` (frontend) zapoj takto:
//
// import { Server } from "socket.io";
// export function initSocketHandler(io: Server) {
//   io.on("connection", (socket) => {
//     socket.on("subscribe-order", (orderId: string) => {
//       socket.join(`order-${orderId}`);
//     });
//   });
// }
//
// A pri zmene statusu v orderController.ts:
// io.to(`order-${orderId}`).emit("order-status-changed", { orderId, newStatus, timestamp: new Date() });

export {};