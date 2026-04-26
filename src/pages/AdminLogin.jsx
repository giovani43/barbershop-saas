import { useState } from "react";

const API = "https://barbershop-api-vpz8.onrender.com/api/v1";

const C = {
  gold:      "#C9A84C",
  goldDim:   "rgba(201,168,76,0.12)",
  goldBorder:"rgba(201,168,76,0.3)",
  bg:        "#0A0A0A",
  card:      "#111111",
  border:    "#222222",
  text:      "#FFFFFF",
  muted:     "#777777",
  red:       "#ef4444",
};

function Field({ label, value, onChange, type = "text", placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ color:C.muted, fontSize:12, display:"block", marginBottom:5 }}>
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
          width:"100%", boxSizing:"border-box",
          background:C.card, border:`1.5px solid ${focused ? C.gold : C.border}`,
          borderRadius:10, padding:"13px 14px",
          color:C.text, fontSize:15, outline:"none",
          transition:"border-color .15s",
        }}
      />
    </div>
  );
}

export default function AdminLogin({ onLogin }) {
  const [mode, setMode]   = useState("login"); // "login" | "register"
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Login fields
  const [slug,     setSlug]     = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [regName,     setRegName]     = useState("");
  const [regAddr,     setRegAddr]     = useState("");
  const [regWa,       setRegWa]       = useState("");
  const [regPass,     setRegPass]     = useState("");
  const [regPlan,     setRegPlan]     = useState("solo");

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      let url, body;
      if (mode === "login") {
        url  = `${API}/admin/login`;
        body = { shop_slug: slug.trim(), password: password.trim() };
      } else {
        if (!regName.trim() || !regPass.trim()) {
          setError("Nombre y contraseña son obligatorios");
          setLoading(false);
          return;
        }
        url  = `${API}/admin/register`;
        body = {
          name:     regName.trim(),
          address:  regAddr.trim(),
          whatsapp: regWa.trim(),
          password: regPass.trim(),
          plan:     regPlan,
        };
      }

      const res  = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      localStorage.setItem("admin_token", json.token);
      localStorage.setItem("admin_shop",  JSON.stringify(json.shop));
      onLogin(json.token, json.shop);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:"100vh", background:C.bg,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      padding:16,
    }}>
      <style>{`input::placeholder{color:#444}`}</style>
      <div style={{
        width:"100%", maxWidth:400,
        background:C.card, border:`1px solid ${C.border}`,
        borderRadius:20, padding:32,
        animation:"fadeUp .35s ease",
      }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <p style={{ color:C.gold, fontSize:11, fontWeight:700,
                      letterSpacing:3, textTransform:"uppercase", margin:"0 0 4px" }}>
            Panel Admin
          </p>
          <h1 style={{ color:C.text, fontSize:24, fontWeight:800, margin:0 }}>
            BarberOS
          </h1>
        </div>

        {/* Mode toggle */}
        <div style={{
          display:"flex", background:"#080808",
          borderRadius:10, padding:3, marginBottom:24,
        }}>
          {["login","register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
              flex:1, padding:"8px", borderRadius:8,
              background: mode === m ? C.card : "transparent",
              border:     "none",
              color:      mode === m ? C.text : C.muted,
              fontWeight: mode === m ? 600 : 400,
              fontSize:   13, cursor:"pointer",
              transition: "all .15s",
            }}>
              {m === "login" ? "Iniciar sesión" : "Registrarse"}
            </button>
          ))}
        </div>

        {mode === "login" ? (
          <>
            <Field label="Slug de tu barbería" value={slug} onChange={setSlug}
                   placeholder="ej: barberpro" />
            <Field label="Contraseña" value={password} onChange={setPassword}
                   type="password" placeholder="••••••••" />
          </>
        ) : (
          <>
            <Field label="Nombre del negocio *" value={regName} onChange={setRegName}
                   placeholder="ej: BarberPro" />
            <div style={{ marginBottom:14 }}>
              <label style={{ color:C.muted, fontSize:12, display:"block", marginBottom:5 }}>
                Plan
              </label>
              <div style={{ display:"flex", gap:8 }}>
                {[["solo","Barbero solo"],["shop","Barbería completa"]].map(([val,lbl]) => (
                  <button key={val} onClick={() => setRegPlan(val)} style={{
                    flex:1, padding:"10px 8px", borderRadius:10,
                    background: regPlan === val ? C.goldDim : "transparent",
                    border:     `1.5px solid ${regPlan === val ? C.gold : C.border}`,
                    color:      regPlan === val ? C.gold : C.muted,
                    fontSize:   12, fontWeight: regPlan === val ? 700 : 400,
                    cursor:"pointer",
                  }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Dirección" value={regAddr} onChange={setRegAddr}
                   placeholder="Av. Corrientes 1234, CABA" />
            <Field label="WhatsApp" value={regWa} onChange={setRegWa}
                   placeholder="+54 9 11 1234-5678" type="tel" />
            <Field label="Contraseña *" value={regPass} onChange={setRegPass}
                   type="password" placeholder="Mínimo 8 caracteres" />
          </>
        )}

        {error && (
          <p style={{ color:C.red, fontSize:13, textAlign:"center", marginBottom:12 }}>
            {error}
          </p>
        )}

        <button onClick={submit} disabled={loading} style={{
          width:"100%", padding:15,
          background: loading ? "#2a2a2a" : `linear-gradient(135deg, ${C.gold}, #8a6a1e)`,
          border:"none", borderRadius:12,
          color: loading ? C.muted : "#000",
          fontWeight:800, fontSize:14, cursor: loading ? "default" : "pointer",
          letterSpacing:.5, transition:"all .2s",
        }}>
          {loading ? "..." : mode === "login" ? "Ingresar" : "Crear cuenta"}
        </button>

        {mode === "login" && (
          <p style={{ color:"#444", fontSize:11, textAlign:"center", marginTop:16 }}>
            Demo: slug <strong style={{color:"#666"}}>barberpro</strong> · pass <strong style={{color:"#666"}}>admin123</strong>
          </p>
        )}
      </div>
    </div>
  );
}
