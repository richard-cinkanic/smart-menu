import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { clearAuthToken, isAdminAuthenticated } from "../utils/authStorage";

const guestLinks = [
  { to: "/", label: "Menu" },
  { to: "/cart", label: "Košík" }
];

const adminLinks = [
  { to: "/admin/dashboard", label: "Prehľad" },
  { to: "/admin/products", label: "Produkty" },
  { to: "/admin/orders", label: "Objednávky" },
  { to: "/admin/tables", label: "Stoly" },
  { to: "/?preview=admin", label: "Zobraziť menu" }
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminArea = location.pathname.startsWith("/admin");
  const isAuthPage = location.pathname === "/admin/login";
  const isAuthenticated = isAdminAuthenticated();
  const isAdminPreview = new URLSearchParams(location.search).get("preview") === "admin";
  const isGuestSubpage = !isAdminArea && (isAdminPreview || (location.pathname !== "/" && location.pathname !== "/menu"));
  const previewGuestLinks = guestLinks.map((link) => ({
    ...link,
    to: link.to === "/" ? "/?preview=admin" : `${link.to}?preview=admin`
  }));
  const links = isAuthPage || (isAdminArea && !isAuthenticated) ? [] : isAdminArea ? adminLinks : isAdminPreview ? previewGuestLinks : guestLinks;
  const brandTarget = isAdminPreview ? "/admin/dashboard" : "/";
  const brandText = isAdminPreview ? "← Admin" : isGuestSubpage ? "← Menu" : "Café SmartMenu"; 
  const [tableNumber, setTableNumber] = useState(() => localStorage.getItem("smartmenuai_table_number") ?? "7");

  function logout() {
    clearAuthToken();
    navigate("/admin/login", { replace: true });
  }

  useEffect(() => {
    const refreshTable = () => setTableNumber(localStorage.getItem("smartmenuai_table_number") ?? "7");
    window.addEventListener("smartmenuai-table-updated", refreshTable);
    window.addEventListener("storage", refreshTable);
    return () => {
      window.removeEventListener("smartmenuai-table-updated", refreshTable);
      window.removeEventListener("storage", refreshTable);
    };
  }, []);

  return (
    <header className={isAdminArea ? "topbar admin-topbar" : "topbar guest-topbar"}>
      <NavLink to={brandTarget} className={isGuestSubpage ? "brand back-to-menu" : "brand"}>{brandText}</NavLink>
      <nav className="nav-links" aria-label="Hlavná navigácia">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => isActive ? "active" : undefined}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      {!isAdminArea && (
        <div className="table-badge">
          <span>Stôl č.</span>
          <strong>{tableNumber}</strong>
        </div>
      )}
      {isAdminArea && !isAuthPage && isAuthenticated && (
        <div className="auth-links">
          <button type="button" className="secondary-action" onClick={logout}>Odhlásiť sa</button>
        </div>
      )}
    </header>
  );
}
