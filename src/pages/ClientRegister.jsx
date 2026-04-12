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

function Field({ label, value, onChange, type = "text", placeholder, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 5 }}>
        {label}
      </label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", boxSizing: "border-box",
          background: "#0a0a0a", border: `1.5px solid ${C.border}`,
          borderRadius: 10, padding: "13px 14px",
          color: C.text, fontSize: 15, outline: "none",
        }}
        onFocus={e => { e.target.style.borderColor = C.gold; }}
        onBlur={e  => { e.target.style.borderColor = C.border; }}
      />
      {hint && <p style={{ color: C.muted, fontSize: 11, margin: "4px 0 0" }}>{hint}</p>}
    </div>
  );
}

export default function ClientRegister() {
  const [nombre,   setNombre]   = useState("");
  const [dni,      setDni]      = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const submit = async () => {
    setError("");
    if (!nombre.trim() || !dni.trim() || !whatsapp.trim() || !password || !confirm) {
      setError("Completá todos los campos");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

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
      const ct   = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        throw new Error(`Error del servidor (${res.status}). Intentá de nuevo.`);
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al registrarse");

      localStorage.setItem("client_token", json.token);
      localStorage.setItem("client_user",  JSON.stringify(json.user));
      navigate("/");
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
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ color: C.gold, fontSize: 11, fontWeight: 700,
                      letterSpacing: 3, textTransform: "uppercase", margin: "0 0 4px" }}>
            Reservas online
          </p>
          <h1 style={{ color: C.text, fontSize: 24, fontWeight: 900, margin: 0 }}>
            Crear cuenta
          </h1>
          <p style={{ color: C.muted, fontSize: 13, margin: "8px 0 0" }}>
            Registrate para reservar tu turno
          </p>
        </div>

        <Field
          label="Nombre completo"
          value={nombre} onChange={setNombre}
          placeholder="Juan García"
        />
        <Field
          label="DNI (sin puntos)"
          value={dni} onChange={setDni}
          type="tel" placeholder="38123456"
        />
        <Field
          label="WhatsApp"
          value={whatsapp} onChange={setWhatsapp}
          type="tel" placeholder="+549 11 1234-5678"
          hint="Incluí el prefijo +54 9 y código de área"
        />
        <Field
          label="Contraseña"
          value={password} onChange={setPassword}
          type="password" placeholder="Mínimo 6 caracteres"
        />
        <Field
          label="Confirmar contraseña"
          value={confirm} onChange={setConfirm}
          type="password" placeholder="Repetí tu contraseña"
        />

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
          {loading ? "Registrando..." : "Crear cuenta"}
        </button>

        <p style={{ color: C.muted, fontSize: 13, textAlign: "center", margin: 0 }}>
          ¿Ya tenés cuenta?{" "}
          <button
            onClick={() => navigate("/cliente/login")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.gold, fontSize: 13, fontWeight: 600, padding: 0,
            }}
          >
            Iniciar sesión
          </button>
        </p>
      </div>
    </div>
  );
}
