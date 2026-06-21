import { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

const API = "https://barbershop-api-vpz8.onrender.com/api/v1";

const C = {
  gold:       "#C9A84C",
  goldLight:  "#E8CC6A",
  goldDim:    "rgba(201,168,76,0.12)",
  goldBorder: "rgba(201,168,76,0.3)",
  bg:         "#0A0A0A",
  card:       "#111111",
  cardHigh:   "#1A1A1A",
  border:     "#222222",
  text:       "#FFFFFF",
  muted:      "#777777",
  red:        "#ef4444",
  green:      "#22c55e",
};

const STATUS_LABELS = {
  booked:      "Reservado",
  rescheduled: "Reprogramado",
  completed:   "Completado",
  cancelled:   "Cancelado",
  no_show:     "Ausente",
};

const STATUS_COLORS = {
  booked:      "#f59e0b",
  rescheduled: "#f59e0b",
  completed:   "#22c55e",
  cancelled:   "#ef4444",
  no_show:     "#ef4444",
};

function fmtPrice(p) {
  return `$${Number(p || 0).toLocaleString("es-AR")}`;
}

function fmtDateShort(iso) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

// ── Período selector ─────────────────────────────────────────────────────────
function PeriodSelector({ days, setDays }) {
  const options = [
    { label: "7 días",  value: 7 },
    { label: "30 días", value: 30 },
    { label: "90 días", value: 90 },
  ];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => setDays(opt.value)}
          style={{
            flex: 1,
            background: days === opt.value ? C.goldDim : "transparent",
            border: `1px solid ${days === opt.value ? C.gold : C.border}`,
            borderRadius: 8, padding: "8px 10px",
            color: days === opt.value ? C.gold : C.muted,
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "0.05em",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ title, children, style }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "16px 14px", marginBottom: 16,
      ...style,
    }}>
      {title && (
        <p style={{
          color: C.gold, fontSize: 10, fontWeight: 700, margin: "0 0 12px",
          textTransform: "uppercase", letterSpacing: "0.15em",
          fontFamily: "'Inter', sans-serif",
        }}>
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

// ── Stat tile ────────────────────────────────────────────────────────────────
function StatTile({ label, value, color }) {
  return (
    <div style={{
      flex: 1, background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "14px 8px", textAlign: "center",
    }}>
      <p style={{
        color: color || C.text, fontSize: 17, fontWeight: 700, margin: "0 0 3px",
        fontFamily: "'Playfair Display', Georgia, serif",
      }}>{value}</p>
      <p style={{
        color: C.muted, fontSize: 9, margin: 0,
        textTransform: "uppercase", letterSpacing: "0.12em",
        fontFamily: "'Inter', sans-serif",
      }}>{label}</p>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AnalyticsView({ token, onClose }) {
  const [days,    setDays]    = useState(30);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API}/barber/me/analytics?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al cargar analytics");
      setData(json);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, days]);

  useEffect(() => { load(); }, [load]);

  const revenueData = (data?.revenue_by_day || []).map(r => ({
    ...r,
    label: fmtDateShort(r.date),
  }));

  const statusData = (data?.status_breakdown || []).map(s => ({
    name:  STATUS_LABELS[s.status] || s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || C.muted,
  }));

  const hourlyData = (data?.hourly_load || []).map(h => ({
    hour:  `${h.hour}h`,
    count: h.count,
  }));

  const weekdayData = (data?.weekday_load || []).map(w => ({
    name:  w.weekday.slice(0, 3),
    count: w.count,
  }));

  const totals = data?.totals;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: C.bg, overflowY: "auto",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.goldBorder}`,
        padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div>
          <p style={{
            color: C.gold, fontSize: 9, fontWeight: 700,
            letterSpacing: "0.25em", textTransform: "uppercase", margin: 0,
          }}>
            Panel Barbero
          </p>
          <p style={{
            color: C.text, fontSize: 17, fontWeight: 600, margin: 0,
            fontFamily: "'Playfair Display', Georgia, serif",
          }}>
            Analytics
          </p>
        </div>
        <button onClick={onClose} style={{
          background: "transparent", border: `1px solid ${C.border}`,
          borderRadius: 8, padding: "8px 14px",
          color: C.muted, fontSize: 11, cursor: "pointer",
        }}>
          Cerrar
        </button>
      </div>

      <div style={{ padding: "20px 16px", maxWidth: 1100, margin: "0 auto" }}>
        <PeriodSelector days={days} setDays={setDays} />

        {loading && (
          <p style={{ color: C.muted, textAlign: "center" }}>Cargando...</p>
        )}

        {error && (
          <p style={{ color: C.red, textAlign: "center" }}>{error}</p>
        )}

        {!loading && !error && data && (
          <>
            {/* Stats overview */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <StatTile label="Ingresos"        value={fmtPrice(totals.total_revenue)} color={C.green} />
              <StatTile label="Completados"     value={totals.total_completed}         color={C.gold} />
              <StatTile label="Ausencias"       value={totals.total_no_show}           color={C.red} />
              <StatTile label="Tasa No-Show"    value={`${totals.no_show_rate}%`}      color={C.red} />
            </div>

            {/* Revenue over time */}
            <Card title={`Ingresos por día (últimos ${days} días)`}>
              {revenueData.length === 0 ? (
                <p style={{ color: C.muted, fontSize: 13, textAlign: "center", margin: "20px 0" }}>
                  Sin turnos completados en este período
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={revenueData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" stroke={C.muted} fontSize={11} />
                    <YAxis stroke={C.muted} fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: C.cardHigh, border: `1px solid ${C.goldBorder}`, borderRadius: 8 }}
                      labelStyle={{ color: C.gold }}
                      formatter={(value, name) => name === "revenue" ? [fmtPrice(value), "Ingresos"] : [value, "Turnos"]}
                    />
                    <Line type="monotone" dataKey="revenue" stroke={C.gold} strokeWidth={2} dot={{ r: 3, fill: C.gold }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Status breakdown + Weekday load */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Card title="Distribución por estado" style={{ flex: "1 1 280px" }}>
                {statusData.length === 0 ? (
                  <p style={{ color: C.muted, fontSize: 13, textAlign: "center", margin: "20px 0" }}>
                    Sin datos en este período
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={statusData} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" outerRadius={75} label={({ value }) => value}
                        labelLine={false}
                      >
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke={C.bg} strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: C.cardHigh, border: `1px solid ${C.goldBorder}`, borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 11, color: C.muted }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card title="Turnos por día de semana" style={{ flex: "1 1 280px" }}>
                {weekdayData.length === 0 ? (
                  <p style={{ color: C.muted, fontSize: 13, textAlign: "center", margin: "20px 0" }}>
                    Sin datos en este período
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={weekdayData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke={C.muted} fontSize={11} />
                      <YAxis stroke={C.muted} fontSize={11} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: C.cardHigh, border: `1px solid ${C.goldBorder}`, borderRadius: 8 }} />
                      <Bar dataKey="count" fill={C.gold} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            {/* Hourly load */}
            <Card title="Ocupación por horario">
              {hourlyData.length === 0 ? (
                <p style={{ color: C.muted, fontSize: 13, textAlign: "center", margin: "20px 0" }}>
                  Sin datos en este período
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={hourlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="hour" stroke={C.muted} fontSize={11} />
                    <YAxis stroke={C.muted} fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: C.cardHigh, border: `1px solid ${C.goldBorder}`, borderRadius: 8 }} />
                    <Bar dataKey="count" fill={C.goldLight} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Penalties collected */}
            {totals.total_penalties_collected > 0 && (
              <Card title="Multas por ausencia cobradas">
                <p style={{
                  color: C.green, fontSize: 24, fontWeight: 700, margin: 0,
                  fontFamily: "'Playfair Display', Georgia, serif", textAlign: "center",
                }}>
                  {fmtPrice(totals.total_penalties_collected)}
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
