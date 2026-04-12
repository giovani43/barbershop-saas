import { useState } from "react";

const API = "https://web-production-d26db.up.railway.app/api/v1";

const C = {
  gold:       "#D4AF37",
  bg:         "#080808",
  card:       "#0f0f0f",
  border:     "#1e1e1e",
  text:       "#f0f0f0",
  muted:      "#666666",
  red:        "#ef4444",
};

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function ClientLogin() {
  const [dni,      setDni]      = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  // Leer redirect_to de query param
  const redirectTo = new URLSearchParams(window.location.search).get("redirect_to") || "/";

  const submit = async () => {
    if (!dni.trim() || !password) {
      setError("DNI y contraseña son obligatorios");
      return;
    }
    setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API}/clients/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ dni: dni.replace(/\./g, "").trim(), password }),
      });
      const ct   = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        throw new Error(`Error del servidor (${res.status}). Intentá de nuevo.`);
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al iniciar sesión");

      localStorage.setItem("client_token", json.token);
      localStorage.setItem("client_user",  JSON.stringify(json.user));
      navigate(redirectTo);
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
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ color: C.gold, fontSize: 11, fontWeight: 700,
                      letterSpacing: 3, textTransform: "uppercase", margin: "0 0 4px" }}>
            Reservas online
          </p>
          <h1 style={{ color: C.text, fontSize: 24, fontWeight: 900, margin: 0 }}>
            Iniciar sesión
          </h1>
          <p style={{ color: C.muted, fontSize: 13, margin: "8px 0 0" }}>
            Iniciá sesión para reservar tu turno
          </p>
        </div>

        {/* DNI */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 5 }}>
            DNI (sin puntos)
          </label>
          <input
            type="tel" value={dni} placeholder="38123456"
            onChange={e => { setDni(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "#0a0a0a", border: `1.5px solid ${C.border}`,
              borderRadius: 10, padding: "13px 14px",
              color: C.text, fontSize: 15, outline: "none",
            }}
            onFocus={e => { e.target.style.borderColor = C.gold; }}
            onBlur={e  => { e.target.style.borderColor = C.border; }}
          />
        </div>

        {/* Contraseña */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 5 }}>
            Contraseña
          </label>
          <input
            type="password" value={password} placeholder="••••••••"
            onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "#0a0a0a", border: `1.5px solid ${C.border}`,
              borderRadius: 10, padding: "13px 14px",
              color: C.text, fontSize: 15, outline: "none",
            }}
            onFocus={e => { e.target.style.borderColor = C.gold; }}
            onBlur={e  => { e.target.style.borderColor = C.border; }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: "10px 14px", marginBottom: 16,
          }}>
            <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: "100%", padding: 15,
            background: loading ? "#333" : `linear-gradient(135deg, #E8CC6A, #9A7B1E)`,
            border: "none", borderRadius: 12,
            color: loading ? C.muted : "#000",
            fontWeight: 800, fontSize: 15,
            cursor: loading ? "default" : "pointer",
            marginBottom: 16,
          }}
        >
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>

        <p style={{ color: C.muted, fontSize: 13, textAlign: "center", margin: 0 }}>
          ¿No tenés cuenta?{" "}
          <button
            onClick={() => navigate("/cliente/registro")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.gold, fontSize: 13, fontWeight: 600, padding: 0,
            }}
          >
            Registrate
          </button>
        </p>

        <p style={{ color: C.muted, fontSize: 12, textAlign: "center", marginTop: 10 }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.muted, fontSize: 12, padding: 0,
            }}
          >
            ← Volver al inicio
          </button>
        </p>
      </div>
    </div>
  );
}
