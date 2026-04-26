import { useState, useEffect } from "react";

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
  green:      "#22c55e",
  greenDim:   "rgba(34,197,94,0.12)",
};

const STATUS_VALID = ["booked", "rescheduled"];

function statusLabel(s) {
  const map = {
    booked:      "Confirmado",
    rescheduled: "Reprogramado",
    cancelled:   "Cancelado",
    completed:   "Ya completado",
    available:   "No reservado",
    no_show:     "No se presentó",
  };
  return map[s] || s;
}

function fmtPrice(p) {
  return `$${Number(p).toLocaleString("es-AR")}`;
}

export default function VerifyPage({ token }) {
  const [appt,    setAppt]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);
  const [marking, setMarking] = useState(false);

  const hasBarberToken = !!localStorage.getItem("barber_token");

  useEffect(() => {
    fetch(`${API}/appointments/by-token/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setAppt(data);
      })
      .catch(() => setError("No se pudo conectar con el servidor"))
      .finally(() => setLoading(false));
  }, [token]);

  const markComplete = async () => {
    setMarking(true);
    try {
      const res  = await fetch(`${API}/appointments/by-token/${token}/complete`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setMarking(false);
    }
  };

  const isValid = appt && STATUS_VALID.includes(appt.status);

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      padding: 16,
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: 28,
      }}>
        <p style={{ color: C.gold, fontSize: 11, fontWeight: 700,
                    letterSpacing: 3, textTransform: "uppercase",
                    textAlign: "center", margin: "0 0 4px" }}>
          Verificación de turno
        </p>
        <h1 style={{ color: C.text, fontSize: 22, fontWeight: 800,
                     textAlign: "center", margin: "0 0 24px" }}>
          BarberOS
        </h1>

        {loading && (
          <p style={{ color: C.muted, textAlign: "center", fontSize: 14 }}>
            Verificando...
          </p>
        )}

        {!loading && error && !appt && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 12, padding: 16, textAlign: "center",
          }}>
            <p style={{ color: C.red, fontWeight: 700, fontSize: 16, margin: "0 0 4px" }}>
              QR Invalido
            </p>
            <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        {appt && !done && (
          <>
            {/* Estado badge */}
            <div style={{
              background: isValid ? C.greenDim : "rgba(239,68,68,0.1)",
              border:     `1px solid ${isValid ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.3)"}`,
              borderRadius: 10, padding: "8px 16px",
              textAlign: "center", marginBottom: 20,
            }}>
              <span style={{
                color: isValid ? C.green : C.red,
                fontWeight: 700, fontSize: 15,
              }}>
                {isValid ? "Turno valido" : "Turno invalido"} — {statusLabel(appt.status)}
              </span>
            </div>

            {/* Datos del turno */}
            <div style={{
              background: "#0a0a0a", border: `1px solid ${C.border}`,
              borderRadius: 14, padding: "14px 18px", marginBottom: 20,
            }}>
              {[
                ["Cliente",  appt.client_name || "—"],
                ["Barbero",  appt.barber_name],
                ["Servicio", appt.service_name],
                ["Precio",   fmtPrice(appt.price)],
                ["Fecha",    appt.date],
                ["Hora",     appt.time],
                ["Codigo",   appt.booking_code || "—"],
              ].map(([k, v]) => (
                <div key={k} style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", padding: "7px 0",
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  <span style={{ color: C.muted, fontSize: 13 }}>{k}</span>
                  <span style={{ color: C.text,  fontSize: 13, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>

            {error && (
              <p style={{ color: C.red, fontSize: 13, textAlign: "center", marginBottom: 12 }}>
                {error}
              </p>
            )}

            {isValid && hasBarberToken && (
              <button
                onClick={markComplete}
                disabled={marking}
                style={{
                  width: "100%", padding: 15,
                  background: marking ? "#333" : `linear-gradient(135deg, #22c55e, #16a34a)`,
                  border: "none", borderRadius: 12,
                  color: marking ? C.muted : "#fff",
                  fontWeight: 800, fontSize: 15,
                  cursor: marking ? "default" : "pointer",
                  letterSpacing: 0.5,
                }}
              >
                {marking ? "Marcando..." : "Marcar como presente"}
              </button>
            )}

            {isValid && !hasBarberToken && (
              <div style={{
                background: C.goldDim, border: `1px solid ${C.goldBorder}`,
                borderRadius: 12, padding: "14px 18px", textAlign: "center",
              }}>
                <p style={{ color: C.gold, fontSize: 13, fontWeight: 600, margin: 0 }}>
                  Escaneá este QR desde el dashboard del barbero para confirmar presencia
                </p>
              </div>
            )}
          </>
        )}

        {done && (
          <div style={{
            background: C.greenDim, border: "1px solid rgba(34,197,94,0.4)",
            borderRadius: 14, padding: 24, textAlign: "center",
          }}>
            <p style={{ color: C.green, fontSize: 28, margin: "0 0 8px" }}>✓</p>
            <p style={{ color: C.green, fontWeight: 700, fontSize: 17, margin: "0 0 4px" }}>
              Presencia confirmada
            </p>
            <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
              El turno fue marcado como completado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
