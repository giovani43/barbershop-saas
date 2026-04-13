import { useState } from "react";
import { motion } from "framer-motion";

const API = "https://web-production-d26db.up.railway.app/api/v1";

const C = {
  gold:    "#C9A84C",
  goldDim: "rgba(201,168,76,0.12)",
  bg:      "#0A0A0A",
  card:    "#111111",
  border:  "#222222",
  text:    "#FFFFFF",
  muted:   "#777777",
  red:     "#ef4444",
};

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function ClientLogin() {
  const [dni,      setDni]      = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [focused,  setFocused]  = useState("");

  const redirectTo = new URLSearchParams(window.location.search).get("redirect_to") || "/";

  const submit = async () => {
    if (!dni.trim() || !password) { setError("DNI y contraseña son obligatorios"); return; }
    setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API}/clients/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ dni: dni.replace(/\./g, "").trim(), password }),
      });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error(`Error del servidor (${res.status}). Intentá de nuevo.`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al iniciar sesión");
      localStorage.setItem("client_token", json.token);
      localStorage.setItem("client_user",  JSON.stringify(json.user));
      navigate(redirectTo);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const fieldStyle = (name) => ({
    display: "flex",
    alignItems: "center",
    background: C.bg,
    border: `1px solid ${focused === name ? C.gold : C.border}`,
    borderRadius: 8,
    padding: "0 14px",
    gap: 10,
    transition: "border-color 0.2s",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      padding: 16,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 28 }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            border: `2px solid ${C.gold}`,
            background: "linear-gradient(135deg, #1a1508, #2d2010)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
            overflow: "hidden",
          }}>
            <img src="/logo.jpg" alt="MVZ"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => {
                e.target.style.display = "none";
                e.target.parentElement.innerHTML = `<span style="font-size:18px;font-weight:800;color:${C.gold};font-family:'Playfair Display',serif">MVZ</span>`;
              }}
            />
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20,
            fontWeight: 700,
            color: C.text,
            margin: "0 0 4px",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
          }}>
            MVZ Barbería
          </h1>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
            Iniciá sesión para reservar tu turno
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "28px 24px",
          }}
        >
          {/* DNI */}
          <div style={{ marginBottom: 12 }}>
            <div style={fieldStyle("dni")}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              <input
                type="tel" value={dni} placeholder="DNI sin puntos, ej: 38456789"
                onChange={e => { setDni(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && submit()}
                onFocus={() => setFocused("dni")}
                onBlur={() => setFocused("")}
                style={{
                  flex: 1, background: "transparent", border: "none",
                  outline: "none", color: C.text, fontSize: 14,
                  padding: "13px 0", fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <div style={fieldStyle("pwd")}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPwd ? "text" : "password"} value={password} placeholder="Contraseña"
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && submit()}
                onFocus={() => setFocused("pwd")}
                onBlur={() => setFocused("")}
                style={{
                  flex: 1, background: "transparent", border: "none",
                  outline: "none", color: C.text, fontSize: 14,
                  padding: "13px 0", fontFamily: "'Inter', sans-serif",
                }}
              />
              <button type="button" onClick={() => setShowPwd(s => !s)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                {showPwd
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                }
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8, padding: "10px 14px", marginBottom: 16,
            }}>
              <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{error}</p>
            </div>
          )}

          <motion.button
            onClick={submit}
            disabled={loading}
            whileHover={loading ? {} : { translateY: -1 }}
            whileTap={loading ? {} : { scale: 0.98 }}
            style={{
              width: "100%", padding: 15,
              background: loading ? "#2a2a2a" : `linear-gradient(135deg, ${C.gold}, #8a6a1e)`,
              border: "none", borderRadius: 8,
              color: loading ? C.muted : "#000",
              fontWeight: 700, fontSize: 12,
              letterSpacing: "0.2em", textTransform: "uppercase",
              cursor: loading ? "default" : "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {loading ? "Ingresando..." : "Ingresar y Continuar"}
          </motion.button>

          <p style={{ color: C.muted, fontSize: 13, textAlign: "center", margin: "16px 0 0" }}>
            ¿No tenés cuenta?{" "}
            <button onClick={() => navigate("/cliente/registro")} style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.gold, fontSize: 13, fontWeight: 600, padding: 0,
              fontFamily: "'Inter', sans-serif",
            }}>
              Registrate
            </button>
          </p>
        </motion.div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={() => navigate("/")} style={{
            background: "none", border: "none", cursor: "pointer",
            color: C.muted, fontSize: 12, fontFamily: "'Inter', sans-serif",
          }}>
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
