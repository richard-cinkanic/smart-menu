import { useEffect, useMemo, useState } from "react";
import OrderTable from "../components/OrderTable";
import { api } from "../api/client";
import type { Order, OrderStatus } from "../types";
import { activeOrderStatuses, getOrderStatusLabel } from "../utils/orderStatus";

type OrderTab = "active" | "completed" | "cancelled" | "all";
type DateFilter = "today" | "week" | "month" | "all";

const tabs: Array<{ id: OrderTab; label: string }> = [
  { id: "active", label: "Aktívne objednávky" },
  { id: "completed", label: "Dokončené objednávky" },
  { id: "cancelled", label: "Zrušené objednávky" },
  { id: "all", label: "Všetky objednávky" }
];

const dateFilters: Array<{ id: DateFilter; label: string }> = [
  { id: "today", label: "Dnes" },
  { id: "week", label: "Tento týždeň" },
  { id: "month", label: "Tento mesiac" },
  { id: "all", label: "Všetko" }
];

function isSameDate(date: Date, now: Date) {
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function isInCurrentWeek(date: Date, now: Date) {
  const start = new Date(now);
  const day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
}

function matchesDateFilter(order: Order, filter: DateFilter) {
  if (filter === "all") return true;
  const date = new Date(order.createdAt);
  const now = new Date();
  if (filter === "today") return isSameDate(date, now);
  if (filter === "week") return isInCurrentWeek(date, now);
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function matchesTab(order: Order, tab: OrderTab) {
  if (tab === "active") return activeOrderStatuses.includes(order.status);
  if (tab === "completed") return order.status === "COMPLETED";
  if (tab === "cancelled") return order.status === "CANCELLED";
  return true;
}

function matchesSearch(order: Order, search: string) {
  const value = search.trim().toLowerCase();
  if (!value) return true;
  return order.id.toLowerCase().includes(value)
    || (order.customer?.email.toLowerCase().includes(value) ?? false)
    || String(order.table?.number ?? "").includes(value);
}

function productsForExport(order: Order) {
  return order.items.map((item) => `${item.quantity}x ${item.product.name}`).join("; ");
}

function exportRows(orders: Order[]) {
  return orders.map((order) => ({
    "ID objednávky": order.id,
    "Dátum a čas": new Date(order.createdAt).toLocaleString("sk-SK"),
    "Číslo stola": order.table?.number ?? "",
    "Zákazník": order.customer?.email ?? "Hosť",
    "Produkty": productsForExport(order),
    "Celková cena": order.totalPrice.toFixed(2),
    "Stav objednávky": getOrderStatusLabel(order.status)
  }));
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportFileName(extension: "csv" | "xlsx") {
  const stamp = new Date().toISOString().slice(0, 10);
  return `objednavky-${stamp}.${extension}`;
}

function crc32Bytes(input: Uint8Array) {
  let crc = -1;
  for (let i = 0; i < input.length; i += 1) {
    crc ^= input[i];
    for (let j = 0; j < 8; j += 1) crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}

function textBytes(text: string) {
  return new TextEncoder().encode(text);
}

function createZip(files: Array<{ name: string; content: string }>) {
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const encoder = new TextEncoder();
  const write16 = (view: DataView, position: number, value: number) => view.setUint16(position, value, true);
  const write32 = (view: DataView, position: number, value: number) => view.setUint32(position, value, true);

  files.forEach((file) => {
    const name = encoder.encode(file.name);
    const content = textBytes(file.content);
    const checksum = crc32Bytes(content);
    const local = new Uint8Array(30 + name.length + content.length);
    const localView = new DataView(local.buffer);
    write32(localView, 0, 0x04034b50);
    write16(localView, 4, 20);
    write32(localView, 14, checksum);
    write32(localView, 18, content.length);
    write32(localView, 22, content.length);
    write16(localView, 26, name.length);
    local.set(name, 30);
    local.set(content, 30 + name.length);
    chunks.push(local);

    const directory = new Uint8Array(46 + name.length);
    const directoryView = new DataView(directory.buffer);
    write32(directoryView, 0, 0x02014b50);
    write16(directoryView, 4, 20);
    write16(directoryView, 6, 20);
    write32(directoryView, 16, checksum);
    write32(directoryView, 20, content.length);
    write32(directoryView, 24, content.length);
    write16(directoryView, 28, name.length);
    write32(directoryView, 42, offset);
    directory.set(name, 46);
    central.push(directory);
    offset += local.length;
  });

  const centralSize = central.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  write32(endView, 0, 0x06054b50);
  write16(endView, 8, files.length);
  write16(endView, 10, files.length);
  write32(endView, 12, centralSize);
  write32(endView, 16, offset);
  const size = [...chunks, ...central, end].reduce((sum, chunk) => sum + chunk.length, 0);
  const zip = new Uint8Array(size);
  let position = 0;
  [...chunks, ...central, end].forEach((chunk) => {
    zip.set(chunk, position);
    position += chunk.length;
  });
  return new Blob([zip.buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

function exportXlsx(orders: Order[]) {
  const rows = exportRows(orders);
  const headers = ["ID objednávky", "Dátum a čas", "Číslo stola", "Zákazník", "Produkty", "Celková cena", "Stav objednávky"];
  const escapeXml = (value: string) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
  const xmlRows = [
    headers,
    ...rows.map((row) => headers.map((header) => String(row[header as keyof typeof row])))
  ].map((row, index) => `<row r="${index + 1}">${row.map((cell, cellIndex) => `<c r="${String.fromCharCode(65 + cellIndex)}${index + 1}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`).join("")}</row>`).join("");

  const files = [
    { name: "[Content_Types].xml", content: "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/></Types>" },
    { name: "_rels/.rels", content: "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>" },
    { name: "xl/workbook.xml", content: "<?xml version=\"1.0\" encoding=\"UTF-8\"?><workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><sheets><sheet name=\"Objednávky\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>" },
    { name: "xl/_rels/workbook.xml.rels", content: "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/></Relationships>" },
    { name: "xl/worksheets/sheet1.xml", content: `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${xmlRows}</sheetData></worksheet>` }
  ];

  downloadBlob(createZip(files), exportFileName("xlsx"));
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderTab>("active");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [search, setSearch] = useState("");

  async function loadOrders() {
    const response = await api.get<Order[]>("/orders");
    setOrders(response.data);
  }

  useEffect(() => { loadOrders(); }, []);

  async function updateStatus(orderId: string, status: OrderStatus) {
    await api.put(`/orders/${orderId}/status`, { status });
    loadOrders();
  }

  const dateFilteredOrders = useMemo(() => orders.filter((order) => matchesDateFilter(order, dateFilter)), [orders, dateFilter]);
  const counts = useMemo(() => Object.fromEntries(tabs.map((tab) => [tab.id, dateFilteredOrders.filter((order) => matchesTab(order, tab.id)).length])) as Record<OrderTab, number>, [dateFilteredOrders]);
  const filteredOrders = useMemo(() => dateFilteredOrders.filter((order) => matchesTab(order, activeTab) && matchesSearch(order, search)), [activeTab, dateFilteredOrders, search]);
  const historyOrders = useMemo(() => orders.filter((order) => order.status === "COMPLETED" || order.status === "CANCELLED").slice(0, 12), [orders]);
  const dailyRevenue = useMemo(() => orders.filter((order) => matchesDateFilter(order, "today") && order.status !== "CANCELLED").reduce((sum, order) => sum + order.totalPrice, 0), [orders]);
  const averageOrderValue = filteredOrders.length ? filteredOrders.reduce((sum, order) => sum + order.totalPrice, 0) / filteredOrders.length : 0;

  return (
    <section className="order-management-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Reštauračný systém</p>
          <h1>Správa objednávok</h1>
        </div>
        <div className="export-actions">
          <span>Exportuje sa aktuálny výber: záložka, obdobie a vyhľadávanie. Počet: {filteredOrders.length}</span>
          <button onClick={() => exportXlsx(filteredOrders)}>Export Excel</button>
        </div>
      </div>

      <div className="order-kpis">
        <div><span>Dnešný obrat</span><strong>{dailyRevenue.toFixed(2)} €</strong></div>
        <div><span>Objednávky vo filtri</span><strong>{filteredOrders.length}</strong></div>
        <div><span>Priemerná hodnota</span><strong>{averageOrderValue.toFixed(2)} €</strong></div>
        <div><span>Aktívne teraz</span><strong>{orders.filter((order) => activeOrderStatuses.includes(order.status)).length}</strong></div>
      </div>

      <div className="order-toolbar">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Hľadať ID, e-mail alebo stôl" />
        <div className="segmented-control">
          {dateFilters.map((filter) => <button key={filter.id} className={dateFilter === filter.id ? "selected" : ""} onClick={() => setDateFilter(filter.id)}>{filter.label}</button>)}
        </div>
      </div>

      <div className="order-tabs">
        {tabs.map((tab) => (
          <button key={tab.id} className={activeTab === tab.id ? "selected" : ""} onClick={() => setActiveTab(tab.id)}>
            <span>{tab.label}</span>
            <strong>{counts[tab.id]}</strong>
          </button>
        ))}
      </div>

      <OrderTable orders={filteredOrders} onStatusChange={updateStatus} />

      <section className="order-history-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Order History</p>
            <h2>História objednávok</h2>
          </div>
          <span>Staršie objednávky ostávajú v databáze pre reporty, štatistiky a budúce AI odporúčania.</span>
        </div>
        <OrderTable orders={historyOrders} />
      </section>
    </section>
  );
}
