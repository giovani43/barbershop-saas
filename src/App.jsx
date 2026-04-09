import { useState, useEffect } from "react";
import SplashScreen    from "./pages/SplashScreen";
import BookingFlow     from "./pages/BookingFlow";
import BarberDashboard from "./pages/BarberDashboard";
import AdminLogin      from "./pages/AdminLogin";
import AdminPanel      from "./pages/AdminPanel";
import TerminosPage    from "./pages/TerminosPage";
import VerifyPage      from "./pages/VerifyPage";
import MiTurnoPage     from "./pages/MiTurnoPage";

function getPath() {
  // Normalize: strip trailing slash (except root "/")
  const p = window.location.pathname;
  return p.length > 1 ? p.replace(/\/$/, "") : p;
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

  // Mi turno — consulta por WhatsApp
  if (path === "/mi-turno") return <MiTurnoPage />;

  // Barber dashboard — completely isolated from booking flow
  if (path.startsWith("/barber")) return <BarberDashboard />;

  // QR verify — público, antes del guard de admin
  const verifyMatch = path.match(/^\/admin\/verify\/([^/]+)/);
  if (verifyMatch) return <VerifyPage token={verifyMatch[1]} />;

  // Admin panel
  if (path.startsWith("/admin")) return <AdminRoute />;

  // Client booking flow — /shop/:shopSlug
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
  // mode=null → show SplashScreen; mode="book"|"misTurnos" → show BookingFlow
  const [mode, setMode] = useState(null);
  if (!mode) {
    return (
      <SplashScreen
        onEnter={() => setMode("book")}
        onMisTurnos={() => setMode("misTurnos")}
      />
    );
  }
  // startStep=0 to skip BookingFlow's internal SplashStep (we already showed SplashScreen)
  return (
    <BookingFlow
      shopSlug="mvzbarberia"
      startStep={0}
      startEntryMode={mode}
      onGoHome={() => setMode(null)}
    />
  );
}
