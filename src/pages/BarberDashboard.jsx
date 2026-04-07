import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { RefreshCw, Download, Search, Wifi, WifiOff, Users, CalendarCheck, XCircle, DollarSign, Scissors } from "lucide-react";

const API_BASE = "https://web-production-d26db.up.railway.app/api/v1";
const BARBER_ID = "e6f0681a-9724-4425-9f5e-1ee188899e02";
const REFRESH_INTERVAL_MS = 30_000;

function StatusBadge({ status }) {
  const styles = {
    booked:    { bg: "#0f1f0f", border: "#265226", color: "#4ade80", label: "Reservado" },
    cancelled: { bg: "#1f0f0f", border: "#522020", color: "#e05252", label: "Cancelado" },
    completed: { bg: "#1f180a", border: "#52350a", color: "#f0a030", label: "Completado" },
  };
  const s = styles[status] || styles.booked;
  return (
    <span style={{
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
    }}>{s.label}</span>
  );
}

function Avatar({ name }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div style={{
      width: 30, height: 30, borderRadius: "50%",
      background: "#1a1f2e", border: "1px solid #253050",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, color: "#7baee8", flexShrink: 0,
    }}>{initials}</div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: "#111", border: "1px solid #1e1e1e",
      borderRadius: 14, padding: "14px 16px", flex: 1, minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Icon size={14} color="#444" />
        <span style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

export default function BarberDashboard() {
  const [reservations, setReservations] = useState([]);
  const [stats, setStats]               = useState({});
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [query, setQuery]               = useState("");
  const [isOnline, setIsOnline]         = useState(true);
  const [lastRefresh, setLastRefresh]   = useState(null);
  const [newIds, setNewIds]             = useState(new Set());

  const fetchDashboard = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res   = await fetch(`${API_BASE}/barber/dashboard?barber_id=${BARBER_ID}&date=${today}`);
      if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);
      const data = await res.json();

      setReservations(prev => {
        const prevIds  = new Set(prev.map(r => r.id));
        const incoming = data.reservations || [];
        const freshIds = incoming.filter(r => !prevIds.has(r.id)).map(r => r.id);
        if (freshIds.length > 0) {
          setNewIds(new Set(freshIds));
          setTimeout(() => setNewIds(new Set()), 2000);
        }
        return incoming;
      });

      setStats(data.stats || {});
      setIsOnline(true);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message);
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(true);
    const interval = setInterval(() => fetchDashboard(false), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const filtered = reservations.filter(r => {
    const q = query.toLowerCase();
    return r.nombre.toLowerCase().includes(q) || r.dni.includes(q);
  });

  const exportXLSX = () => {
    const rows = filtered.map(r => ({
      "Nombre": r.nombre, "DNI": r.dni, "WhatsApp": r.whatsapp,
      "Fecha": r.fecha, "Hora": r.hora,
      "Servicio": r.service_name, "Estado": r.status, "Precio": r.price,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 25 }, { wch: 14 }, { wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 18 }, { wch: 12 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reservas");
    XLSX.writeFile(wb, `reservas-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0c0c0c", color: "#e8e8e8",
      fontFamily: "'DM Sans', system-ui, sans-serif", padding: "24px 20px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11, background: "#D4AF37",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Scissors size={18} color="#0c0c0c" />
          </div>
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 400, color: "#f0f0f0", margin: 0 }}>
              Panel de Control
            </h1>
            <p style={{ fontSize: 10, color: "#555", letterSpacing: "0.06em", margin: "2px 0 0" }}>
              BARBERÍA DON PELADO
            </p>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "#141414", border: "1px solid #222",
          borderRadius: 20, padding: "5px 14px",
          fontSize: 11, color: isOnline ? "#4ade80" : "#e05252",
        }}>
          {isOnline ? <><Wifi size={11} /><span>En vivo</span></> : <><WifiOff size={11} /><span>Sin conexión</span></>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard icon={CalendarCheck} label="Reservas"   value={stats.booked    ?? 0} color="#4ade80" />
        <StatCard icon={Users}         label="Total"      value={stats.total     ?? 0} color="#D4AF37" />
        <StatCard icon={XCircle}       label="Canceladas" value={stats.cancelled ?? 0} color="#e05252" />
        <StatCard icon={DollarSign}    label="Ingresos"   value={`$${(((stats.revenue ?? 0) / 1000)).toFixed(1)}k`} color="#7baee8" />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={13} color="#444" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nombre o DNI..."
            style={{
              width: "100%", background: "#111", border: "1px solid #222",
              borderRadius: 10, padding: "9px 14px 9px 36px",
              color: "#e8e8e8", fontSize: 13, outline: "none",
              fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
        </div>
        <button onClick={() => fetchDashboard(false)} style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "#111", border: "1px solid #222", borderRadius: 10,
          padding: "9px 16px", color: "#aaa", fontSize: 12,
          fontFamily: "inherit", cursor: "pointer",
        }}>
          <RefreshCw size={13} />Actualizar
        </button>
        <button onClick={exportXLSX} style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "#D4AF37", border: "none", borderRadius: 10,
          padding: "9px 16px", color: "#0c0c0c", fontSize: 12,
          fontFamily: "inherit", cursor: "pointer", fontWeight: 700,
        }}>
          <Download size={13} />Descargar .xlsx
        </button>
      </div>

      {error && (
        <div style={{
          background: "#1f0f0f", border: "1px solid #522020",
          borderRadius: 12, padding: "12px 16px", marginBottom: 16, color: "#e05252", fontSize: 13,
        }}>⚠ {error}</div>
      )}

      <div style={{ border: "1px solid #1e1e1e", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#111", borderBottom: "1px solid #1e1e1e" }}>
                {["Cliente", "DNI", "WhatsApp", "Fecha", "Hora", "Servicio", "Estado"].map(h => (
                  <th key={h} style={{
                    padding: "11px 14px", textAlign: "left",
                    fontSize: 10, color: "#555", textTransform: "uppercase",
                    letterSpacing: "0.08em", fontWeight: 500,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#444" }}>Cargando...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#444" }}>No hay reservas para hoy.</td></tr>
              )}
              {!loading && filtered.map(r => (
                <tr key={r.id} style={{
                  borderBottom: "1px solid #141414",
                  background: newIds.has(r.id) ? "#1a2010" : "transparent",
                  transition: "background 0.5s ease",
                }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={r.nombre} />
                      <span style={{ color: "#f0f0f0", fontWeight: 500 }}>{r.nombre}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: "#888" }}>{r.dni}</td>
                  <td style={{ padding: "12px 14px", color: "#7baee8" }}>{r.whatsapp}</td>
                  <td style={{ padding: "12px 14px", color: "#aaa" }}>{r.fecha}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontWeight: 700, color: "#f0f0f0" }}>{r.hora}</span>
                    <span style={{ color: "#555" }}> hs</span>
                  </td>
                  <td style={{ padding: "12px 14px", color: "#aaa", fontSize: 12 }}>{r.service_name}</td>
                  <td style={{ padding: "12px 14px" }}><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
        <span style={{ fontSize: 12, color: "#555" }}>
          {filtered.length} de {reservations.length} reservas
        </span>
        {lastRefresh && (
          <span style={{ fontSize: 11, color: "#333" }}>
            Último refresh: {lastRefresh.toLocaleTimeString("es-AR")} · Auto 30s
          </span>
        )}
      </div>
    </div>
  );
}