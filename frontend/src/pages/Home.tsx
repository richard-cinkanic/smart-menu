import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section className="hero-section">
      <div className="hero-copy">
        <p className="eyebrow">QR objednávanie pre gastro prevádzky</p>
        <h1>SmartMenuAI</h1>
        <p>Digitálne menu, objednávanie od stola a odporúčania pre hostí reštaurácie alebo kaviarne.</p>
        <div className="hero-actions">
          <Link to="/menu" className="primary-action">Otvoriť menu</Link>
          <Link to="/admin/dashboard" className="secondary-action">Admin zóna</Link>
        </div>
      </div>
      <div className="service-panel">
        <div><span>Tok objednávky</span><strong>Naskenovať, vybrať, odoslať</strong></div>
        <div><span>Odporúčania</span><strong>Podľa menu a košíka</strong></div>
        <div><span>Prevádzka</span><strong>Produkty, stoly, objednávky</strong></div>
      </div>
    </section>
  );
}
