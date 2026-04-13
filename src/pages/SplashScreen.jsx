import { motion } from "framer-motion";

const GOLD = "#C9A84C";

function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${GOLD})` }} />
      <svg width="14" height="14" viewBox="0 0 24 24" fill={GOLD}>
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${GOLD})` }} />
    </div>
  );
}

export default function SplashScreen({ onEnter, onMisTurnos }) {
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
  };

  const fadeUp = {
    hidden:  { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
  };

  const fadeIn = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" } },
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0A",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "60px 32px 100px",
      maxWidth: 480,
      margin: "0 auto",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle background radial glow */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 80% 40% at 50% 60%, rgba(201,168,76,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}
      >
        {/* Location tag */}
        <motion.p variants={fadeUp} style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 10,
          letterSpacing: "0.4em",
          color: `${GOLD}99`,
          margin: "0 0 20px",
          textTransform: "uppercase",
        }}>
          Humboldt 689 · Buenos Aires
        </motion.p>

        {/* Logo circle */}
        <motion.div variants={fadeUp} style={{ position: "relative", marginBottom: 32 }}>
          {/* Outer pulsing ring */}
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              inset: -14,
              borderRadius: "50%",
              border: `1px solid ${GOLD}55`,
            }}
          />
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            style={{
              position: "absolute",
              inset: -26,
              borderRadius: "50%",
              border: `1px solid ${GOLD}22`,
            }}
          />

          {/* Logo container */}
          <div style={{
            width: 220,
            height: 220,
            borderRadius: "50%",
            overflow: "hidden",
            border: `3px solid ${GOLD}`,
            boxShadow: `0 0 60px rgba(201,168,76,0.2), inset 0 0 60px rgba(0,0,0,0.3)`,
            position: "relative",
            zIndex: 1,
            background: "linear-gradient(135deg, #1a1508, #2d2010)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <img
              src="/logo.jpg"
              alt="MVZ Barbería"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => {
                e.target.style.display = "none";
                e.target.parentElement.innerHTML = `<span style="font-size:64px;font-weight:800;color:${GOLD};font-family:'Playfair Display',serif;letter-spacing:0.1em">MVZ</span>`;
              }}
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 12 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 48,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            background: `linear-gradient(135deg, ${GOLD} 0%, #f0d080 40%, ${GOLD} 60%, #a07820 100%)`,
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "shimmer 4s linear infinite",
          }}>
            MVZ
          </h1>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 22,
            fontWeight: 400,
            margin: "4px 0 0",
            color: "#ffffff",
            textTransform: "uppercase",
            letterSpacing: "0.3em",
          }}>
            Barbería
          </h2>
        </motion.div>

        {/* Divider */}
        <motion.div variants={fadeIn} style={{ width: "100%", marginBottom: 10 }}>
          <GoldDivider />
        </motion.div>

        {/* Subtitle */}
        <motion.p variants={fadeUp} style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 10,
          letterSpacing: "0.3em",
          color: `${GOLD}88`,
          margin: "8px 0 36px",
          textTransform: "uppercase",
        }}>
          Estilo &amp; Tradición
        </motion.p>

        {/* Online badge */}
        <motion.div variants={fadeUp} style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(201,168,76,0.07)",
          border: `1px solid ${GOLD}33`,
          borderRadius: 30,
          padding: "8px 20px",
          marginBottom: 28,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#4ade80", boxShadow: "0 0 8px #4ade80",
          }} />
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 10,
            color: GOLD,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}>
            Reservas online
          </span>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div variants={fadeUp} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          <motion.button
            onClick={onEnter}
            whileHover={{ translateY: -2, boxShadow: `0 8px 32px rgba(201,168,76,0.4)` }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: "100%",
              background: `linear-gradient(135deg, ${GOLD}, #a07820)`,
              color: "#060606",
              border: "none",
              borderRadius: 4,
              padding: "18px 0",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.25em",
              fontFamily: "'Inter', sans-serif",
              textTransform: "uppercase",
              boxShadow: `0 4px 24px rgba(201,168,76,0.25)`,
            }}
          >
            Ver Turnos Disponibles
          </motion.button>

          <motion.button
            onClick={onMisTurnos}
            whileHover={{ borderColor: `${GOLD}99`, color: GOLD }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: "100%",
              background: "transparent",
              color: `${GOLD}66`,
              border: `1px solid ${GOLD}33`,
              borderRadius: 4,
              padding: "14px 0",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.2em",
              fontFamily: "'Inter', sans-serif",
              textTransform: "uppercase",
              transition: "border-color 0.3s, color 0.3s",
            }}
          >
            Mis Turnos
          </motion.button>
        </motion.div>

        {/* Social links */}
        <motion.div variants={fadeUp} style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          marginTop: 32,
        }}>
          {[
            {
              href: "https://www.instagram.com/mvz.barberia",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5">
                  <rect x="2" y="2" width="20" height="20" rx="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill={GOLD} stroke="none"/>
                </svg>
              ),
            },
            {
              href: "https://wa.me/5491164206213",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
              ),
            },
            {
              href: "https://maps.google.com/?q=Humboldt+689+CABA+Buenos+Aires",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              ),
            },
          ].map(({ href, icon }, i) => (
            <motion.a
              key={i}
              href={href}
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.1, borderColor: `${GOLD}66` }}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${GOLD}22`,
                display: "flex", alignItems: "center", justifyContent: "center",
                textDecoration: "none", transition: "border-color 0.3s",
              }}
            >
              {icon}
            </motion.a>
          ))}
        </motion.div>
      </motion.div>

      {/* Footer text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        style={{ textAlign: "center", marginTop: 40 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1, height: "0.5px", background: `${GOLD}22` }} />
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 9,
            color: `${GOLD}44`,
            letterSpacing: "0.25em",
          }}>MVZ BARBERÍA</span>
          <div style={{ flex: 1, height: "0.5px", background: `${GOLD}22` }} />
        </div>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 9,
          color: "#333",
          margin: "0 0 2px",
          letterSpacing: "0.1em",
        }}>
          Humboldt 689, CABA · Lun–Sáb 09:00–20:00
        </p>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 9,
          color: "#222",
          margin: 0,
          letterSpacing: "0.08em",
        }}>
          © 2026 MVZ BARBERÍA — TODOS LOS DERECHOS RESERVADOS
        </p>
      </motion.div>

      {/* Fixed bottom bar */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        background: "rgba(10,10,10,0.92)",
        backdropFilter: "blur(12px)",
        borderTop: `1px solid ${GOLD}22`,
        display: "flex",
        alignItems: "center",
        zIndex: 50,
      }}>
        <a
          href="https://wa.me/5491164206213"
          target="_blank"
          rel="noreferrer"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "14px 0",
            textDecoration: "none",
            borderRight: `1px solid ${GOLD}22`,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={GOLD}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 10,
            color: GOLD,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}>WhatsApp</span>
        </a>

        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              const toast = document.createElement("div");
              toast.innerText = "Notificaciones — Próximamente";
              Object.assign(toast.style, {
                position: "fixed", bottom: "70px", left: "50%",
                transform: "translateX(-50%)",
                background: "#1A1A1A", color: GOLD,
                border: `1px solid ${GOLD}44`,
                borderRadius: "8px", padding: "10px 20px",
                fontSize: "12px", fontFamily: "'Inter', sans-serif",
                letterSpacing: "0.1em", zIndex: "9999",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              });
              document.body.appendChild(toast);
              setTimeout(() => toast.remove(), 2500);
            }
          }}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "14px 0",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 10,
            color: GOLD,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}>Notificaciones</span>
        </button>
      </div>
    </div>
  );
}
