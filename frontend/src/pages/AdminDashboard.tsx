import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Armchair } from "lucide-react";
import { api } from "../api/client";

type DashboardSummary = {
  dailyRevenue: number;
  dailyOrderCount: number;
  activeOrderCount: number;
  averageOrderValue: number;
  topProduct: { name: string; quantity: number } | null;
};

const emptySummary: DashboardSummary = {
  dailyRevenue: 0,
  dailyOrderCount: 0,
  activeOrderCount: 0,
  averageOrderValue: 0,
  topProduct: null
};

export default function AdminDashboard() {
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardSummary>("/orders/analytics/summary")
      .then((response) => setSummary(response.data))
      .catch(() => setSummary(emptySummary))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="admin-dashboard-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Prehľad prevádzky</p>
          <h1>Admin Dashboard</h1>
        </div>
        <p>Správa ponuky, objednávok a prevádzky na jednom mieste.</p>
      </div>

      <div className="dashboard-kpis">
        <div>
          <span>Dnešný obrat</span>
          <strong>{isLoading ? "..." : `${summary.dailyRevenue.toFixed(2)} €`}</strong>
        </div>
        <div>
          <span>Dnešné objednávky</span>
          <strong>{isLoading ? "..." : summary.dailyOrderCount}</strong>
        </div>
        <div>
          <span>Aktívne objednávky</span>
          <strong>{isLoading ? "..." : summary.activeOrderCount}</strong>
        </div>
        <div>
          <span>Priemerná hodnota</span>
          <strong>{isLoading ? "..." : `${summary.averageOrderValue.toFixed(2)} €`}</strong>
        </div>
        <div className="dashboard-kpi-wide">
          <span>Najpredávanejší produkt</span>
          <strong>{isLoading ? "..." : summary.topProduct?.name ?? "Zatiaľ bez dát"}</strong>
          {!isLoading && summary.topProduct && <small>{summary.topProduct.quantity} predaných kusov</small>}
        </div>
      </div>

      <div className="admin-grid">
        <Link to="/admin/products" className="admin-tile">
          <strong>Správa ponuky</strong>
          <span>Pridávajte, upravujte a skrývajte produkty.</span>
        </Link>
        <Link to="/admin/orders" className="admin-tile">
          <strong>Správa objednávok</strong>
          <span>Sledujte objednávky a meníte ich stav.</span>
        </Link>
        <Link to="/admin/tables" className="admin-tile admin-tile-with-icon">
          <Armchair size={24} />
          <strong>Stoly a QR kódy</strong>
          <span>Vytvárajte QR kódy pre jednotlivé stoly.</span>
        </Link>
      </div>
    </section>
  );
}
