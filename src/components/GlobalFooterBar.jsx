const GOLD = "#C9A84C";

export default function GlobalFooterBar() {
  const showToast = () => {
    const toast = document.createElement("div");
    toast.innerText = "Notificaciones — Próximamente";
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "70px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#1A1A1A",
      color: GOLD,
      border: `1px solid ${GOLD}44`,
      borderRadius: "8px",
      padding: "10px 20px",
      fontSize: "12px",
      fontFamily: "'Inter', sans-serif",
      letterSpacing: "0.1em",
      zIndex: "9999",
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      whiteSpace: "nowrap",
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: "rgba(10,10,10,0.92)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderTop: `1px solid ${GOLD}22`,
      display: "flex",
      alignItems: "center",
      zIndex: 200,
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
          padding: "13px 0",
          textDecoration: "none",
          borderRight: `1px solid ${GOLD}18`,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill={GOLD}>
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
        onClick={showToast}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "13px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
  );
}
