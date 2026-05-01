import { useState, useEffect, useCallback, useRef } from "react";

const API = "https://barbershop-api-vpz8.onrender.com/api/v1";

const C = {
  gold:       "#C9A84C",
  goldLight:  "#E8CC6A",
  goldDim:    "rgba(201,168,76,0.12)",
  goldBorder: "rgba(201,168,76,0.3)",
  bg:         "#0A0A0A",
  card:       "#111111",
  cardHigh:   "#1A1A1A",
  border:     "#222222",
  text:       "#FFFFFF",
  muted:      "#777777",
  red:        "#ef4444",
  redDim:     "rgba(239,68,68,0.1)",
  green:      "#22c55e",
  greenDim:   "rgba(34,197,94,0.1)",
};

const STATUS = {
  booked:      { label: "Pendiente",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  rescheduled: { label: "Reprogramado", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  available:   { label: "Disponible",   color: "#555",    bg: "transparent" },
  cancelled:   { label: "Cancelado",    color: C.red,     bg: C.redDim },
  completed:   { label: "Completado",   color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  no_show:     { label: "Ausente",      color: C.red,     bg: C.redDim },
  present:     { label: "Presente",     color: "#22c55e", bg: "rgba(34,197,94,0.18)" },
  confirmed:   { label: "Confirmado",   color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
};

function fmtPrice(p) {
  return `$${Number(p).toLocaleString("es-AR")}`;
}

/**
 * Normaliza un número de WhatsApp al formato internacional sin '+'.
 * Ej: "+54 9 11 1234-5678" → "5491112345678"
 *     "11 1234-5678"       → "5491112345678"  (asume Argentina)
 *     "9 11 1234-5678"     → "5491112345678"  (asume Argentina)
 * Compatible con wa.me en iOS, Android y escritorio.
 */
function normalizeWaNumber(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  // Ya tiene código de país Argentina (54...)
  if (digits.startsWith("54") && digits.length >= 12) return digits;
  // Tiene 0 inicial (número local erróneo) — quitar el 0
  const clean = digits.startsWith("0") ? digits.slice(1) : digits;
  // Agregar 54 (Argentina)
  return `54${clean}`;
}

function todayAR() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
}

// ── Login field helper ────────────────────────────────────────────────────────
function BarberLoginField({ label, value, set, type, ph, onEnter }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{
        color: C.muted, fontSize: 11, display: "block", marginBottom: 6,
        fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.1em",
      }}>
        {label}
      </label>
      <input
        type={type} value={value} placeholder={ph}
        onChange={e => set(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onEnter && onEnter()}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", boxSizing: "border-box",
          background: C.bg, border: `1px solid ${focused ? C.gold : C.border}`,
          borderRadius: 8, padding: "13px 14px",
          color: C.text, fontSize: 14, outline: "none",
          fontFamily: "'Inter', sans-serif",
          transition: "border-color 0.2s",
        }}
      />
    </div>
  );
}

// ── Login screen ──────────────────────────────────────────────────────────────
function BarberLogin({ onLogin }) {
  const [slug,     setSlug]     = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API}/barber/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ slug: slug.trim().toLowerCase(), password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      localStorage.setItem("barber_token",  json.token);
      localStorage.setItem("barber_data",   JSON.stringify(json.barber));
      onLogin(json.token, json.barber);
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
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: 16,
    }}>
      <div style={{
        width: "100%", maxWidth: 380,
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: 32,
      }}>
        {/* Logo */}
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          border: `2px solid ${C.gold}`,
          background: "linear-gradient(135deg, #1a1508, #2d2010)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 18px", overflow: "hidden",
          boxShadow: `0 0 20px rgba(201,168,76,0.15)`,
        }}>
          <img src="/logo.jpg" alt="MVZ"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => {
              e.target.style.display = "none";
              e.target.parentElement.innerHTML = `<span style="font-size:16px;font-weight:800;color:${C.gold};font-family:'Playfair Display',serif">MVZ</span>`;
            }}
          />
        </div>
        <p style={{
          color: C.gold, fontSize: 9, fontWeight: 700,
          letterSpacing: "0.3em", textTransform: "uppercase",
          textAlign: "center", margin: "0 0 4px",
          fontFamily: "'Inter', sans-serif",
        }}>
          Panel Barbero
        </p>
        <h1 style={{
          color: C.text, fontSize: 20, fontWeight: 700,
          textAlign: "center", margin: "0 0 28px",
          fontFamily: "'Playfair Display', Georgia, serif",
          letterSpacing: "0.08em",
        }}>
          MVZ Barbería
        </h1>

        {[
          { label: "Tu usuario (slug)", value: slug, set: setSlug, type: "text", ph: "ej: juan-perez" },
          { label: "Contraseña",        value: password, set: setPassword, type: "password", ph: "••••••••" },
        ].map(({ label, value, set, type, ph }) => (
          <BarberLoginField key={label} label={label} value={value} set={set} type={type} ph={ph} onEnter={submit} />
        ))}

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: "10px 14px", marginBottom: 14,
          }}>
            <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        <button onClick={submit} disabled={loading} style={{
          width: "100%", padding: 15,
          background: loading ? "#2a2a2a" : `linear-gradient(135deg, ${C.gold}, #8a6a1e)`,
          border: "none", borderRadius: 8,
          color: loading ? C.muted : "#000",
          fontWeight: 700, fontSize: 12,
          letterSpacing: "0.2em", textTransform: "uppercase",
          cursor: loading ? "default" : "pointer",
          fontFamily: "'Inter', sans-serif",
          marginBottom: 14,
        }}>
          {loading ? "Entrando..." : "Ingresar"}
        </button>

        <p style={{ color: C.muted, fontSize: 12, textAlign: "center", margin: 0 }}>
          ¿Sos una barbería nueva?{" "}
          <a
            href="/register"
            style={{ color: C.gold, textDecoration: "none" }}
            onClick={e => {
              e.preventDefault();
              window.history.pushState({}, "", "/register");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
          >
            Registrate acá
          </a>
        </p>
      </div>
    </div>
  );
}

// ── QR Scanner ───────────────────────────────────────────────────────────────
function QRScanner({ token, onClose }) {
  const [phase,      setPhase]      = useState("scanning"); // scanning|loading|found|confirmed|error
  const [apptData,   setApptData]   = useState(null);
  const [errMsg,     setErrMsg]     = useState("");
  const [confirming, setConfirming] = useState(false);
  const scannerRef  = useRef(null);
  const scannedRef  = useRef(false);

  useEffect(() => {
    let scanner;
    let mounted = true;

    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        scanner = new Html5Qrcode("qr-reader-barber");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            if (scannedRef.current) return;
            scannedRef.current = true;
            scanner.stop().catch(() => {});
            if (mounted) handleScan(decodedText);
          },
          () => {} // ignorar errores de frame
        );
      } catch {
        if (mounted) {
          setErrMsg("No se pudo acceder a la cámara. Verificá los permisos.");
          setPhase("error");
        }
      }
    };

    initScanner();
    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScan = async (rawText) => {
    // El QR puede ser solo el token UUID o una URL que lo contiene
    const qrToken = rawText.includes("/") ? rawText.split("/").pop() : rawText;
    setPhase("loading");
    try {
      const res  = await fetch(`${API}/appointments/verify/${qrToken}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error(`Error del servidor (${res.status})`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      setApptData({ ...json, qr_token: qrToken });
      setPhase("found");
    } catch (e) {
      setErrMsg(e.message);
      setPhase("error");
    }
  };

  const confirmPresence = async () => {
    setConfirming(true);
    try {
      const res  = await fetch(`${API}/appointments/verify/${apptData.qr_token}`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error(`Error del servidor (${res.status})`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      setPhase("confirmed");
    } catch (e) {
      setErrMsg(e.message);
      setPhase("error");
    } finally {
      setConfirming(false);
    }
  };

  const resetScanner = () => {
    scannedRef.current = false;
    setApptData(null);
    setErrMsg("");
    setPhase("scanning");
    // Re-iniciar cámara
    if (scannerRef.current) {
      scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          scannerRef.current.stop().catch(() => {});
          handleScan(decodedText);
        },
        () => {}
      ).catch(() => {});
    }
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.95)",
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", zIndex:300, padding:20,
    }}>
      <div style={{
        width:"100%", maxWidth:400,
        background:"#141414", borderRadius:20,
        padding:24, position:"relative",
      }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ color:C.text, fontSize:17, fontWeight:700, margin:0 }}>
            Escanear QR
          </h3>
          <button onClick={onClose} style={{
            background:"none", border:"none", color:C.muted,
            fontSize:26, cursor:"pointer", lineHeight:1, padding:4,
          }}>×</button>
        </div>

        {/* Visor de cámara (siempre montado, oculto cuando no escanea) */}
        <div
          id="qr-reader-barber"
          style={{
            width:"100%", borderRadius:12, overflow:"hidden",
            display: phase === "scanning" ? "block" : "none",
            background:"#000",
            minHeight: 240,
          }}
        />

        {/* Estado: cargando después de escanear */}
        {phase === "loading" && (
          <div style={{ padding:"40px 0", textAlign:"center" }}>
            <p style={{ color:C.muted, fontSize:14 }}>Verificando turno...</p>
          </div>
        )}

        {/* Estado: turno encontrado */}
        {phase === "found" && apptData && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            <div style={{
              background:"#0a0a0a", borderRadius:12, padding:16, marginBottom:16,
            }}>
              <p style={{ color:C.muted, fontSize:11, margin:"0 0 10px", textTransform:"uppercase", letterSpacing:1 }}>
                Datos del turno
              </p>
              {[
                { label:"Cliente",  value: apptData.client_name || "—" },
                { label:"Servicio", value: apptData.service_name },
                { label:"Barbero",  value: apptData.barber_name },
                { label:"Día",      value: apptData.fecha },
                { label:"Hora",     value: apptData.hora },
                { label:"Código",   value: apptData.booking_code },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display:"flex", justifyContent:"space-between",
                  padding:"5px 0", borderBottom:`1px solid #1a1a1a`,
                }}>
                  <span style={{ color:C.muted,  fontSize:13 }}>{label}</span>
                  <span style={{ color:C.text,   fontSize:13, fontWeight:600 }}>{value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={confirmPresence}
              disabled={confirming}
              style={{
                width:"100%", padding:14,
                background: confirming ? "#333" : `linear-gradient(135deg, #22c55e, #16a34a)`,
                border:"none", borderRadius:12,
                color: confirming ? C.muted : "#fff",
                fontWeight:800, fontSize:15, cursor: confirming ? "default" : "pointer",
              }}
            >
              {confirming ? "Confirmando..." : "✓ Confirmar presencia"}
            </button>
          </div>
        )}

        {/* Estado: confirmado */}
        {phase === "confirmed" && (
          <div style={{ padding:"20px 0", textAlign:"center" }}>
            <div style={{
              width:64, height:64, borderRadius:"50%",
              background:"rgba(34,197,94,0.15)", border:`2px solid ${C.green}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              margin:"0 auto 16px",
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
                   stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p style={{ color:C.green, fontSize:17, fontWeight:700, margin:"0 0 6px" }}>
              ¡Presencia confirmada!
            </p>
            <p style={{ color:C.muted, fontSize:13, margin:"0 0 20px" }}>
              El turno fue marcado como presente
            </p>
            <button
              onClick={onClose}
              style={{
                width:"100%", padding:13,
                background:`linear-gradient(135deg, ${C.gold}, #8a6a1e)`,
                border:"none", borderRadius:12,
                color:"#000", fontWeight:800, fontSize:14, cursor:"pointer",
              }}
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Estado: error */}
        {phase === "error" && (
          <div style={{ padding:"20px 0", textAlign:"center" }}>
            <p style={{ color:C.red, fontSize:15, fontWeight:600, margin:"0 0 8px" }}>
              {errMsg || "Error al verificar el QR"}
            </p>
            <button
              onClick={resetScanner}
              style={{
                width:"100%", padding:13,
                background:`linear-gradient(135deg, ${C.gold}, #8a6a1e)`,
                border:"none", borderRadius:12,
                color:"#000", fontWeight:800, fontSize:14, cursor:"pointer",
                marginBottom:10,
              }}
            >
              Escanear otro QR
            </button>
            <button
              onClick={onClose}
              style={{
                width:"100%", padding:11,
                background:"transparent", border:`1px solid ${C.border}`,
                borderRadius:12, color:C.muted,
                fontWeight:600, fontSize:13, cursor:"pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Instrucción debajo del visor */}
        {phase === "scanning" && (
          <p style={{
            color:C.muted, fontSize:12, textAlign:"center",
            margin:"12px 0 0",
          }}>
            Apuntá la cámara al código QR del cliente
          </p>
        )}
      </div>
    </div>
  );
}

// ── Time slots for block picker ───────────────────────────────────────────────
const TIME_SLOTS = Array.from({ length: 22 }, (_, i) => {
  const h = 9 + Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});
const REASONS = ["Descanso", "Feriado", "Personal", "Otro"];

// ── Dashboard screen ──────────────────────────────────────────────────────────
function BarberPanel({ token, barber, onLogout }) {
  const [slots,   setSlots]   = useState([]);
  const [date,    setDate]    = useState(todayAR());
  const [loading, setLoading] = useState(true);

  // QR scanner state
  const [showQR,  setShowQR]  = useState(false);

  // Blocked slots state
  const [blocks,      setBlocks]      = useState([]);
  const [blockModal,  setBlockModal]  = useState(false);
  const [blockDate,   setBlockDate]   = useState(todayAR());
  const [blockAllDay, setBlockAllDay] = useState(false);
  const [blockTime,   setBlockTime]   = useState("09:00");
  const [blockReason, setBlockReason] = useState("Descanso");
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockErr,    setBlockErr]    = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    // date is always YYYY-MM-DD (todayAR uses sv-SE locale; input[type=date] .value is ISO)
    const url     = `${API}/barber/me/day?date=${date}`;
    const headers = { Authorization: `Bearer ${token}` };
    console.log("[BarberDashboard] request →", url);
    console.log("[BarberDashboard] token   →", token || "(vacío)");
    console.log("[BarberDashboard] headers →", headers);
    try {
      const res  = await fetch(url, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSlots(json.slots);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [token, date]);

  const loadBlocks = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/barber/blocked-slots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBlocks(await res.json());
    } catch { /* ignore network errors */ }
  }, [token]);

  const createBlock = async () => {
    setBlockSaving(true); setBlockErr("");
    try {
      const res  = await fetch(`${API}/barber/blocked-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          date:    blockDate,
          time:    blockAllDay ? null : blockTime,
          all_day: blockAllDay,
          reason:  blockReason,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al guardar");
      setBlockModal(false);
      loadBlocks();
    } catch (e) {
      setBlockErr(e.message);
    } finally {
      setBlockSaving(false);
    }
  };

  const removeBlock = async (id) => {
    try {
      await fetch(`${API}/barber/blocked-slots/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlocks(prev => prev.filter(b => b.id !== id));
    } catch { /* ignore network errors */ }
  };

  const exportExcel = async () => {
    try {
      const res = await fetch(`${API}/barber/export-excel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Error ${res.status}`);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `turnos-${date}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`No se pudo exportar: ${e.message}`);
    }
  };

  const chargeAbsence = async (slot) => {
    if (!window.confirm("¿Registrar cargo por ausencia (30% del precio)?")) return;
    try {
      const res  = await fetch(`${API}/barber/appointments/${slot.id}/charge-absence`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");

      // Armar mensaje de WhatsApp
      const multa   = Math.round((slot.price || 0) * 0.30);
      const [y, m, d] = date.split("-");
      const fechaFmt  = `${d}/${m}/${y}`;
      const termsUrl  = "https://barbershop-saas-52q830kwn-giovani43s-projects.vercel.app/terminos";
      const msg = [
        `Hola ${slot.client_name || "cliente"} 👋, te contactamos desde MVZ Barbería.`,
        "",
        `Lamentablemente no te presentaste a tu turno del ${fechaFmt} a las ${slot.time}hs (o llegaste después de los 8 minutos de tolerancia permitidos).`,
        "",
        "De acuerdo a los Términos y Condiciones que aceptaste al reservar, se aplica una multa del 30% del valor del servicio:",
        "",
        `💈 Servicio: ${slot.service_name}`,
        `💰 Valor del servicio: $${Number(slot.price).toLocaleString("es-AR")}`,
        `⚠️ Multa (30%): $${Number(multa).toLocaleString("es-AR")}`,
        "",
        "Por favor realizá el pago al siguiente alias de Mercado Pago:",
        "👉 resquin.mvz",
        "",
        `Para más información visitá:\n${termsUrl}`,
      ].join("\n");

      if (slot.client_wa) {
        const waNumber = normalizeWaNumber(slot.client_wa);
        // wa.me funciona en iOS, Android y escritorio (abre WhatsApp Web si no hay app)
        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, "_blank");
      } else {
        alert("Cargo registrado. El cliente no tiene WhatsApp registrado.");
      }

      load();
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadBlocks(); }, [loadBlocks]);

  const ACTIVE_STATUSES = ["booked","rescheduled","present","confirmed"];
  const booked    = slots.filter(s => ACTIVE_STATUSES.includes(s.status));
  const available = slots.filter(s => s.status === "available").length;
  const revenue   = slots
    .filter(s => [...ACTIVE_STATUSES, "completed"].includes(s.status))
    .reduce((acc, s) => acc + (s.price || 0), 0);

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "0 0 40px",
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.goldBorder}`,
        padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", rowGap: 10,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Barber avatar / photo */}
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            border: `1.5px solid ${C.gold}`,
            background: C.cardHigh,
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", flexShrink: 0,
          }}>
            {barber.photo_url ? (
              <img src={barber.photo_url} alt={barber.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{
                fontSize: 15, fontWeight: 800, color: C.gold,
                fontFamily: "'Playfair Display', Georgia, serif",
              }}>
                {(barber.name || "B")[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p style={{
              color: C.gold, fontSize: 9, fontWeight: 700,
              letterSpacing: "0.25em", textTransform: "uppercase", margin: 0,
              fontFamily: "'Inter', sans-serif",
            }}>
              Panel Barbero
            </p>
            <p style={{
              color: C.text, fontSize: 15, fontWeight: 600, margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
            }}>
              {barber.name}
            </p>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button
            onClick={() => setShowQR(true)}
            style={{
              background: C.goldDim, border: `1px solid ${C.goldBorder}`,
              borderRadius: 8, padding: "8px 14px",
              color: C.gold, fontSize: 11, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Escanear QR
          </button>
          <button onClick={onLogout} style={{
            background: "transparent", border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "8px 14px",
            color: C.muted, fontSize: 11, cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}>
            Salir
          </button>
        </div>
        <input
          type="date" value={date}
          onChange={e => setDate(e.target.value)}
          style={{
            flexBasis: "100%", boxSizing: "border-box",
            background: "#0d0d0d", border: `1px solid ${C.goldBorder}`,
            borderRadius: 8, padding: "9px 12px",
            color: C.text, fontSize: 14, outline: "none",
            colorScheme: "dark",
          }}
        />
      </div>

      <div style={{ padding: "20px 16px", maxWidth: 1100, margin: "0 auto" }}>
        {/* Stats */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Reservados", value: booked.length, color: C.gold },
            { label: "Libres",     value: available,     color: C.muted },
            { label: "Ganancia",   value: fmtPrice(revenue), color: C.green },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              flex: 1, background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12, padding: "14px 8px", textAlign: "center",
            }}>
              <p style={{
                color, fontSize: 17, fontWeight: 700, margin: "0 0 3px",
                fontFamily: "'Playfair Display', Georgia, serif",
              }}>{value}</p>
              <p style={{
                color: C.muted, fontSize: 9, margin: 0,
                textTransform: "uppercase", letterSpacing: "0.15em",
                fontFamily: "'Inter', sans-serif",
              }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Export Excel */}
        <button
          onClick={exportExcel}
          style={{
            width: "100%", marginBottom: 20,
            background: "transparent", border: `1px solid ${C.goldBorder}`,
            borderRadius: 10, padding: "10px 16px",
            color: C.gold, fontSize: 12, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontFamily: "'Inter', sans-serif", letterSpacing: "0.08em",
            boxSizing: "border-box",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar Excel
        </button>

        {/* Slot table */}
        {loading ? (
          <p style={{ color: C.muted, textAlign: "center" }}>Cargando...</p>
        ) : slots.length === 0 ? (
          <p style={{ color: C.muted, textAlign: "center", fontSize: 14 }}>
            No hay turnos para este día
          </p>
        ) : (
          <div style={{
            overflowX: "auto", WebkitOverflowScrolling: "touch",
            borderRadius: 12, border: `1px solid ${C.border}`,
          }}>
            <table style={{
              width: "100%", borderCollapse: "collapse", minWidth: 760,
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}>
              <thead>
                <tr style={{ background: "#161616", borderBottom: `1px solid ${C.goldBorder}` }}>
                  {["Hora","Cliente","DNI","Teléfono","Servicio","Precio","Pago","Estado","Acciones"].map(h => (
                    <th key={h} style={{
                      padding: "10px 12px", textAlign: "left",
                      color: C.gold, fontSize: 10, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...slots].sort((a, b) => (a.time || "").localeCompare(b.time || "")).map((slot, idx) => {
                  const st = STATUS[slot.status] || STATUS.available;
                  const hasClient = ["booked","rescheduled","no_show","cancelled","present","confirmed","completed"].includes(slot.status);
                  const canCharge = slot.status === "no_show" && !slot.absence_charge_sent;
                  return (
                    <tr key={slot.id} style={{
                      background: idx % 2 === 0 ? C.card : "#131313",
                      borderBottom: `1px solid ${C.border}`,
                      opacity: slot.status === "available" ? 0.4 : 1,
                    }}>
                      <td style={{ padding: "11px 12px", color: C.gold, fontWeight: 800, fontSize: 15, whiteSpace: "nowrap" }}>
                        {slot.time}
                      </td>
                      <td style={{ padding: "11px 12px", color: C.text, fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>
                        {hasClient ? (slot.client_name || "—") : "—"}
                      </td>
                      <td style={{ padding: "11px 12px", color: C.muted, fontSize: 12, whiteSpace: "nowrap" }}>
                        {slot.client_dni || "—"}
                      </td>
                      <td style={{ padding: "11px 12px", fontSize: 12, whiteSpace: "nowrap" }}>
                        {slot.client_wa ? (
                          <a
                            href={`https://wa.me/${normalizeWaNumber(slot.client_wa)}`}
                            target="_blank" rel="noreferrer"
                            style={{ color: C.green, textDecoration: "none" }}
                          >
                            {slot.client_wa}
                          </a>
                        ) : (
                          <span style={{ color: C.muted }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "11px 12px", color: C.text, fontSize: 12, whiteSpace: "nowrap" }}>
                        {slot.service_name || "—"}
                      </td>
                      <td style={{ padding: "11px 12px", color: C.text, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {hasClient ? fmtPrice(slot.price) : "—"}
                      </td>
                      <td style={{ padding: "11px 12px", color: C.muted, fontSize: 12, whiteSpace: "nowrap" }}>
                        {hasClient ? "Efectivo / MP" : "—"}
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <span style={{
                          display: "inline-block",
                          background: st.bg, color: st.color,
                          borderRadius: 20, padding: "3px 10px",
                          fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                        }}>
                          {st.label}
                        </span>
                        {slot.absence_charge_sent && (
                          <div style={{ color: C.red, fontSize: 10, fontWeight: 600, marginTop: 3, whiteSpace: "nowrap" }}>
                            Cargo: {fmtPrice(slot.absence_charge_amount)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {hasClient && (
                            <button
                              onClick={() => setShowQR(true)}
                              title="Escanear QR del cliente"
                              style={{
                                background: C.goldDim, border: `1px solid ${C.goldBorder}`,
                                borderRadius: 7, padding: "6px 10px",
                                color: C.gold, fontSize: 11, fontWeight: 700,
                                cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                   stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" rx="1"/>
                                <rect x="14" y="3" width="7" height="7" rx="1"/>
                                <rect x="14" y="14" width="7" height="7" rx="1"/>
                                <rect x="3" y="14" width="7" height="7" rx="1"/>
                              </svg>
                              QR
                            </button>
                          )}
                          {canCharge && (
                            <button
                              onClick={() => chargeAbsence(slot)}
                              title="Cobrar cargo por ausencia (30%)"
                              style={{
                                background: "rgba(249,115,22,0.12)",
                                border: "1px solid rgba(249,115,22,0.4)",
                                borderRadius: 7, padding: "6px 10px",
                                color: "#f97316", fontSize: 11, fontWeight: 700, cursor: "pointer",
                              }}
                            >
                              30%
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Bloquear horarios ─────────────────────────────────────────────── */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: 0 }}>
              Bloquear horarios
            </p>
            <button
              onClick={() => { setBlockModal(true); setBlockErr(""); setBlockAllDay(false); setBlockDate(todayAR()); }}
              style={{
                background: C.goldDim, border: `1px solid ${C.goldBorder}`,
                borderRadius: 8, padding: "6px 14px",
                color: C.gold, fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >
              + Bloquear
            </button>
          </div>

          {blocks.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 12, textAlign: "center", padding: "10px 0" }}>
              No tenés horarios bloqueados
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {blocks.map(b => (
                <div key={b.id} style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: "10px 14px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <p style={{ color: C.text, fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>
                      {b.date} · {b.all_day ? "Todo el día" : (b.time || "").slice(0, 5)}
                    </p>
                    {b.reason && (
                      <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>{b.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeBlock(b.id)}
                    style={{
                      background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: 7, padding: "5px 12px",
                      color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                    </svg>
                    Desbloquear
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── QR Scanner ───────────────────────────────────────────────────────── */}
      {showQR && (
        <QRScanner token={token} onClose={() => { setShowQR(false); load(); }} />
      )}

      {/* ── Modal bloqueo ─────────────────────────────────────────────────────── */}
      {blockModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          zIndex: 200,
        }}>
          <div style={{
            background: "#141414", borderRadius: "20px 20px 0 0",
            width: "100%", maxWidth: 480,
            padding: "24px 20px 44px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: 0 }}>
                Bloquear horario
              </h3>
              <button onClick={() => setBlockModal(false)} style={{
                background: "none", border: "none", color: C.muted,
                fontSize: 24, cursor: "pointer", lineHeight: 1, padding: 4,
              }}>×</button>
            </div>

            {/* Fecha */}
            <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 5 }}>Fecha</label>
            <input
              type="date" value={blockDate} min={todayAR()}
              onChange={e => setBlockDate(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#0a0a0a", border: `1.5px solid ${C.border}`,
                borderRadius: 9, padding: "11px 12px",
                color: C.text, fontSize: 14, outline: "none", marginBottom: 14,
              }}
            />

            {/* Todo el día checkbox */}
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 14 }}>
              <div
                onClick={() => setBlockAllDay(v => !v)}
                style={{
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                  border: `2px solid ${blockAllDay ? C.gold : C.border}`,
                  background: blockAllDay ? C.gold : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all .15s",
                }}
              >
                {blockAllDay && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                       stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              <span style={{ color: C.text, fontSize: 14 }}>Todo el día</span>
            </label>

            {/* Horario (si no es todo el día) */}
            {!blockAllDay && (
              <>
                <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 5 }}>Horario</label>
                <select
                  value={blockTime}
                  onChange={e => setBlockTime(e.target.value)}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "#0a0a0a", border: `1.5px solid ${C.border}`,
                    borderRadius: 9, padding: "11px 12px",
                    color: C.text, fontSize: 14, outline: "none", marginBottom: 14,
                    appearance: "none",
                  }}
                >
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </>
            )}

            {/* Motivo */}
            <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 5 }}>Motivo</label>
            <select
              value={blockReason}
              onChange={e => setBlockReason(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#0a0a0a", border: `1.5px solid ${C.border}`,
                borderRadius: 9, padding: "11px 12px",
                color: C.text, fontSize: 14, outline: "none", marginBottom: 20,
                appearance: "none",
              }}
            >
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            {blockErr && (
              <p style={{ color: C.red, fontSize: 13, textAlign: "center", marginBottom: 12 }}>
                {blockErr}
              </p>
            )}

            <button
              onClick={createBlock}
              disabled={blockSaving}
              style={{
                width: "100%", padding: 15,
                background: blockSaving ? "#333" : `linear-gradient(135deg, ${C.gold}, #8a6a1e)`,
                border: "none", borderRadius: 12,
                color: blockSaving ? C.muted : "#000",
                fontWeight: 800, fontSize: 15, cursor: blockSaving ? "default" : "pointer",
              }}
            >
              {blockSaving ? "Guardando..." : "Confirmar bloqueo"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root: login guard ─────────────────────────────────────────────────────────
export default function BarberDashboard() {
  const [token,  setToken]  = useState(() => localStorage.getItem("barber_token") || "");
  const [barber, setBarber] = useState(() => {
    try { return JSON.parse(localStorage.getItem("barber_data") || "null"); }
    catch { return null; }
  });

  const handleLogin = (t, b) => { setToken(t); setBarber(b); };
  const handleLogout = () => {
    localStorage.removeItem("barber_token");
    localStorage.removeItem("barber_data");
    setToken(""); setBarber(null);
  };

  if (!token || !barber) return <BarberLogin onLogin={handleLogin} />;
  return <BarberPanel token={token} barber={barber} onLogout={handleLogout} />;
}
