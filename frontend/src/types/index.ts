export type Category = { id: string; name: string; restaurantId: string };
export type Product = { id: string; name: string; description: string; price: number; imageUrl: string; available: boolean; categoryId: string; category?: Category };
export type CartLine = { product: Product; quantity: number };
export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
export type Order = { id: string; totalPrice: number; status: OrderStatus; createdAt: string; table?: { id: string; number: number }; customer?: { id: string; email: string }; items: Array<{ id: string; quantity: number; price: number; product: Product }> };
export type RestaurantTable = { id: string; number: number; qrCode: string; qrTargetUrl?: string | null; restaurantId: string; menuUrl: string; restaurant?: { id: string; name: string; address: string } };
