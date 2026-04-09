import { useState, useEffect, useCallback } from "react";

const API = "https://web-production-d26db.up.railway.app/api/v1";

const C = {
  gold:       "#D4AF37",
  goldDim:    "rgba(212,175,55,0.12)",
  goldBorder: "rgba(212,175,55,0.35)",
  bg:         "#080808",
  card:       "#0f0f0f",
  border:     "#1e1e1e",
  text:       "#f0f0f0",
  muted:      "#666666",
  red:        "#ef4444",
  redDim:     "rgba(239,68,68,0.1)",
  green:      "#22c55e",
  greenDim:   "rgba(34,197,94,0.1)",
};

const STATUS = {
  booked:      { label: "Reservado",    color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  rescheduled: { label: "Reprogramado", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  available:   { label: "Disponible",   color: "#555",    bg: "transparent" },
  cancelled:   { label: "Cancelado",    color: C.red,     bg: C.redDim },
  completed:   { label: "Completado",   color: C.muted,   bg: "transparent" },
  no_show:     { label: "Ausente",      color: "#f97316", bg: "rgba(249,115,22,0.1)" },
};

function fmtPrice(p) {
  return `$${Number(p).toLocaleString("es-AR")}`;
}

function todayAR() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
}

// ── Login screen ──────────────────────────────────────────────────────────────
function BarberLogin({ onLogin }) {
  const [slug,     setSlug]     = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API}/barber/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ slug: slug.trim().toLowerCase(), password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      localStorage.setItem("barber_token",  json.token);
      localStorage.setItem("barber_data",   JSON.stringify(json.barber));
      onLogin(json.token, json.barber);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      padding: 16,
    }}>
      <div style={{
        width: "100%", maxWidth: 380,
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: 32,
      }}>
        <p style={{ color: C.gold, fontSize: 11, fontWeight: 700,
                    letterSpacing: 3, textTransform: "uppercase",
                    textAlign: "center", margin: "0 0 4px" }}>
          Panel Barbero
        </p>
        <h1 style={{ color: C.text, fontSize: 22, fontWeight: 800,
                     textAlign: "center", margin: "0 0 28px" }}>
          BarberOS
        </h1>

        {[
          { label: "Tu usuario (slug)", value: slug, set: setSlug, type: "text", ph: "ej: juan-perez" },
          { label: "Contraseña",        value: password, set: setPassword, type: "password", ph: "••••••••" },
        ].map(({ label, value, set, type, ph }) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 5 }}>
              {label}
            </label>
            <input
              type={type} value={value} placeholder={ph}
              onChange={e => set(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#0a0a0a", border: `1.5px solid ${C.border}`,
                borderRadius: 10, padding: "13px 14px",
                color: C.text, fontSize: 15, outline: "none",
              }}
            />
          </div>
        ))}

        {error && (
          <p style={{ color: C.red, fontSize: 13, textAlign: "center", marginBottom: 12 }}>
            {error}
          </p>
        )}

        <button onClick={submit} disabled={loading} style={{
          width: "100%", padding: 15,
          background: loading ? "#333" : `linear-gradient(135deg, #E8CC6A, #9A7B1E)`,
          border: "none", borderRadius: 12,
          color: loading ? C.muted : "#000",
          fontWeight: 800, fontSize: 14, cursor: loading ? "default" : "pointer",
        }}>
          {loading ? "Entrando..." : "Ingresar"}
        </button>
      </div>
    </div>
  );
}

// ── Time slots for block picker ───────────────────────────────────────────────
const TIME_SLOTS = Array.from({ length: 22 }, (_, i) => {
  const h = 9 + Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});
const REASONS = ["Descanso", "Feriado", "Personal", "Otro"];

// ── Dashboard screen ──────────────────────────────────────────────────────────
function BarberPanel({ token, barber, onLogout }) {
  const [slots,   setSlots]   = useState([]);
  const [date,    setDate]    = useState(todayAR());
  const [loading, setLoading] = useState(true);

  // Blocked slots state
  const [blocks,      setBlocks]      = useState([]);
  const [blockModal,  setBlockModal]  = useState(false);
  const [blockDate,   setBlockDate]   = useState(todayAR());
  const [blockAllDay, setBlockAllDay] = useState(false);
  const [blockTime,   setBlockTime]   = useState("09:00");
  const [blockReason, setBlockReason] = useState("Descanso");
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockErr,    setBlockErr]    = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/barber/me/day?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSlots(json.slots);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [token, date]);

  const loadBlocks = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/barber/blocked-slots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBlocks(await res.json());
    } catch {}
  }, [token]);

  const createBlock = async () => {
    setBlockSaving(true); setBlockErr("");
    try {
      const res  = await fetch(`${API}/barber/blocked-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          date:    blockDate,
          time:    blockAllDay ? null : blockTime,
          all_day: blockAllDay,
          reason:  blockReason,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al guardar");
      setBlockModal(false);
      loadBlocks();
    } catch (e) {
      setBlockErr(e.message);
    } finally {
      setBlockSaving(false);
    }
  };

  const removeBlock = async (id) => {
    try {
      await fetch(`${API}/barber/blocked-slots/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlocks(prev => prev.filter(b => b.id !== id));
    } catch {}
  };

  const chargeAbsence = async (slotId) => {
    if (!window.confirm("¿Registrar cargo por ausencia (30% del precio)?")) return;
    try {
      const res  = await fetch(`${API}/barber/appointments/${slotId}/charge-absence`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadBlocks(); }, [loadBlocks]);

  const booked    = slots.filter(s => ["booked","rescheduled"].includes(s.status));
  const available = slots.filter(s => s.status === "available").length;
  const revenue   = booked.reduce((acc, s) => acc + s.price, 0);

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      padding: "0 0 40px",
    }}>
      {/* Header */}
      <div style={{
        background: C.card, borderBottom: `1px solid ${C.border}`,
        padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ color: C.gold, fontSize: 10, fontWeight: 700,
                      letterSpacing: 3, textTransform: "uppercase", margin: 0 }}>
            Panel Barbero
          </p>
          <p style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: 0 }}>
            {barber.name}
          </p>
        </div>
        <button onClick={onLogout} style={{
          background: "transparent", border: `1px solid ${C.border}`,
          borderRadius: 8, padding: "6px 14px",
          color: C.muted, fontSize: 12, cursor: "pointer",
        }}>
          Salir
        </button>
      </div>

      <div style={{ padding: "20px 16px", maxWidth: 480, margin: "0 auto" }}>
        {/* Date picker */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="date" value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "10px 14px",
              color: C.text, fontSize: 14, outline: "none", width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Turnos", value: booked.length, color: C.gold },
            { label: "Libres",  value: available,     color: C.muted },
            { label: "Ganancia", value: fmtPrice(revenue), color: C.green },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              flex: 1, background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: "12px 10px", textAlign: "center",
            }}>
              <p style={{ color, fontSize: 18, fontWeight: 800, margin: "0 0 2px" }}>{value}</p>
              <p style={{ color: C.muted, fontSize: 10, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Slot list */}
        {loading ? (
          <p style={{ color: C.muted, textAlign: "center" }}>Cargando...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {slots.length === 0 && (
              <p style={{ color: C.muted, textAlign: "center", fontSize: 14 }}>
                No hay turnos para este día
              </p>
            )}
            {slots.map(slot => {
              const st = STATUS[slot.status] || STATUS.available;
              const hasClient = ["booked","rescheduled","no_show","cancelled"].includes(slot.status);
              const canCharge = slot.status === "no_show" && !slot.absence_charge_sent;
              return (
                <div key={slot.id} style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: "12px 16px",
                  opacity: slot.status === "available" ? 0.45 : 1,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ color: C.gold, fontWeight: 800, fontSize: 16, minWidth: 48 }}>
                        {slot.time}
                      </span>
                      <div>
                        {hasClient ? (
                          <>
                            <p style={{ color: C.text, fontWeight: 600, fontSize: 13, margin: 0 }}>
                              {slot.client_name || "Cliente"}
                            </p>
                            <p style={{ color: C.muted, fontSize: 12, margin: "2px 0 0" }}>
                              {slot.client_dni && <span style={{ marginRight: 6 }}>DNI {slot.client_dni} ·</span>}
                              {slot.service_name} · {fmtPrice(slot.price)}
                            </p>
                          </>
                        ) : (
                          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
                            {slot.status === "available" ? "Disponible" : slot.service_name || "—"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span style={{
                        background: st.bg, color: st.color,
                        borderRadius: 20, padding: "3px 10px",
                        fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                      }}>
                        {st.label}
                      </span>
                      {slot.absence_charge_sent && (
                        <span style={{ color: "#f97316", fontSize: 10, fontWeight: 600 }}>
                          Cargo: {fmtPrice(slot.absence_charge_amount)}
                        </span>
                      )}
                    </div>
                  </div>
                  {canCharge && (
                    <button
                      onClick={() => chargeAbsence(slot.id)}
                      style={{
                        marginTop: 10, width: "100%",
                        background: "rgba(249,115,22,0.12)",
                        border: "1px solid rgba(249,115,22,0.4)",
                        borderRadius: 8, padding: "8px 0",
                        color: "#f97316", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      Cobrar ausencia (30%)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Bloquear horarios ─────────────────────────────────────────────── */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: 0 }}>
              Bloquear horarios
            </p>
            <button
              onClick={() => { setBlockModal(true); setBlockErr(""); setBlockAllDay(false); setBlockDate(todayAR()); }}
              style={{
                background: C.goldDim, border: `1px solid ${C.goldBorder}`,
                borderRadius: 8, padding: "6px 14px",
                color: C.gold, fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >
              + Bloquear
            </button>
          </div>

          {blocks.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 12, textAlign: "center", padding: "10px 0" }}>
              No tenés horarios bloqueados
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {blocks.map(b => (
                <div key={b.id} style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: "10px 14px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <p style={{ color: C.text, fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>
                      {b.date} · {b.all_day ? "Todo el día" : (b.time || "").slice(0, 5)}
                    </p>
                    {b.reason && (
                      <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>{b.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeBlock(b.id)}
                    style={{
                      background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: 7, padding: "5px 12px",
                      color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Desbloquear
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal bloqueo ─────────────────────────────────────────────────────── */}
      {blockModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          zIndex: 200,
        }}>
          <div style={{
            background: "#141414", borderRadius: "20px 20px 0 0",
            width: "100%", maxWidth: 480,
            padding: "24px 20px 44px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: 0 }}>
                Bloquear horario
              </h3>
              <button onClick={() => setBlockModal(false)} style={{
                background: "none", border: "none", color: C.muted,
                fontSize: 24, cursor: "pointer", lineHeight: 1, padding: 4,
              }}>×</button>
            </div>

            {/* Fecha */}
            <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 5 }}>Fecha</label>
            <input
              type="date" value={blockDate} min={todayAR()}
              onChange={e => setBlockDate(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#0a0a0a", border: `1.5px solid ${C.border}`,
                borderRadius: 9, padding: "11px 12px",
                color: C.text, fontSize: 14, outline: "none", marginBottom: 14,
              }}
            />

            {/* Todo el día checkbox */}
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 14 }}>
              <div
                onClick={() => setBlockAllDay(v => !v)}
                style={{
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                  border: `2px solid ${blockAllDay ? C.gold : C.border}`,
                  background: blockAllDay ? C.gold : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all .15s",
                }}
              >
                {blockAllDay && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                       stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              <span style={{ color: C.text, fontSize: 14 }}>Todo el día</span>
            </label>

            {/* Horario (si no es todo el día) */}
            {!blockAllDay && (
              <>
                <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 5 }}>Horario</label>
                <select
                  value={blockTime}
                  onChange={e => setBlockTime(e.target.value)}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "#0a0a0a", border: `1.5px solid ${C.border}`,
                    borderRadius: 9, padding: "11px 12px",
                    color: C.text, fontSize: 14, outline: "none", marginBottom: 14,
                    appearance: "none",
                  }}
                >
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </>
            )}

            {/* Motivo */}
            <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 5 }}>Motivo</label>
            <select
              value={blockReason}
              onChange={e => setBlockReason(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#0a0a0a", border: `1.5px solid ${C.border}`,
                borderRadius: 9, padding: "11px 12px",
                color: C.text, fontSize: 14, outline: "none", marginBottom: 20,
                appearance: "none",
              }}
            >
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            {blockErr && (
              <p style={{ color: C.red, fontSize: 13, textAlign: "center", marginBottom: 12 }}>
                {blockErr}
              </p>
            )}

            <button
              onClick={createBlock}
              disabled={blockSaving}
              style={{
                width: "100%", padding: 15,
                background: blockSaving ? "#333" : `linear-gradient(135deg, #E8CC6A, #9A7B1E)`,
                border: "none", borderRadius: 12,
                color: blockSaving ? C.muted : "#000",
                fontWeight: 800, fontSize: 15, cursor: blockSaving ? "default" : "pointer",
              }}
            >
              {blockSaving ? "Guardando..." : "Confirmar bloqueo"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root: login guard ─────────────────────────────────────────────────────────
export default function BarberDashboard() {
  const [token,  setToken]  = useState(() => localStorage.getItem("barber_token") || "");
  const [barber, setBarber] = useState(() => {
    try { return JSON.parse(localStorage.getItem("barber_data") || "null"); }
    catch { return null; }
  });

  const handleLogin = (t, b) => { setToken(t); setBarber(b); };
  const handleLogout = () => {
    localStorage.removeItem("barber_token");
    localStorage.removeItem("barber_data");
    setToken(""); setBarber(null);
  };

  if (!token || !barber) return <BarberLogin onLogin={handleLogin} />;
  return <BarberPanel token={token} barber={barber} onLogout={handleLogout} />;
}
