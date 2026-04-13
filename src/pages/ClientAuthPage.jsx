import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = "https://web-production-d26db.up.railway.app/api/v1";

const C = {
  gold:      "#C9A84C",
  goldDim:   "rgba(201,168,76,0.12)",
  goldBrd:   "rgba(201,168,76,0.3)",
  bg:        "#0A0A0A",
  card:      "#111111",
  card2:     "#1A1A1A",
  border:    "#222222",
  text:      "#FFFFFF",
  muted:     "#777777",
  red:       "#ef4444",
};

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/* ── Icon helpers ─────────────────────────────────────────────────────────── */
function IconUser()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function IconPhone() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.98-.98a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>; }
function IconCard()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>; }
function IconLock()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function IconEye({ show })  {
  return show
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}

/* ── Input with icon ──────────────────────────────────────────────────────── */
function IconInput({ icon, type, value, onChange, placeholder, rightSlot }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      background: C.bg,
      border: `1px solid ${focused ? C.gold : C.border}`,
      borderRadius: 8,
      padding: "0 14px",
      gap: 10,
      transition: "border-color 0.2s",
    }}>
      <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{icon}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          background: "transparent !important",
          border: "none",
          outline: "none",
          color: C.text,
          fontSize: 14,
          padding: "13px 0",
          fontFamily: "'Inter', sans-serif",
        }}
      />
      {rightSlot}
    </div>
  );
}

/* ── Login tab ────────────────────────────────────────────────────────────── */
function LoginForm({ redirectTo }) {
  const [dni,      setDni]      = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const submit = async () => {
    if (!dni.trim() || !password) { setError("DNI y contraseña son obligatorios"); return; }
    setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API}/clients/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni: dni.replace(/\./g, "").trim(), password }),
      });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error(`Error del servidor (${res.status}).`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al iniciar sesión");
      localStorage.setItem("client_token", json.token);
      localStorage.setItem("client_user",  JSON.stringify(json.user));
      navigate(redirectTo || "/");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <motion.div
      key="login"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <IconInput
          icon={<IconCard />}
          type="tel"
          value={dni}
          onChange={v => { setDni(v); setError(""); }}
          placeholder="DNI sin puntos, ej: 38456789"
        />
        <IconInput
          icon={<IconLock />}
          type={showPwd ? "text" : "password"}
          value={password}
          onChange={v => { setPassword(v); setError(""); }}
          placeholder="Contraseña"
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPwd(s => !s)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
            >
              <IconEye show={showPwd} />
            </button>
          }
        />
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
          width: "100%",
          padding: "15px",
          background: loading ? "#2a2a2a" : `linear-gradient(135deg, ${C.gold}, #8a6a1e)`,
          border: "none",
          borderRadius: 8,
          color: loading ? C.muted : "#000",
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          cursor: loading ? "default" : "pointer",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {loading ? "Ingresando..." : "Ingresar y Continuar"}
      </motion.button>
    </motion.div>
  );
}

/* ── Register tab ─────────────────────────────────────────────────────────── */
function RegisterForm({ redirectTo }) {
  const [nombre,   setNombre]   = useState("");
  const [dni,      setDni]      = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre:   nombre.trim(),
          dni:      dni.replace(/\./g, "").trim(),
          whatsapp: whatsapp.trim(),
          password,
        }),
      });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error(`Error del servidor (${res.status}).`);
      const json = await res.json();
      if (res.status === 409) {
        setError("Ya tenés cuenta con ese DNI. Iniciá sesión.");
        return;
      }
      if (!res.ok) throw new Error(json.error || "Error al registrarse");
      localStorage.setItem("client_token", json.token);
      localStorage.setItem("client_user",  JSON.stringify(json.user));
      navigate(redirectTo || "/");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <motion.div
      key="register"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <IconInput icon={<IconUser />}  type="text" value={nombre}   onChange={v => { setNombre(v); setError(""); }}   placeholder="Nombre completo" />
        <IconInput icon={<IconPhone />} type="tel"  value={whatsapp} onChange={v => { setWhatsapp(v); setError(""); }} placeholder="WhatsApp, ej: 1155667788" />
        <IconInput icon={<IconCard />}  type="tel"  value={dni}      onChange={v => { setDni(v); setError(""); }}      placeholder="DNI sin puntos, ej: 38456789" />
        <IconInput
          icon={<IconLock />}
          type={showPwd ? "text" : "password"}
          value={password}
          onChange={v => { setPassword(v); setError(""); }}
          placeholder="Contraseña (mín. 6 caracteres)"
          rightSlot={
            <button type="button" onClick={() => setShowPwd(s => !s)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
              <IconEye show={showPwd} />
            </button>
          }
        />
        <IconInput icon={<IconLock />} type="password" value={confirm} onChange={v => { setConfirm(v); setError(""); }} placeholder="Repetí la contraseña" />
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
          width: "100%",
          padding: "15px",
          background: loading ? "#2a2a2a" : `linear-gradient(135deg, ${C.gold}, #8a6a1e)`,
          border: "none",
          borderRadius: 8,
          color: loading ? C.muted : "#000",
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          cursor: loading ? "default" : "pointer",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {loading ? "Registrando..." : "Registrarme y Continuar"}
      </motion.button>
    </motion.div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function ClientAuthPage() {
  const params     = new URLSearchParams(window.location.search);
  const redirectTo = params.get("redirect_to") || "/";
  const initTab    = params.get("tab") === "login" ? "login" : "register";
  const [tab, setTab] = useState(initTab);

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      padding: "24px 16px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 32 }}
        >
          <div style={{
            width: 72, height: 72,
            borderRadius: "50%",
            border: `2px solid ${C.gold}`,
            background: "linear-gradient(135deg, #1a1508, #2d2010)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            overflow: "hidden",
            boxShadow: `0 0 30px rgba(201,168,76,0.15)`,
          }}>
            <img
              src="/logo.jpg"
              alt="MVZ"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => {
                e.target.style.display = "none";
                e.target.parentElement.innerHTML = `<span style="font-size:22px;font-weight:800;color:${C.gold};font-family:'Playfair Display',serif">MVZ</span>`;
              }}
            />
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22,
            fontWeight: 700,
            color: C.text,
            margin: "0 0 4px",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
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
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
            {[
              { id: "register", label: "Registrarme" },
              { id: "login",    label: "Ya tengo cuenta" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1,
                  padding: "14px 8px",
                  background: tab === id ? C.goldDim : "transparent",
                  border: "none",
                  borderBottom: tab === id ? `2px solid ${C.gold}` : "2px solid transparent",
                  color: tab === id ? C.gold : C.muted,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 0.2s",
                  marginBottom: -1,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <div style={{ padding: "24px 24px 28px" }}>
            <AnimatePresence mode="wait">
              {tab === "login"
                ? <LoginForm    key="login"    redirectTo={redirectTo} />
                : <RegisterForm key="register" redirectTo={redirectTo} />
              }
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ textAlign: "center", marginTop: 20 }}
        >
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none", border: "none",
              color: C.muted, fontSize: 12, cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            ← Volver al inicio
          </button>
        </motion.div>
      </div>
    </div>
  );
}
