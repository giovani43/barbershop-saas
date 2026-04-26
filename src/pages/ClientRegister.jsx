import { useState } from "react";
import { motion } from "framer-motion";

const API = "https://barbershop-api-vpz8.onrender.com/api/v1";

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

function FieldWithIcon({ icon, type, value, onChange, placeholder, hint, rightSlot }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        display: "flex", alignItems: "center",
        background: C.bg,
        border: `1px solid ${focused ? C.gold : C.border}`,
        borderRadius: 8, padding: "0 14px", gap: 10,
        transition: "border-color 0.2s",
      }}>
        <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{icon}</span>
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, background: "transparent", border: "none",
            outline: "none", color: C.text, fontSize: 14,
            padding: "13px 0", fontFamily: "'Inter', sans-serif",
          }}
        />
        {rightSlot}
      </div>
      {hint && <p style={{ color: C.muted, fontSize: 11, margin: "4px 0 0", paddingLeft: 4 }}>{hint}</p>}
    </div>
  );
}

export default function ClientRegister() {
  const [nombre,   setNombre]   = useState("");
  const [dni,      setDni]      = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const EyeIcon = ({ show }) => show
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

  const userIcon  = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  const phoneIcon = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.98-.98a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
  const cardIcon  = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
  const lockIcon  = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;

  const submit = async () => {
    setError("");
    if (!nombre.trim() || !dni.trim() || !whatsapp.trim() || !password || !confirm) {
      setError("Completá todos los campos"); return;
    }
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    if (password.length < 6)  { setError("La contraseña debe tener al menos 6 caracteres"); return; }

    setLoading(true);
    try {
      const res  = await fetch(`${API}/clients/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          nombre:   nombre.trim(),
          dni:      dni.replace(/\./g, "").trim(),
          whatsapp: whatsapp.trim(),
          password,
        }),
      });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error(`Error del servidor (${res.status}). Intentá de nuevo.`);
      const json = await res.json();
      if (res.status === 409) { setError("Ya tenés cuenta con ese DNI. Iniciá sesión."); return; }
      if (!res.ok) throw new Error(json.error || "Error al registrarse");
      localStorage.setItem("client_token", json.token);
      localStorage.setItem("client_user",  JSON.stringify(json.user));
      navigate("/");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

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
          style={{ textAlign: "center", marginBottom: 24 }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            border: `2px solid ${C.gold}`,
            background: "linear-gradient(135deg, #1a1508, #2d2010)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px", overflow: "hidden",
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
            fontSize: 20, fontWeight: 700, color: C.text,
            margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.15em",
          }}>
            MVZ Barbería
          </h1>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
            Creá tu cuenta para reservar
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
            padding: "24px 24px 28px",
          }}
        >
          <FieldWithIcon icon={userIcon}  type="text"     value={nombre}   onChange={setNombre}   placeholder="Nombre completo" />
          <FieldWithIcon icon={phoneIcon} type="tel"      value={whatsapp} onChange={setWhatsapp} placeholder="WhatsApp, ej: 1155667788" hint="Incluí el código de área sin el 0" />
          <FieldWithIcon icon={cardIcon}  type="tel"      value={dni}      onChange={setDni}      placeholder="DNI sin puntos, ej: 38456789" />
          <FieldWithIcon
            icon={lockIcon}
            type={showPwd ? "text" : "password"}
            value={password} onChange={setPassword}
            placeholder="Contraseña (mín. 6 caracteres)"
            rightSlot={
              <button type="button" onClick={() => setShowPwd(s => !s)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <EyeIcon show={showPwd} />
              </button>
            }
          />
          <FieldWithIcon icon={lockIcon}  type="password" value={confirm}  onChange={setConfirm}  placeholder="Repetí la contraseña" />

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8, padding: "10px 14px", marginBottom: 16,
            }}>
              <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{error}</p>
            </div>
          )}

          <motion.button
            onClick={submit} disabled={loading}
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
              marginBottom: 16,
            }}
          >
            {loading ? "Registrando..." : "Registrarme y Continuar"}
          </motion.button>

          <p style={{ color: C.muted, fontSize: 13, textAlign: "center", margin: 0 }}>
            ¿Ya tenés cuenta?{" "}
            <button onClick={() => navigate("/cliente/login")} style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.gold, fontSize: 13, fontWeight: 600, padding: 0,
              fontFamily: "'Inter', sans-serif",
            }}>
              Iniciar sesión
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
