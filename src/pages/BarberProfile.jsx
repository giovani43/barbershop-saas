import { useState, useEffect } from "react";
import BarberLanding from "./BarberLanding";

const API_BASE = "https://web-production-d26db.up.railway.app/api/v1";

const WORKS = [
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400",
  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400",
  "https://images.unsplash.com/photo-1596728325488-58c87691e9af?w=400",
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400",
];

export default function BarberProfile({ shopSlug, barberSlug }) {
  const [barber, setBarber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSlots, setShowSlots] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/barbers/${barberSlug}`)
      .then(r => r.json())
      .then(data => { setBarber(data); setLoading(false); setTimeout(() => setVisible(true), 50); })
      .catch(() => setLoading(false));
  }, [barberSlug]);

  const goBack = () => {
    window.history.pushState({}, "", `/shop/${shopSlug}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#060606", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      <div style={{ width: 40, height: 40, border: "2px solid rgba(201,153,60,0.3)", borderTop: "2px solid #c9993c", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (showSlots) return (
    <BarberLanding barberId={barber.id} barberName={barber.name} onBack={() => setShowSlots(false)} />
  );

  return (
    <div style={{ minHeight: "100vh", background: "#060606", color: "#f5f0e8", maxWidth: 480, margin: "0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Montserrat:wght@300;400;600;700&display=swap');
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .work-img { transition: transform 0.4s ease, filter 0.4s ease !important; }
        .work-img:hover { transform: scale(1.05) !important; filter: brightness(1.1) !important; }
        .btn-reserve { transition: all 0.3s ease !important; }
        .btn-reserve:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 32px rgba(201,153,60,0.4) !important; }
        .btn-wa:hover { border-color: #4ade80 !important; background: rgba(74,222,128,0.08) !important; }
      `}</style>

      {/* Hero imagen */}
      <div style={{ position: "relative", height: 320 }}>
        <img src={barber.photo_url} alt={barber.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.6)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(6,6,6,0.3) 0%, rgba(6,6,6,0.9) 100%)" }} />

        {/* Back button */}
        <button onClick={goBack} style={{
          position: "absolute", top: 20, left: 20,
          background: "rgba(6,6,6,0.6)", border: "1px solid rgba(201,153,60,0.3)",
          color: "#c9993c", borderRadius: 2, padding: "8px 16px",
          cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
          fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase",
        }}>
          Volver
        </button>

        {/* Instagram badge */}
        {barber.instagram && (
          <a href={barber.instagram} target="_blank" rel="noreferrer" style={{
            position: "absolute", top: 20, right: 20,
            background: "rgba(6,6,6,0.6)", border: "1px solid rgba(201,153,60,0.3)",
            borderRadius: 2, padding: "8px 14px",
            display: "flex", alignItems: "center", gap: 8, textDecoration: "none",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9993c" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="#c9993c" stroke="none"/>
            </svg>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, color: "#c9993c", letterSpacing: "0.15em" }}>INSTAGRAM</span>
          </a>
        )}

        {/* Nombre sobre la imagen */}
        <div style={{
          position: "absolute", bottom: 24, left: 28, right: 28,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, color: "#c9993c", letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 6px" }}>
            Especialista en {barber.specialty}
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 40, fontWeight: 600, margin: 0, lineHeight: 1.1, color: "#f5f0e8" }}>
            {barber.name}
          </h1>
        </div>
      </div>

      {/* Contenido */}
      <div style={{
        padding: "28px 28px 60px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
      }}>
        {/* Bio */}
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: "#7a6040", margin: "0 0 32px", lineHeight: 1.8, letterSpacing: "0.02em" }}>
          {barber.bio}
        </p>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: "0.5px", background: "rgba(201,153,60,0.2)" }} />
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, color: "#4a3820", letterSpacing: "0.3em", textTransform: "uppercase", margin: 0 }}>
            Trabajos Recientes
          </p>
          <div style={{ flex: 1, height: "0.5px", background: "rgba(201,153,60,0.2)" }} />
        </div>

        {/* Grilla de trabajos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 32 }}>
          {WORKS.map((url, i) => (
            <div key={i} className="work-img" style={{
              height: 150, borderRadius: 2, overflow: "hidden",
              border: "1px solid rgba(201,153,60,0.1)",
            }}>
              <img src={url} alt={`Trabajo ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.85) saturate(0.9)" }} />
            </div>
          ))}
        </div>

        {/* WhatsApp */}
        {barber.whatsapp && (
          <a href={`https://wa.me/${barber.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="btn-wa"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.2)",
              borderRadius: 2, padding: "14px 0", marginBottom: 12,
              textDecoration: "none", color: "#4ade80",
              fontFamily: "'Montserrat', sans-serif", fontSize: 11,
              letterSpacing: "0.15em", textTransform: "uppercase",
              transition: "all 0.3s ease",
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            Consultar por WhatsApp
          </a>
        )}

        {/* Boton principal */}
        <button onClick={() => setShowSlots(true)} className="btn-reserve" style={{
          width: "100%",
          background: "linear-gradient(135deg, #c9993c 0%, #a07820 100%)",
          color: "#060606", border: "none", borderRadius: 2,
          padding: "20px 0", fontSize: 12, fontWeight: 700,
          cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
          letterSpacing: "0.2em", textTransform: "uppercase",
          boxShadow: "0 4px 24px rgba(201,153,60,0.25)",
        }}>
          Ver Horarios y Reservar
        </button>
      </div>
    </div>
  );
}
