import { useEffect, useState } from "react";

export default function SplashScreen({ onEnter }) {
  const [visible, setVisible] = useState(false);
  const [lineVisible, setLineVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    setTimeout(() => setLineVisible(true), 600);
    setTimeout(() => setContentVisible(true), 900);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060606",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "60px 32px 40px",
      maxWidth: 480,
      margin: "0 auto",
      fontFamily: "'Times New Roman', Georgia, serif",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Montserrat:wght@300;400;600;700&display=swap');
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.02); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .btn-gold:hover { background: #e8b84b !important; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(201,153,60,0.4) !important; }
        .btn-gold:active { transform: translateY(0); }
        .social-btn:hover { border-color: #c9993c !important; transform: scale(1.1); }
      `}</style>

      {/* Header — logo text */}
      <div style={{
        textAlign: "center",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-30px)",
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        <p style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 10,
          letterSpacing: "0.4em",
          color: "#c9993c",
          margin: "0 0 16px",
          textTransform: "uppercase",
        }}>
          Humboldt 689 · CABA
        </p>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 52,
          fontWeight: 300,
          margin: 0,
          lineHeight: 1,
          background: "linear-gradient(135deg, #c9993c 0%, #f0d080 40%, #c9993c 60%, #a07820 100%)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "shimmer 4s linear infinite",
        }}>
          TURNOS
        </h1>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 52,
          fontWeight: 600,
          margin: 0,
          lineHeight: 1,
          color: "#f5f0e8",
          letterSpacing: "0.12em",
        }}>
          MVZ
        </h1>

        {/* Linea decorativa */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 20,
          opacity: lineVisible ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, #c9993c)" }} />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#c9993c">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, #c9993c)" }} />
        </div>

        <p style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 11,
          letterSpacing: "0.2em",
          color: "#6b5a3a",
          margin: "12px 0 0",
          textTransform: "uppercase",
        }}>
          Barberia &amp; Estilos
        </p>
      </div>

      {/* Centro — imagen circular */}
      <div style={{
        textAlign: "center",
        opacity: contentVisible ? 1 : 0,
        transform: contentVisible ? "scale(1)" : "scale(0.8)",
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        {/* Anillo exterior animado */}
        <div style={{
          position: "relative",
          width: 240,
          height: 240,
          margin: "0 auto 32px",
          animation: "float 4s ease-in-out infinite",
        }}>
          {/* Anillo decorativo */}
          <div style={{
            position: "absolute",
            inset: -8,
            borderRadius: "50%",
            border: "1px solid rgba(201,153,60,0.3)",
            animation: "pulse-ring 3s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute",
            inset: -16,
            borderRadius: "50%",
            border: "1px solid rgba(201,153,60,0.1)",
            animation: "pulse-ring 3s ease-in-out infinite 0.5s",
          }} />

          {/* Foto */}
          <div style={{
            width: 240,
            height: 240,
            borderRadius: "50%",
            overflow: "hidden",
            border: "3px solid #c9993c",
            boxShadow: "0 0 60px rgba(201,153,60,0.2), inset 0 0 60px rgba(0,0,0,0.3)",
            position: "relative",
            zIndex: 1,
          }}>
            <img
              src="/logo.jpg"
              alt="MVZ Barberia"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => {
                e.target.parentElement.style.background = "linear-gradient(135deg, #1a1508, #2d2010)";
                e.target.style.display = "none";
                e.target.parentElement.innerHTML += "<div style='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:60px;font-weight:800;color:#c9993c;font-family:sans-serif'>MVZ</div>";
              }}
            />
          </div>
        </div>

        {/* Reservas online badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(201,153,60,0.08)",
          border: "1px solid rgba(201,153,60,0.25)",
          borderRadius: 30,
          padding: "8px 20px",
          marginBottom: 28,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: "#c9993c", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Reservas online
          </span>
        </div>

        {/* Boton */}
        <button onClick={onEnter} className="btn-gold" style={{
          width: "100%",
          background: "linear-gradient(135deg, #c9993c, #a07820)",
          color: "#060606",
          border: "none",
          borderRadius: 4,
          padding: "18px 0",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          letterSpacing: "0.2em",
          fontFamily: "'Montserrat', sans-serif",
          textTransform: "uppercase",
          transition: "all 0.3s ease",
          marginBottom: 20,
          boxShadow: "0 4px 24px rgba(201,153,60,0.25)",
        }}>
          Ver Turnos Disponibles
        </button>

        {/* Redes sociales */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          <a href="https://www.instagram.com/mvz.barberia" target="_blank" rel="noreferrer" className="social-btn" style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(201,153,60,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            textDecoration: "none", transition: "all 0.3s ease",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9993c" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="#c9993c" stroke="none"/>
            </svg>
          </a>
          <a href="https://wa.me/5491164206213" target="_blank" rel="noreferrer" className="social-btn" style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(201,153,60,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            textDecoration: "none", transition: "all 0.3s ease",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9993c" strokeWidth="1.5">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          </a>
          <a href="https://maps.google.com/?q=Humboldt+689+CABA+Buenos+Aires" target="_blank" rel="noreferrer" className="social-btn" style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(201,153,60,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            textDecoration: "none", transition: "all 0.3s ease",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9993c" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: "center",
        opacity: contentVisible ? 1 : 0,
        transition: "opacity 1.2s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1, height: "0.5px", background: "rgba(201,153,60,0.2)" }} />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, color: "#3a3020", letterSpacing: "0.2em" }}>MVZ BARBERIA</span>
          <div style={{ flex: 1, height: "0.5px", background: "rgba(201,153,60,0.2)" }} />
        </div>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, color: "#2a2015", margin: "0 0 4px", letterSpacing: "0.1em" }}>
          Humboldt 689, CABA · Lun–Sáb 09:00–20:00
        </p>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 9, color: "#2a2015", margin: 0, letterSpacing: "0.1em" }}>
          2026 MVZ BARBERIA — TODOS LOS DERECHOS RESERVADOS
        </p>
      </div>
    </div>
  );
}
