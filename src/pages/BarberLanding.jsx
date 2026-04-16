import { useState, useEffect } from "react";

const API_BASE = "https://web-production-d26db.up.railway.app/api/v1";

function getNextDays(n) {
  const days = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const labels = ["Hoy", "Manana"];
    days.push({
      value: `${yyyy}-${mm}-${dd}`,
      label: labels[i] || d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric" }),
    });
  }
  return days;
}

function BookingModal({ slot, onClose, onSuccess }) {
  const [form, setForm] = useState({ full_name: "", dni: "", whatsapp: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);

  const handleSubmit = async () => {
    if (!form.full_name.trim() || !form.dni.trim() || !form.whatsapp.trim()) { setError("Completa todos los campos."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/appointments/book`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: slot.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al reservar");
      onSuccess();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{
        background: "#0e0e0e", borderTop: "1px solid rgba(201,153,60,0.3)",
        padding: "32px 28px 44px", width: "100%", maxWidth: 480,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(60px)",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Montserrat:wght@300;400;600;700&display=swap');
          .field:focus { border-color: rgba(201,153,60,0.6) !important; background: rgba(201,153,60,0.04) !important; outline: none; }
          .field::placeholder { color: #555; }
        `}</style>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, color: "#c9993c", letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 8px" }}>
              Confirmar Turno
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, color: "#f5f0e8", margin: 0, fontWeight: 400 }}>
              {slot.time} hs
            </p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 10, color: "#888888", margin: "4px 0 0" }}>{slot.date}</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,153,60,0.2)", color: "#6a5030", borderRadius: 2, width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>x</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { name: "full_name", placeholder: "Nombre completo", type: "text" },
            { name: "dni", placeholder: "DNI (sin puntos)", type: "text" },
            { name: "whatsapp", placeholder: "WhatsApp (+549...)", type: "tel" },
          ].map(({ name, placeholder, type }) => (
            <input key={name} name={name} type={type} placeholder={placeholder} value={form[name]}
              onChange={e => setForm({ ...form, [e.target.name]: e.target.value })} className="field"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,153,60,0.15)", borderRadius: 2, padding: "14px 16px", color: "#f5f0e8", fontSize: 14, width: "100%", boxSizing: "border-box", fontFamily: "'Montserrat', sans-serif", transition: "all 0.3s ease" }} />
          ))}
        </div>

        {error && <p style={{ fontFamily: "'Montserrat', sans-serif", color: "#e05252", fontSize: 11, marginTop: 12, letterSpacing: "0.05em" }}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading} style={{
          marginTop: 20, width: "100%",
          background: loading ? "rgba(201,153,60,0.2)" : "linear-gradient(135deg, #c9993c, #a07820)",
          color: loading ? "#888888" : "#060606",
          border: "none", borderRadius: 2, padding: "16px 0",
          fontSize: 11, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "'Montserrat', sans-serif", letterSpacing: "0.2em", textTransform: "uppercase",
        }}>
          {loading ? "Reservando..." : "Confirmar Turno"}
        </button>

        <p style={{ fontFamily: "'Montserrat', sans-serif", color: "#666666", fontSize: 10, textAlign: "center", marginTop: 12, letterSpacing: "0.1em" }}>
          Sin contrasenas. Solo tu DNI.
        </p>
      </div>
    </div>
  );
}

function SuccessScreen({ onClose }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "#060606", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Montserrat:wght@300;400;600;700&display=swap');`}</style>
      <div style={{ opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.8)", transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: 32, color: "#4ade80" }}>
          OK
        </div>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, color: "#c9993c", letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>Reserva Confirmada</p>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 36, fontWeight: 300, color: "#f5f0e8", margin: "0 0 12px" }}>Turno confirmado!</h2>
        <p style={{ fontFamily: "'Montserrat', sans-serif", color: "#aaaaaa", fontSize: 12, margin: "0 0 40px", lineHeight: 1.7, letterSpacing: "0.03em" }}>Te esperamos. Podes cancelar con mas de 90 min de anticipacion.</p>
        <button onClick={onClose} style={{ background: "transparent", border: "1px solid rgba(201,153,60,0.25)", color: "#aaaaaa", borderRadius: 2, padding: "14px 40px", fontSize: 10, cursor: "pointer", fontFamily: "'Montserrat', sans-serif", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

function SlotCard({ slot, onSelect, delay }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), delay); }, [delay]);
  const isAvailable = slot.status === "available";
  return (
    <button onClick={onSelect} disabled={!isAvailable}
      style={{
        background: isAvailable ? "rgba(201,153,60,0.06)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${isAvailable ? "rgba(201,153,60,0.3)" : "rgba(255,255,255,0.05)"}`,
        borderRadius: 2, padding: "14px 8px",
        cursor: isAvailable ? "pointer" : "default",
        textAlign: "center", outline: "none",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: `all 0.4s ease ${delay}ms`,
      }}>
      <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: isAvailable ? "#f5f0e8" : "#1a1510", fontSize: 18, fontWeight: 600, margin: 0 }}>
        {slot.time}
      </p>
      <p style={{ fontFamily: "'Montserrat', sans-serif", color: isAvailable ? "#c9993c" : "#1a1510", fontSize: 8, margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {isAvailable ? "libre" : "ocupado"}
      </p>
    </button>
  );
}

export default function BarberLanding({ barberId, barberName, onBack }) {
  const BARBER_ID_USE = barberId || "e6f0681a-9724-4425-9f5e-1ee188899e02";
  const days = getNextDays(3);
  const [selectedDate, setSelectedDate] = useState(days[0].value);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false); // eslint-disable-line no-unused-vars

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true); setVisible(false);
    fetch(`${API_BASE}/appointments/day?barber_id=${BARBER_ID_USE}&date=${selectedDate}`)
      .then(r => r.json())
      .then(data => { setSlots(data.slots || []); setLoading(false); setTimeout(() => setVisible(true), 50); })
      .catch(() => setLoading(false));
  }, [selectedDate, BARBER_ID_USE]);

  const morning = slots.filter(s => parseInt(s.time) < 13);
  const afternoon = slots.filter(s => parseInt(s.time) >= 13);
  const available = slots.filter(s => s.status === "available").length;

  if (success) return <SuccessScreen onClose={() => setSuccess(false)} />;

  return (
    <div style={{ minHeight: "100vh", background: "#060606", color: "#f5f0e8", maxWidth: 480, margin: "0 auto", fontFamily: "'Montserrat', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Montserrat:wght@300;400;600;700&display=swap');`}</style>

      {/* Header */}
      <div style={{ padding: "36px 28px 24px", borderBottom: "1px solid rgba(201,153,60,0.1)" }}>
        {onBack && (
          <button onClick={onBack} style={{ background: "transparent", border: "none", color: "#888888", cursor: "pointer", fontSize: 10, marginBottom: 20, padding: 0, fontFamily: "'Montserrat', sans-serif", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Volver al perfil
          </button>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 9, color: "#c9993c", letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 6px" }}>Turnos disponibles</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 400, margin: 0, color: "#f5f0e8" }}>{barberName || "Barberia"}</h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 9, color: "#888888", letterSpacing: "0.1em", margin: "0 0 4px" }}>DISPONIBLES</p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, color: "#c9993c", margin: 0, fontWeight: 600 }}>{available}</p>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 28px 80px" }}>
        {/* Selector de fecha */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {days.map(day => (
            <button key={day.value} onClick={() => setSelectedDate(day.value)} style={{
              flex: 1, padding: "12px 8px", borderRadius: 2,
              background: selectedDate === day.value ? "rgba(201,153,60,0.15)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${selectedDate === day.value ? "rgba(201,153,60,0.5)" : "rgba(255,255,255,0.06)"}`,
              color: selectedDate === day.value ? "#c9993c" : "#888888",
              fontSize: 10, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Montserrat', sans-serif", letterSpacing: "0.1em",
              textTransform: "uppercase", transition: "all 0.3s ease",
            }}>
              {day.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <style>{"@keyframes spin2 { to { transform: rotate(360deg); } }"}</style>
            <div style={{ width: 32, height: 32, border: "1px solid rgba(201,153,60,0.3)", borderTop: "1px solid #c9993c", borderRadius: "50%", margin: "0 auto", animation: "spin2 1s linear infinite" }} />
          </div>
        ) : slots.length === 0 ? (
          <p style={{ color: "#666666", textAlign: "center", padding: "60px 0", fontSize: 12, letterSpacing: "0.1em" }}>No hay turnos para este dia.</p>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: "0.5px", background: "rgba(201,153,60,0.15)" }} />
              <p style={{ fontSize: 8, color: "#888888", letterSpacing: "0.3em", textTransform: "uppercase", margin: 0 }}>MANANA</p>
              <div style={{ flex: 1, height: "0.5px", background: "rgba(201,153,60,0.15)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 28 }}>
              {morning.map((slot, i) => <SlotCard key={slot.id} slot={slot} delay={i * 50} onSelect={() => slot.status === "available" && setSelectedSlot(slot)} />)}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: "0.5px", background: "rgba(201,153,60,0.15)" }} />
              <p style={{ fontSize: 8, color: "#888888", letterSpacing: "0.3em", textTransform: "uppercase", margin: 0 }}>TARDE</p>
              <div style={{ flex: 1, height: "0.5px", background: "rgba(201,153,60,0.15)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {afternoon.map((slot, i) => <SlotCard key={slot.id} slot={slot} delay={i * 50 + 200} onSelect={() => slot.status === "available" && setSelectedSlot(slot)} />)}
            </div>
          </>
        )}
      </div>

      {selectedSlot && <BookingModal slot={selectedSlot} onClose={() => setSelectedSlot(null)} onSuccess={() => { setSelectedSlot(null); setSuccess(true); }} />}
    </div>
  );
}
