import { useState } from "react";

const API = "https://barbershop-api-vpz8.onrender.com/api/v1";

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
  redDim:     "rgba(239,68,68,0.10)",
  green:      "#22c55e",
  greenDim:   "rgba(34,197,94,0.10)",
};

function fmtPrice(p) {
  return `$${Number(p).toLocaleString("es-AR")}`;
}

function todayStr() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
}

// ── Lookup form ───────────────────────────────────────────────────────────────
function LookupForm({ onFound }) {
  const [wa,      setWa]      = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const search = async () => {
    const clean = wa.trim().replace(/\s/g, "");
    if (!clean) { setError("Ingresá tu número de WhatsApp"); return; }
    setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API}/appointments/by-whatsapp?wa=${encodeURIComponent(clean)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No encontrado");
      onFound(json, clean);
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
          BarberOS
        </p>
        <h1 style={{ color: C.text, fontSize: 22, fontWeight: 800,
                     textAlign: "center", margin: "0 0 8px" }}>
          Mi turno
        </h1>
        <p style={{ color: C.muted, fontSize: 13, textAlign: "center", margin: "0 0 28px" }}>
          Ingresá tu WhatsApp para ver tu reserva activa
        </p>

        <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 5 }}>
          Número de WhatsApp
        </label>
        <input
          type="tel"
          value={wa}
          placeholder="+549 11 1234-5678"
          onChange={e => setWa(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
          style={{
            width: "100%", boxSizing: "border-box",
            background: "#0a0a0a", border: `1.5px solid ${C.border}`,
            borderRadius: 10, padding: "13px 14px",
            color: C.text, fontSize: 15, outline: "none",
            marginBottom: 14,
          }}
        />

        {error && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ color: C.red, fontSize: 13, textAlign: "center", margin: "0 0 12px" }}>
              {error}
            </p>
            {error.includes("turno activo") && (
              <a href="/shop/mvzbarberia" style={{
                display: "block", textAlign: "center",
                background: `linear-gradient(135deg, #E8CC6A, #9A7B1E)`,
                borderRadius: 12, padding: "13px",
                color: "#000", fontWeight: 800, fontSize: 14,
                textDecoration: "none",
              }}>
                Reservar turno
              </a>
            )}
          </div>
        )}

        <button onClick={search} disabled={loading} style={{
          width: "100%", padding: 15,
          background: loading ? "#333" : `linear-gradient(135deg, #E8CC6A, #9A7B1E)`,
          border: "none", borderRadius: 12,
          color: loading ? C.muted : "#000",
          fontWeight: 800, fontSize: 14,
          cursor: loading ? "default" : "pointer",
        }}>
          {loading ? "Buscando..." : "Ver mi turno"}
        </button>
      </div>
    </div>
  );
}

// ── Appointment detail ────────────────────────────────────────────────────────
function AppointmentDetail({ appt: initialAppt, onBack }) {
  const [appt,           setAppt]           = useState(initialAppt);
  const [cancelState,    setCancelState]    = useState("idle"); // idle|askDni|confirming|loading|done|error
  const [cancelMsg,      setCancelMsg]      = useState("");
  const [cancelDni,      setCancelDni]      = useState("");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [reschedDni,     setReschedDni]     = useState("");
  const [reschedDate,    setReschedDate]    = useState(todayStr());
  const [reschedSlots,   setReschedSlots]   = useState([]);
  const [reschedLoading, setReschedLoading] = useState(false);
  const [reschedMsg,     setReschedMsg]     = useState("");

  const can_cancel     = appt.can_cancel;
  const can_reschedule = appt.can_reschedule;

  // ── Cancel ─────────────────────────────────────────────────────────────────
  const doCancel = async () => {
    setCancelState("loading");
    try {
      const res  = await fetch(`${API}/appointments/${appt.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni: cancelDni.replace(/\./g, "").trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || "Error");
      setCancelState("done");
      setCancelMsg("Turno cancelado. El slot quedó libre.");
    } catch (e) {
      setCancelState("error");
      setCancelMsg(e.message);
    }
  };

  // ── Reschedule ─────────────────────────────────────────────────────────────
  const loadReschedSlots = async (dateStr) => {
    setReschedLoading(true);
    try {
      const res  = await fetch(`${API}/appointments/day?barber_id=${appt.barber_id}&date=${dateStr}`);
      const json = await res.json();
      setReschedSlots((json.slots || []).filter(s => s.status === "available"));
    } catch { setReschedSlots([]); }
    finally  { setReschedLoading(false); }
  };

  const doReschedule = async (newSlotId) => {
    setReschedLoading(true); setReschedMsg("");
    try {
      const res  = await fetch(`${API}/appointments/${appt.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dni: reschedDni.replace(/\./g, "").trim(),
          new_slot_id: newSlotId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || "Error");
      setAppt(prev => ({ ...prev, ...json.appointment, can_cancel: true, can_reschedule: false }));
      setRescheduleOpen(false);
      setReschedMsg("¡Turno reprogramado!");
    } catch (e) {
      setReschedMsg(e.message);
    } finally {
      setReschedLoading(false);
    }
  };

  const rows = [
    ["Barbero",  appt.barber_name],
    ["Servicio", appt.service_name],
    ["Precio",   fmtPrice(appt.price)],
    ["Fecha",    appt.date],
    ["Hora",     appt.time],
  ];

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      padding: "32px 16px 60px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ width: "100%", maxWidth: 400, animation: "fadeUp .35s ease" }}>

        {/* Header */}
        <p style={{ color: C.muted, fontSize: 12, margin: "0 0 20px", cursor: "pointer" }}
           onClick={onBack}>
          ← Buscar otro
        </p>

        <p style={{ color: C.gold, fontSize: 11, fontWeight: 700,
                    letterSpacing: 3, textTransform: "uppercase", margin: "0 0 4px" }}>
          Tu turno
        </p>
        <h2 style={{ color: C.text, fontSize: 22, fontWeight: 800, margin: "0 0 20px" }}>
          {cancelState === "done" ? "Turno cancelado" : "Reserva activa"}
        </h2>

        {cancelState !== "done" && (
          <>
            {/* Booking code */}
            <div style={{
              background: C.goldDim, border: `1px solid ${C.goldBorder}`,
              borderRadius: 10, padding: "6px 18px", marginBottom: 20,
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ color: C.muted, fontSize: 11, fontWeight: 600 }}>Código</span>
              <span style={{ color: C.gold, fontSize: 18, fontWeight: 800, letterSpacing: 1 }}>
                {appt.booking_code || "—"}
              </span>
            </div>

            {/* QR */}
            <div style={{
              background: "#fff", borderRadius: 16, padding: 12,
              marginBottom: 12, display: "inline-block",
              boxShadow: "0 4px 24px rgba(212,175,55,0.15)",
            }}>
              <img
                src={`${API}/appointments/${appt.id}/qr`}
                alt="QR del turno"
                style={{ width: 180, height: 180, display: "block" }}
              />
            </div>

            {/* Download QR */}
            <div style={{ marginBottom: 24 }}>
              <a
                href={`${API}/appointments/${appt.id}/qr`}
                download={`turno-${appt.booking_code}.png`}
                style={{
                  color: C.muted, fontSize: 12, textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Descargar QR
              </a>
              <p style={{ color: C.muted, fontSize: 11, margin: "4px 0 0" }}>
                Mostrá este QR al barbero para verificar tu turno
              </p>
            </div>

            {/* Details */}
            <div style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: "14px 18px", width: "100%",
              boxSizing: "border-box", marginBottom: 20, textAlign: "left",
            }}>
              {rows.map(([k, v]) => (
                <div key={k} style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", padding: "7px 0",
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  <span style={{ color: C.muted, fontSize: 13 }}>{k}</span>
                  <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Cancel / Reschedule section */}
            {cancelState === "error" && (
              <p style={{ color: C.red, fontSize: 13, textAlign: "center", marginBottom: 12 }}>
                {cancelMsg}
              </p>
            )}

            {cancelState === "askDni" && (
              <div style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: 16, marginBottom: 16,
              }}>
                <p style={{ color: "#ccc", fontSize: 13, margin: "0 0 10px" }}>
                  Ingresá tu DNI para confirmar la cancelación:
                </p>
                <input
                  type="text" value={cancelDni} placeholder="Sin puntos, ej: 38123456"
                  onChange={e => setCancelDni(e.target.value)}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "#0a0a0a", border: `1.5px solid ${C.border}`,
                    borderRadius: 8, padding: "10px 12px",
                    color: C.text, fontSize: 14, outline: "none", marginBottom: 10,
                  }}
                />
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setCancelState("idle")} style={{
                    flex: 1, padding: "11px", background: "transparent",
                    border: `1px solid ${C.border}`, borderRadius: 10,
                    color: C.muted, fontSize: 13, cursor: "pointer",
                  }}>
                    Volver
                  </button>
                  <button onClick={doCancel} style={{
                    flex: 1, padding: "11px",
                    background: C.redDim, border: "1px solid rgba(239,68,68,0.4)",
                    borderRadius: 10, color: C.red,
                    fontWeight: 700, fontSize: 13, cursor: "pointer",
                  }}>
                    Confirmar cancelación
                  </button>
                </div>
              </div>
            )}

            {reschedMsg && (
              <p style={{ color: reschedMsg.includes("!") ? C.green : C.red,
                          fontSize: 13, textAlign: "center", marginBottom: 12 }}>
                {reschedMsg}
              </p>
            )}

            {cancelState === "idle" && (
              <div style={{ display: "flex", gap: 10, width: "100%", marginBottom: 16 }}>
                {can_cancel && (
                  <button onClick={() => setCancelState("askDni")} style={{
                    flex: 1, padding: "11px",
                    background: C.redDim, border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 10, color: C.red,
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}>
                    Cancelar turno
                  </button>
                )}
                {can_reschedule && !reschedMsg.includes("!") && (
                  <button onClick={() => { setRescheduleOpen(true); loadReschedSlots(reschedDate); }} style={{
                    flex: 1, padding: "11px",
                    background: C.goldDim, border: `1px solid ${C.goldBorder}`,
                    borderRadius: 10, color: C.gold,
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}>
                    Reprogramar
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {cancelState === "done" && (
          <div style={{
            background: C.greenDim, border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 14, padding: 20, textAlign: "center", marginBottom: 20,
          }}>
            <p style={{ color: C.green, fontWeight: 700, fontSize: 15, margin: "0 0 4px" }}>
              Cancelación confirmada
            </p>
            <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
              {cancelMsg}
            </p>
          </div>
        )}

        <a href="/shop/mvzbarberia" style={{
          display: "block", textAlign: "center",
          background: `linear-gradient(135deg, #E8CC6A, #9A7B1E)`,
          borderRadius: 12, padding: "14px",
          color: "#000", fontWeight: 800, fontSize: 14,
          textDecoration: "none",
        }}>
          {cancelState === "done" ? "Reservar nuevo turno" : "Reservar otro turno"}
        </a>
      </div>

      {/* Reschedule modal */}
      {rescheduleOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          zIndex: 100,
        }}>
          <div style={{
            background: "#111", borderRadius: "20px 20px 0 0",
            padding: "24px 20px 36px", width: "100%", maxWidth: 480,
            maxHeight: "80vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between",
                          alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: 0 }}>
                Reprogramar turno
              </h3>
              <button onClick={() => setRescheduleOpen(false)} style={{
                background: "transparent", border: "none",
                color: C.muted, fontSize: 22, cursor: "pointer",
              }}>×</button>
            </div>

            {/* DNI para reschedule */}
            <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 5 }}>
              DNI (para verificar identidad)
            </label>
            <input
              type="text" value={reschedDni} placeholder="Sin puntos, ej: 38123456"
              onChange={e => setReschedDni(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#0a0a0a", border: `1.5px solid ${C.border}`,
                borderRadius: 8, padding: "10px 12px",
                color: C.text, fontSize: 14, outline: "none", marginBottom: 14,
              }}
            />

            <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 5 }}>
              Elegir fecha
            </label>
            <input
              type="date" value={reschedDate}
              onChange={e => { setReschedDate(e.target.value); loadReschedSlots(e.target.value); }}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#0a0a0a", border: `1.5px solid ${C.border}`,
                borderRadius: 8, padding: "10px 12px",
                color: C.text, fontSize: 14, outline: "none", marginBottom: 16,
              }}
            />

            {reschedLoading ? (
              <p style={{ color: C.muted, textAlign: "center" }}>Cargando slots...</p>
            ) : reschedSlots.length === 0 ? (
              <p style={{ color: C.muted, textAlign: "center", fontSize: 13 }}>
                No hay horarios disponibles para este día
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {reschedSlots.map(s => (
                  <button key={s.id} onClick={() => doReschedule(s.id)} style={{
                    background: C.goldDim, border: `1px solid ${C.goldBorder}`,
                    borderRadius: 8, padding: "10px 16px",
                    color: C.gold, fontWeight: 700, fontSize: 14, cursor: "pointer",
                  }}>
                    {s.time}
                  </button>
                ))}
              </div>
            )}

            {reschedMsg && (
              <p style={{ color: C.red, fontSize: 13, marginTop: 12 }}>{reschedMsg}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function MiTurnoPage() {
  const [appt, setAppt] = useState(null);

  if (!appt) return <LookupForm onFound={(a) => setAppt(a)} />;
  return <AppointmentDetail appt={appt} onBack={() => setAppt(null)} />;
}
