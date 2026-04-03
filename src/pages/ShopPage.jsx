import { useState, useEffect } from "react";

const API_BASE = "https://web-production-d26db.up.railway.app/api/v1";

export default function ShopPage({ shopSlug }) {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/barbers/shop/${shopSlug}`)
      .then(r => r.json())
      .then(data => { setShop(data); setLoading(false); setTimeout(() => setVisible(true), 50); })
      .catch(() => setLoading(false));
  }, [shopSlug]);

  const goToProfile = (barberSlug) => {
    window.history.pushState({}, "", `/shop/${shopSlug}/${barberSlug}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#060606", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "2px solid rgba(201,153,60,0.3)", borderTop: "2px solid #c9993c", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
        <p style={{ color: "#4a3a20", fontFamily: "Georgia, serif", fontSize: 12, letterSpacing: "0.2em" }}>CARGANDO</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#060606", color: "#f5f0e8", maxWidth: 480, margin: "0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Montserrat:wght@300;400;600;700&display=swap');
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .barber-card { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important; }
        .barber-card:hover { transform: translateY(-4px) !important; border-color: rgba(201,153,60,0.6) !important; box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(201,153,60,0.1) !important; }
        .barber-card:hover .card-arrow { transform: translateX(6px) !important; opacity: 1 !important; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "48px 28px 32px",
        borderBottom: "1px solid rgba(201,153,60,0.1)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-20px)",
        transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, letterSpacing: "0.4em", color: "#c9993c", margin: "0 0 8px", textTransform: "uppercase" }}>
          {shop?.shop_name}
        </p>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 42, fontWeight: 300, margin: "0 0 4px", lineHeight: 1.1,
          background: "linear-gradient(135deg, #c9993c 0%, #f0d080 50%, #c9993c 100%)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          animation: "shimmer 4s linear infinite",
        }}>
          Elegí tu
        </h1>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 42, fontWeight: 600, margin: "0 0 16px", lineHeight: 1.1, color: "#f5f0e8" }}>
          Barbero
        </h1>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: "#4a3a20", margin: 0, letterSpacing: "0.05em" }}>
          Cada uno con su estilo. Todos de primera.
        </p>
      </div>

      {/* Lista de barberos */}
      <div style={{ padding: "24px 28px 60px" }}>
        {shop?.barbers?.map((barber, i) => (
          <div
            key={barber.id}
            className="barber-card"
            onClick={() => goToProfile(barber.slug)}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(201,153,60,0.15)",
              borderRadius: 2,
              marginBottom: 16,
              cursor: "pointer",
              overflow: "hidden",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-30px)",
              transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.12}s`,
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {/* Foto */}
              <div style={{ width: 100, height: 110, flexShrink: 0, overflow: "hidden", position: "relative" }}>
                <img
                  src={barber.photo_url}
                  alt={barber.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.85)" }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 60%, #0a0a0a)" }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, padding: "20px 16px" }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, color: "#c9993c", letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 6px" }}>
                  Especialista
                </p>
                <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 600, margin: "0 0 4px", color: "#f5f0e8" }}>
                  {barber.name}
                </h2>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 10, color: "#7a6040", margin: "0 0 12px", letterSpacing: "0.05em" }}>
                  {barber.specialty}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 10, color: "#c9993c", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Ver perfil
                  </span>
                  <span className="card-arrow" style={{ color: "#c9993c", fontSize: 14, transition: "all 0.3s ease", opacity: 0.6 }}>→</span>
                </div>
              </div>
            </div>

            {/* Barra dorada inferior */}
            <div style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(201,153,60,0.4), transparent)" }} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "0 28px 40px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1, height: "0.5px", background: "rgba(201,153,60,0.15)" }} />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 8, color: "#2a2015", letterSpacing: "0.3em" }}>TURNOS LG</span>
          <div style={{ flex: 1, height: "0.5px", background: "rgba(201,153,60,0.15)" }} />
        </div>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, color: "#1a1510", margin: 0, letterSpacing: "0.1em" }}>
          2026 TURNOS LG — TODOS LOS DERECHOS RESERVADOS
        </p>
      </div>
    </div>
  );
}
