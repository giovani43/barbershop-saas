import { useState, useEffect } from "react";
import SplashScreen    from "./pages/SplashScreen";
import BookingFlow     from "./pages/BookingFlow";
import BarberDashboard from "./pages/BarberDashboard";
import AdminLogin      from "./pages/AdminLogin";
import AdminPanel      from "./pages/AdminPanel";
import TerminosPage    from "./pages/TerminosPage";

function getPath() {
  return window.location.pathname;
}

export default function App() {
  const [path, setPath] = useState(getPath());

  useEffect(() => {
    const handler = () => setPath(getPath());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  // Términos y condiciones
  if (path === "/terminos") return <TerminosPage />;

  // Legacy barber dashboard
  if (path === "/dashboard") return <BarberDashboard />;

  // Admin panel
  if (path.startsWith("/admin")) return <AdminRoute />;

  // Client booking flow — /shop/:shopSlug (barberSlug is handled inside BookingFlow)
  const shopMatch = path.match(/^\/shop\/([^/]+)/);
  if (shopMatch) return <BookingFlow shopSlug={shopMatch[1]} />;

  return <SplashWithNav />;
}

// ── Admin guard ───────────────────────────────────────────────────────────────
function AdminRoute() {
  const [token, setToken] = useState(() => localStorage.getItem("admin_token") || "");
  const [shop,  setShop]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("admin_shop") || "null"); }
    catch { return null; }
  });

  const handleLogin = (t, s) => { setToken(t); setShop(s); };
  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_shop");
    setToken(""); setShop(null);
  };

  if (!token || !shop) return <AdminLogin onLogin={handleLogin} />;
  return <AdminPanel token={token} shop={shop} onLogout={handleLogout} />;
}

// ── Splash + default shop ─────────────────────────────────────────────────────
function SplashWithNav() {
  const [entered, setEntered] = useState(false);
  if (!entered) return <SplashScreen onEnter={() => setEntered(true)} />;
  return <BookingFlow shopSlug="mvzbarberia" />;
}
