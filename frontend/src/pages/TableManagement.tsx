import { Armchair, Copy, Download, Plus, QrCode, RefreshCw, Save, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { RestaurantTable } from "../types";

export default function TableManagement() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableUrl, setNewTableUrl] = useState("");
  const [editingNumbers, setEditingNumbers] = useState<Record<string, string>>({});
  const [editingUrls, setEditingUrls] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const sortedTables = useMemo(() => [...tables].sort((a, b) => a.number - b.number), [tables]);

  async function loadTables() {
    const response = await api.get<RestaurantTable[]>("/tables");
    setTables(response.data);
    setEditingNumbers(Object.fromEntries(response.data.map((table) => [table.id, String(table.number)])));
    setEditingUrls(Object.fromEntries(response.data.map((table) => [table.id, table.qrTargetUrl ?? ""])));
  }

  useEffect(() => { loadTables(); }, []);

  function showMessage(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2200);
  }

  async function createTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const number = Number(newTableNumber);
    if (!Number.isInteger(number) || number <= 0) {
      showMessage("Zadajte platné číslo stola.");
      return;
    }
    await api.post("/tables", { number, qrTargetUrl: newTableUrl });
    setNewTableNumber("");
    setNewTableUrl("");
    showMessage(`Stôl č. ${number} bol pridaný.`);
    loadTables();
  }

  async function updateTable(table: RestaurantTable) {
    const number = Number(editingNumbers[table.id]);
    if (!Number.isInteger(number) || number <= 0) {
      showMessage("Číslo stola musí byť väčšie ako 0.");
      return;
    }
    await api.put(`/tables/${table.id}`, { number, qrTargetUrl: editingUrls[table.id] ?? "" });
    showMessage(`Stôl č. ${number} bol uložený.`);
    loadTables();
  }

  async function regenerateQr(table: RestaurantTable) {
    await api.post(`/tables/${table.id}/regenerate-qr`);
    showMessage(`QR kód pre stôl č. ${table.number} bol obnovený.`);
    loadTables();
  }

  async function deleteTable(table: RestaurantTable) {
    if (!window.confirm(`Naozaj chcete vymazať stôl č. ${table.number}? Staršie objednávky zostanú uložené bez väzby na tento stôl.`)) return;
    await api.delete(`/tables/${table.id}`);
    showMessage(`Stôl č. ${table.number} bol vymazaný.`);
    loadTables();
  }

  async function copyUrl(table: RestaurantTable) {
    await navigator.clipboard.writeText(table.menuUrl);
    showMessage(`Link pre stôl č. ${table.number} bol skopírovaný.`);
  }

  function downloadQr(table: RestaurantTable) {
    const link = document.createElement("a");
    link.href = table.qrCode;
    link.download = `stol-${table.number}-qr.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <section className="table-management-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">QR objednávanie</p>
          <h1>Správa stolov</h1>
        </div>
        <p>Vytvárajte QR kódy, ktoré zákazníka privedú priamo na menu pre konkrétny stôl.</p>
      </div>

      <div className="table-admin-summary">
        <div>
          <Armchair size={24} />
          <span>Počet stolov</span>
          <strong>{tables.length}</strong>
        </div>
        <form onSubmit={createTable} className="table-create-form">
          <label htmlFor="new-table-number">Nový stôl</label>
          <input
            id="new-table-number"
            value={newTableNumber}
            onChange={(event) => setNewTableNumber(event.target.value)}
            inputMode="numeric"
            placeholder="Číslo stola"
          />
          <input
            value={newTableUrl}
            onChange={(event) => setNewTableUrl(event.target.value)}
            placeholder="Vlastná QR URL voliteľné"
          />
          <button type="submit"><Plus size={18} /> Pridať stôl</button>
        </form>
      </div>

      {message && <p className="notice">{message}</p>}

      <div className="table-card-grid">
        {sortedTables.map((table) => (
          <article key={table.id} className="table-admin-card">
            <div className="table-card-heading">
              <div>
                <Armchair size={22} />
                <strong>Stôl č. {table.number}</strong>
              </div>
              <span><QrCode size={16} /> QR aktívny</span>
            </div>

            <div className="table-qr-preview">
              <img src={table.qrCode} alt={`QR kód pre stôl ${table.number}`} />
            </div>

            <label className="table-number-field">
              Číslo stola
              <input
                value={editingNumbers[table.id] ?? String(table.number)}
                onChange={(event) => setEditingNumbers((current) => ({ ...current, [table.id]: event.target.value }))}
                inputMode="numeric"
              />
            </label>

            <label className="table-number-field">
              QR URL
              <input
                value={editingUrls[table.id] ?? ""}
                onChange={(event) => setEditingUrls((current) => ({ ...current, [table.id]: event.target.value }))}
                placeholder={table.menuUrl}
              />
            </label>

            <div className="table-url-box">
              <span>Aktuálna URL v QR kóde</span>
              <code>{table.menuUrl}</code>
            </div>

            <div className="table-card-actions">
              <button type="button" onClick={() => updateTable(table)}><Save size={16} /> Uložiť</button>
              <button type="button" className="secondary-action" onClick={() => copyUrl(table)}><Copy size={16} /> Kopírovať URL</button>
              <button type="button" className="secondary-action" onClick={() => downloadQr(table)}><Download size={16} /> Stiahnuť QR</button>
              <button type="button" className="secondary-action" onClick={() => regenerateQr(table)}><RefreshCw size={16} /> Regenerovať</button>
              <button type="button" className="danger-button" onClick={() => deleteTable(table)}><Trash2 size={16} /> Vymazať</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
