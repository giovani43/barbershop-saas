import { useState } from "react";

const API = "https://web-production-d26db.up.railway.app/api/v1";

const C = {
  gold:       "#D4AF37",
  goldDim:    "rgba(212,175,55,0.12)",
  goldBorder: "rgba(212,175,55,0.35)",
  bg:         "#080808",
  card:       "#0f0f0f",
  border:     "#1e1e1e",
  text:       "#f0f0f0",
  muted:      "#666666",
  red:        "#ef4444",
  green:      "#22c55e",
};

function Field({ label, type = "text", value, onChange, placeholder, hint }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 5 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", boxSizing: "border-box",
          background: "#0a0a0a",
          border: `1.5px solid ${focused ? C.gold : C.border}`,
          borderRadius: 10, padding: "13px 14px",
          color: C.text, fontSize: 15, outline: "none",
          transition: "border-color .15s",
        }}
      />
      {hint && (
        <p style={{ color: C.muted, fontSize: 11, margin: "4px 0 0" }}>{hint}</p>
      )}
    </div>
  );
}

export default function Register() {
  const [shopName,   setShopName]   = useState("");
  const [ownerName,  setOwnerName]  = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [whatsapp,   setWhatsapp]   = useState("");
  const [password,   setPassword]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState(null);

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API}/barbershop/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_name:   shopName.trim(),
          owner_name:  ownerName.trim(),
          owner_email: ownerEmail.trim().toLowerCase(),
          password:    password,
          whatsapp:    whatsapp.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al registrar");

      // Guardar sesión del barbero (mismo formato que BarberDashboard)
      localStorage.setItem("barber_token", json.token);
      localStorage.setItem("barber_data",  JSON.stringify(json.barber));

      setSuccess(json);

      // Redirigir al dashboard después de 1.5 s
      setTimeout(() => {
        window.history.pushState({}, "", "/barber/dashboard");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }, 1500);
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
        width: "100%", maxWidth: 420,
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: "32px 28px",
      }}>
        {/* Header */}
        <p style={{
          color: C.gold, fontSize: 11, fontWeight: 700,
          letterSpacing: 3, textTransform: "uppercase",
          textAlign: "center", margin: "0 0 4px",
        }}>
          BarberOS
        </p>
        <h1 style={{
          color: C.text, fontSize: 22, fontWeight: 800,
          textAlign: "center", margin: "0 0 4px",
        }}>
          Registrá tu barbería
        </h1>
        <p style={{
          color: C.muted, fontSize: 13, textAlign: "center",
          margin: "0 0 28px",
        }}>
          Creá tu espacio en menos de un minuto
        </p>

        {success ? (
          <div style={{
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 14, padding: "20px 18px",
            textAlign: "center",
          }}>
            <p style={{ color: C.green, fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>
              ¡Todo listo!
            </p>
            <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
              Redirigiendo a tu panel...
            </p>
          </div>
        ) : (
          <>
            <Field
              label="Nombre de la barbería"
              value={shopName}
              onChange={setShopName}
              placeholder="Ej: MVZ Barbería"
            />
            <Field
              label="Tu nombre (dueño / barbero)"
              value={ownerName}
              onChange={setOwnerName}
              placeholder="Ej: Braian Resquín"
            />
            <Field
              label="Email"
              type="email"
              value={ownerEmail}
              onChange={setOwnerEmail}
              placeholder="tu@email.com"
            />
            <Field
              label="WhatsApp de la barbería"
              type="tel"
              value={whatsapp}
              onChange={setWhatsapp}
              placeholder="+549 11 1234-5678"
              hint="Número con código de país para recibir notificaciones"
            />
            <Field
              label="Contraseña"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Mínimo 6 caracteres"
            />

            {error && (
              <p style={{
                color: C.red, fontSize: 13,
                textAlign: "center", marginBottom: 12,
              }}>
                {error}
              </p>
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
                marginBottom: 14,
              }}
            >
              {loading ? "Creando cuenta..." : "Crear mi barbería"}
            </button>

            <p style={{ color: C.muted, fontSize: 12, textAlign: "center", margin: 0 }}>
              ¿Ya tenés cuenta?{" "}
              <a
                href="/barber/dashboard"
                style={{ color: C.gold, textDecoration: "none" }}
                onClick={e => {
                  e.preventDefault();
                  window.history.pushState({}, "", "/barber/dashboard");
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }}
              >
                Iniciar sesión
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
