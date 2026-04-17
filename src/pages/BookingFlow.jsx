import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import GlobalFooterBar from "../components/GlobalFooterBar";

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom gold marker
const goldIcon = new L.Icon({
  iconUrl:       "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize:      [25, 41],
  iconAnchor:    [12, 41],
  popupAnchor:   [1, -34],
  shadowSize:    [41, 41],
});

const API = "https://web-production-d26db.up.railway.app/api/v1";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  gold:        "#C9A84C",
  goldLight:   "#E8CC6A",
  goldDim:     "rgba(201,168,76,0.12)",
  goldBorder:  "rgba(201,168,76,0.3)",
  bg:          "#0A0A0A",
  card:        "#111111",
  cardHigh:    "#1A1A1A",
  border:      "#222222",
  text:        "#FFFFFF",
  muted:       "#777777",
  green:       "#22c55e",
  greenDim:    "rgba(34,197,94,0.12)",
  red:         "#ef4444",
};

const DAYS_SHORT  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS_SHORT = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function labelDate(dateStr, idx) {
  if (idx === 0) return "Hoy";
  if (idx === 1) return "Mañana";
  const d = new Date(dateStr + "T00:00:00");
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()}`;
}
function humanDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} de ${MONTHS_SHORT[d.getMonth()]}`;
}
function fmtPrice(p) {
  return `$${Number(p).toLocaleString("es-AR")}`;
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function Progress({ step, total = 4 }) {
  return (
    <div style={{ display:"flex", gap:6, justifyContent:"center", padding:"16px 0 8px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i < step ? 24 : 8,
          height: 8,
          borderRadius: 4,
          background: i < step ? C.gold : C.border,
          transition: "all .3s ease",
        }} />
      ))}
    </div>
  );
}

// ── Back button ───────────────────────────────────────────────────────────────
function BackBtn({ onClick, label = "Atrás" }) {
  return (
    <button onClick={onClick} style={{
      background: "none", border: "none", cursor: "pointer",
      color: C.muted, display:"flex", alignItems:"center", gap:6,
      fontSize:14, padding:"12px 20px 0",
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      {label}
    </button>
  );
}

// ── Step 0: Identify (DNI lookup / register) + Mis Turnos ────────────────────

function MisTurnosPanel({ userData, dni, onBack, onClose }) {
  const { active_appt: initActive, history } = userData;
  const [active, setActive]       = useState(initActive);
  const [cancelState, setCancelState] = useState("idle"); // idle|confirming|loading|done|error
  const [cancelMsg,   setCancelMsg]   = useState("");
  const [reschedOpen, setReschedOpen] = useState(false);
  const [reschedDate, setReschedDate] = useState(todayStr());
  const [reschedSlots,setReschedSlots]= useState([]);
  const [reschedLoad, setReschedLoad] = useState(false);
  const [reschedMsg,  setReschedMsg]  = useState("");

  const STATUS_LABEL = {
    booked:"Reservado", rescheduled:"Reprogramado",
    completed:"Completado", cancelled:"Cancelado", no_show:"No asistió",
  };
  const STATUS_COLOR = {
    booked: C.green, rescheduled:"#f59e0b",
    completed: C.muted, cancelled: C.red, no_show: C.red,
  };

  const doCancel = async () => {
    setCancelState("loading");
    try {
      const res  = await fetch(`${API}/appointments/${active.id}/cancel`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ dni: dni.replace(/\./g,"").trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || "Error");
      setCancelState("done");
      setCancelMsg("Turno cancelado correctamente.");
      setActive(null);
    } catch(e) { setCancelState("error"); setCancelMsg(e.message); }
  };

  const loadReschedSlots = async (d) => {
    setReschedLoad(true);
    try {
      const res  = await fetch(`${API}/appointments/day?barber_id=${active.barber_id}&date=${d}`);
      const json = await res.json();
      setReschedSlots((json.slots||[]).filter(s=>s.status==="available"));
    } catch { setReschedSlots([]); }
    finally  { setReschedLoad(false); }
  };

  const doReschedule = async (slotId) => {
    setReschedLoad(true); setReschedMsg("");
    try {
      const res  = await fetch(`${API}/appointments/${active.id}/reschedule`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ dni: dni.replace(/\./g,"").trim(), new_slot_id: slotId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || "Error");
      setActive(prev => ({ ...prev, ...json.appointment, can_cancel:true, can_reschedule:false }));
      setReschedOpen(false);
      setReschedMsg("¡Turno reprogramado!");
    } catch(e) { setReschedMsg(e.message); }
    finally    { setReschedLoad(false); }
  };

  return (
    <div style={{ padding:"0 16px 40px", animation:"fadeUp .35s ease", position:"relative" }}>

      {/* X — cerrar y volver al splash */}
      {onClose && (
        <button onClick={onClose} style={{
          position:"absolute", top:8, right:0,
          width:44, height:44,
          background:"transparent", border:`1px solid ${C.border}`,
          borderRadius:"50%", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          color:C.muted, transition:"border-color .15s, color .15s",
          flexShrink:0,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor=C.goldBorder; e.currentTarget.style.color=C.text; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor=C.border;     e.currentTarget.style.color=C.muted; }}
        aria-label="Cerrar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}

      <button onClick={onBack} style={{
        background:"none", border:"none", cursor:"pointer",
        color:C.muted, fontSize:13, padding:"12px 0 16px",
        display:"flex", alignItems:"center", gap:6,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Volver
      </button>

      <h2 style={{ color:C.text, fontSize:20, fontWeight:800, margin:"0 0 4px" }}>Mis turnos</h2>
      <p style={{ color:C.muted, fontSize:12, margin:"0 0 24px" }}>DNI {dni}</p>

      {/* Turno activo */}
      {active && cancelState !== "done" && (
        <div style={{
          background:C.card, border:`1px solid ${C.goldBorder}`,
          borderRadius:16, padding:"16px 18px", marginBottom:20,
        }}>
          <p style={{ color:C.gold, fontSize:10, fontWeight:700, letterSpacing:2,
                      textTransform:"uppercase", margin:"0 0 10px" }}>Turno activo</p>

          {/* QR */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}>
            <div style={{ background:"#fff", borderRadius:12, padding:8, display:"inline-block" }}>
              <img src={`${API}/appointments/${active.id}/qr`} alt="QR"
                   style={{ width:130, height:130, display:"block" }} />
            </div>
          </div>
          <div style={{ textAlign:"center", marginBottom:14 }}>
            <a href={`${API}/appointments/${active.id}/qr`}
               download={`turno-${active.booking_code}.png`}
               style={{ color:C.muted, fontSize:11, textDecoration:"underline" }}>
              Descargar QR
            </a>
          </div>

          {/* Badge código */}
          <div style={{
            background:C.goldDim, border:`1px solid ${C.goldBorder}`,
            borderRadius:8, padding:"5px 14px", marginBottom:14,
            display:"inline-flex", alignItems:"center", gap:8,
          }}>
            <span style={{ color:C.muted, fontSize:11 }}>Código</span>
            <span style={{ color:C.gold, fontSize:17, fontWeight:800 }}>{active.booking_code||"—"}</span>
          </div>

          {/* Detalles */}
          {[
            ["Barbero",  active.barber_name],
            ["Servicio", active.service_name],
            ["Precio",   fmtPrice(active.price)],
            ["Fecha",    active.date],
            ["Hora",     active.time],
          ].map(([k,v]) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between",
                                  padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
              <span style={{ color:C.muted, fontSize:12 }}>{k}</span>
              <span style={{ color:C.text,  fontSize:12, fontWeight:600 }}>{v}</span>
            </div>
          ))}

          {/* Acciones */}
          {cancelState === "error" && (
            <p style={{ color:C.red, fontSize:12, marginTop:10 }}>{cancelMsg}</p>
          )}

          {/* Ventana cerrada: no se puede cancelar ni reprogramar */}
          {!active.can_cancel && cancelState !== "confirming" && cancelState !== "loading" && (
            <div style={{
              marginTop:14, background:"rgba(239,68,68,0.07)",
              border:"1px solid rgba(239,68,68,0.25)",
              borderRadius:10, padding:"10px 14px",
            }}>
              <p style={{ color:C.red, fontSize:12, margin:0, lineHeight:1.5 }}>
                Ya no podés cancelar ni reprogramar. Faltan menos de 90 minutos para tu turno.
                En caso de no presentarte se aplicará una multa del 30%
                {active.absence_fee ? ` (${fmtPrice(active.absence_fee)})` : ""}.
              </p>
            </div>
          )}

          {cancelState === "confirming" ? (
            <div style={{ marginTop:14 }}>
              <p style={{ color:C.text, fontSize:13, marginBottom:12, textAlign:"center" }}>
                ¿Confirmás la cancelación?<br/>
                <span style={{ color:C.green, fontWeight:600 }}>No se aplicará ningún cargo.</span>
              </p>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setCancelState("idle")} style={{
                  flex:1, padding:"10px", background:"transparent",
                  border:`1px solid ${C.border}`, borderRadius:10, color:C.muted, fontSize:13, cursor:"pointer",
                }}>Volver</button>
                <button onClick={doCancel} style={{
                  flex:1, padding:"10px",
                  background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.4)",
                  borderRadius:10, color:C.red, fontWeight:700, fontSize:13, cursor:"pointer",
                }}>Sí, cancelar</button>
              </div>
            </div>
          ) : cancelState !== "loading" && (
            <div style={{ marginTop:14, display:"flex", gap:8 }}>
              {active.can_cancel && (
                <button onClick={() => setCancelState("confirming")} style={{
                  flex:1, padding:"11px",
                  background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)",
                  borderRadius:10, color:C.red, fontWeight:700, fontSize:13, cursor:"pointer",
                }}>Cancelar turno</button>
              )}
              {active.can_reschedule && !reschedMsg.includes("!") && (
                <button onClick={() => { setReschedOpen(true); loadReschedSlots(reschedDate); }} style={{
                  flex:1, padding:"11px",
                  background:"rgba(59,130,246,0.12)", border:"1px solid rgba(59,130,246,0.4)",
                  borderRadius:10, color:"#60a5fa", fontWeight:700, fontSize:13, cursor:"pointer",
                }}>Reprogramar</button>
              )}
            </div>
          )}
          {cancelState === "loading" && (
            <p style={{ color:C.muted, fontSize:13, marginTop:12, textAlign:"center" }}>Procesando...</p>
          )}
          {reschedMsg && (
            <p style={{ color: reschedMsg.includes("!") ? C.green : C.red,
                        fontSize:12, marginTop:10, textAlign:"center" }}>{reschedMsg}</p>
          )}
        </div>
      )}
      {cancelState === "done" && (
        <div style={{
          background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.3)",
          borderRadius:12, padding:"14px 16px", marginBottom:20, textAlign:"center",
        }}>
          <p style={{ color:C.green, fontWeight:700, fontSize:14, margin:"0 0 2px" }}>Turno cancelado</p>
          <p style={{ color:C.muted, fontSize:12, margin:0 }}>{cancelMsg}</p>
        </div>
      )}
      {!active && !cancelState.includes("done") && (
        <p style={{ color:C.muted, fontSize:13, marginBottom:20 }}>No tenés un turno activo.</p>
      )}

      {/* Historial — incluye el turno activo si existe */}
      <h3 style={{ color:C.text, fontSize:14, fontWeight:700, margin:"0 0 12px" }}>
        Historial
      </h3>
      {(() => {
        const activeRow = active && cancelState !== "done"
          ? [{ id: active.id, service_name: active.service_name, date: active.date,
               barber_name: active.barber_name, price: active.price, status: "booked" }]
          : [];
        const allItems = [...activeRow, ...history];
        return allItems.length === 0 ? (
          <p style={{ color:C.muted, fontSize:13 }}>Sin historial de reservas.</p>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {allItems.map(h => (
              <div key={h.id} style={{
                background:C.card, border:`1px solid ${C.border}`,
                borderRadius:12, padding:"12px 14px",
                display:"flex", justifyContent:"space-between", alignItems:"center",
              }}>
                <div>
                  <p style={{ color:C.text, fontSize:13, fontWeight:600, margin:"0 0 2px" }}>
                    {h.service_name}
                  </p>
                  <p style={{ color:C.muted, fontSize:11, margin:0 }}>
                    {h.date} · {h.barber_name} · {fmtPrice(h.price)}
                  </p>
                </div>
                <span style={{
                  color: STATUS_COLOR[h.status] || C.muted,
                  background:"rgba(255,255,255,0.04)",
                  border:`1px solid ${STATUS_COLOR[h.status] || C.border}22`,
                  borderRadius:20, padding:"3px 9px", fontSize:10, fontWeight:700,
                }}>
                  {STATUS_LABEL[h.status] || h.status}
                </span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Reschedule modal */}
      {reschedOpen && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.85)",
          display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:100,
        }}>
          <div style={{
            background:"#111", borderRadius:"20px 20px 0 0",
            padding:"24px 20px 36px", width:"100%", maxWidth:480,
            maxHeight:"75vh", overflowY:"auto",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h3 style={{ color:C.text, fontSize:16, fontWeight:700, margin:0 }}>Reprogramar</h3>
              <button onClick={() => setReschedOpen(false)} style={{
                background:"transparent", border:"none", color:C.muted, fontSize:22, cursor:"pointer",
              }}>×</button>
            </div>
            <input type="date" value={reschedDate}
              onChange={e => { setReschedDate(e.target.value); loadReschedSlots(e.target.value); }}
              style={{
                width:"100%", boxSizing:"border-box",
                background:"#0a0a0a", border:`1.5px solid ${C.border}`,
                borderRadius:8, padding:"10px 12px", color:C.text, fontSize:14,
                outline:"none", marginBottom:16,
              }}
            />
            {reschedLoad ? (
              <p style={{ color:C.muted, textAlign:"center" }}>Cargando...</p>
            ) : reschedSlots.length === 0 ? (
              <p style={{ color:C.muted, textAlign:"center", fontSize:13 }}>Sin horarios disponibles</p>
            ) : (
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {reschedSlots.map(s => (
                  <button key={s.id} onClick={() => doReschedule(s.id)} style={{
                    background:C.goldDim, border:`1px solid ${C.goldBorder}`,
                    borderRadius:8, padding:"10px 16px",
                    color:C.gold, fontWeight:700, fontSize:14, cursor:"pointer",
                  }}>{s.time}</button>
                ))}
              </div>
            )}
            {reschedMsg && <p style={{ color:C.red, fontSize:12, marginTop:12 }}>{reschedMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Splash screen ─────────────────────────────────────────────────────────────
function SplashStep({ shop, onBook, onMisTurnos }) {
  return (
    <div style={{
      minHeight:"80vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"40px 24px 60px", animation:"fadeUp .4s ease",
    }}>
      {/* Logo */}
      <div style={{
        width:110, height:110, borderRadius:"50%",
        overflow:"hidden", border:`3px solid ${C.goldBorder}`,
        marginBottom:24, boxShadow:`0 0 40px rgba(212,175,55,0.18)`,
        flexShrink:0,
      }}>
        <img src="/logo.jpg" alt="MVZ" style={{ width:"100%", height:"100%", objectFit:"cover" }}
          onError={e => {
            e.target.parentElement.style.background = `linear-gradient(135deg, #C9A84C, #8a6a1e)`;
            e.target.parentElement.style.display = "flex";
            e.target.parentElement.style.alignItems = "center";
            e.target.parentElement.style.justifyContent = "center";
            e.target.style.display = "none";
            e.target.parentElement.innerHTML += "<span style='font-size:28px;font-weight:800;color:#000'>MVZ</span>";
          }}
        />
      </div>

      {/* Name */}
      <p style={{ color:C.gold, fontSize:11, fontWeight:700, letterSpacing:3,
                  textTransform:"uppercase", margin:"0 0 8px", textAlign:"center" }}>
        Reservas online
      </p>
      <h1 style={{ color:C.text, fontSize:28, fontWeight:900, margin:"0 0 8px",
                   textAlign:"center", lineHeight:1.1 }}>
        {shop.name}
      </h1>
      <p style={{ color:C.muted, fontSize:13, margin:"0 0 40px", textAlign:"center" }}>
        Humboldt 689, CABA · Lun–Sáb 09:00–20:00
      </p>

      {/* CTA */}
      <div style={{ width:"100%", maxWidth:340, display:"flex", flexDirection:"column", gap:12 }}>
        <button onClick={onBook} style={{
          width:"100%", padding:"16px",
          background:`linear-gradient(135deg, #C9A84C, #8a6a1e)`,
          border:"none", borderRadius:14,
          color:"#000", fontSize:16, fontWeight:800,
          cursor:"pointer", letterSpacing:.3,
          boxShadow:`0 4px 20px rgba(212,175,55,0.3)`,
          transition:"transform .15s, box-shadow .15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow=`0 6px 28px rgba(212,175,55,0.4)`; }}
        onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)";    e.currentTarget.style.boxShadow=`0 4px 20px rgba(212,175,55,0.3)`; }}
        >
          Ver turnos disponibles
        </button>
        <button onClick={onMisTurnos} style={{
          width:"100%", padding:"14px",
          background:"transparent", border:`1.5px solid ${C.border}`,
          borderRadius:14, color:C.muted,
          fontSize:15, fontWeight:600, cursor:"pointer",
          transition:"border-color .15s, color .15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor=C.goldBorder; e.currentTarget.style.color=C.text; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor=C.border;     e.currentTarget.style.color=C.muted; }}
        >
          Mis turnos
        </button>
      </div>
    </div>
  );
}

// ── Step 0: Identify (DNI lookup / register) + Mis Turnos ────────────────────
function IdentifyStep({ onIdentified, misTurnosFirst = false, onGoHome }) {
  const [dni,          setDni]          = useState("");
  const [mode,         setMode]         = useState("idle"); // idle|loading|notfound|found|misTurnos|confirm
  const [regName,      setRegName]      = useState("");
  const [regWa,        setRegWa]        = useState("");
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");
  const [apptData,     setApptData]     = useState(null);
  const [existingUser, setExistingUser] = useState(null);

  const cleanDni = () => dni.replace(/\./g,"").trim();

  const lookup = async (forReserva) => {
    if (!cleanDni()) { setError("Ingresá tu DNI"); return; }
    setError(""); setMode("loading");
    try {
      const res  = await fetch(`${API}/users/by-dni?dni=${encodeURIComponent(cleanDni())}`);
      const ct   = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        throw new Error(`Error del servidor (${res.status}). Intentá de nuevo.`);
      }
      const json = await res.json();
      if (res.status === 404) {
        if (forReserva) { setMode("notfound"); }
        else { setError("No encontramos una cuenta con ese DNI."); setMode("idle"); }
        return;
      }
      if (!res.ok) throw new Error(json.error || "Error");
      setApptData(json);
      if (forReserva) {
        if (json.active_appt) {
          setError(`Ya tenés un turno activo el ${json.active_appt.date} a las ${json.active_appt.time}. Cancelalo antes de reservar.`);
          setMode("idle");
        } else {
          onIdentified(json.user);
        }
      } else {
        setMode("misTurnos");
      }
    } catch(e) { setError(e.message); setMode("idle"); }
  };

  const register = async () => {
    if (!regName.trim() || !regWa.trim()) { setError("Nombre y WhatsApp son obligatorios"); return; }
    setSaving(true); setError("");
    try {
      const res  = await fetch(`${API}/users/register`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ dni: cleanDni(), name: regName.trim(), whatsapp: regWa.trim() }),
      });
      // Guard: asegurarse de que la respuesta es JSON antes de parsear
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        throw new Error(`Error del servidor (${res.status}). Intentá de nuevo.`);
      }
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 409 && json.user) {
          // DNI ya registrado — mostrar datos y pedir confirmación
          setExistingUser(json.user);
          setMode("confirm");
          return;
        }
        throw new Error(json.error || "Error al registrar");
      }
      onIdentified(json.user);
    } catch(e) { setError(e.message); }
    finally    { setSaving(false); }
  };

  if (mode === "confirm" && existingUser) {
    return (
      <div style={{ padding:"0 16px 40px", animation:"fadeUp .35s ease" }}>
        <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:"16px 0 4px" }}>
          ¿Sos vos?
        </h2>
        <p style={{ color:C.muted, fontSize:13, marginBottom:20 }}>
          Ya existe una cuenta con ese DNI
        </p>
        <div style={{
          background:C.card, border:`1px solid ${C.border}`,
          borderRadius:14, padding:"18px 18px", marginBottom:20,
        }}>
          <p style={{ color:C.muted, fontSize:11, margin:"0 0 6px", letterSpacing:1, textTransform:"uppercase" }}>Cuenta existente</p>
          <p style={{ color:C.text, fontSize:17, fontWeight:700, margin:"0 0 4px" }}>{existingUser.name}</p>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>DNI {existingUser.dni}</p>
          {existingUser.whatsapp && (
            <p style={{ color:C.muted, fontSize:13, margin:"2px 0 0" }}>WhatsApp: {existingUser.whatsapp}</p>
          )}
        </div>
        <button
          onClick={() => onIdentified(existingUser)}
          style={{
            width:"100%", padding:"14px",
            background:`linear-gradient(135deg, #C9A84C, #8a6a1e)`,
            border:"none", borderRadius:12,
            color:"#000", fontWeight:800, fontSize:15, cursor:"pointer",
            marginBottom:10,
          }}
        >
          Sí, continuar con esta cuenta
        </button>
        <button
          onClick={() => { setMode("idle"); setExistingUser(null); setError(""); }}
          style={{
            width:"100%", padding:"13px",
            background:"transparent", border:`1px solid ${C.border}`,
            borderRadius:12, color:C.muted,
            fontWeight:600, fontSize:14, cursor:"pointer",
          }}
        >
          No, volver
        </button>
      </div>
    );
  }

  if (mode === "misTurnos" && apptData) {
    return (
      <MisTurnosPanel
        userData={apptData}
        dni={cleanDni()}
        onBack={() => { setMode("idle"); setApptData(null); }}
        onClose={onGoHome}
      />
    );
  }

  return (
    <div style={{ padding:"0 16px 40px", animation:"fadeUp .35s ease" }}>
      <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:"16px 0 4px" }}>
        {misTurnosFirst ? "Mis turnos" : "Bienvenido"}
      </h2>
      <p style={{ color:C.muted, fontSize:13, marginBottom:24 }}>
        {misTurnosFirst ? "Ingresá tu DNI para ver tus turnos" : "Ingresá tu DNI para continuar"}
      </p>

      <label style={{ color:C.muted, fontSize:12, display:"block", marginBottom:5 }}>DNI</label>
      <input
        type="tel" value={dni} placeholder="Sin puntos, ej: 38123456"
        onChange={e => { setDni(e.target.value); setError(""); setMode("idle"); }}
        style={{
          width:"100%", boxSizing:"border-box",
          background:C.card, border:`1.5px solid ${C.border}`,
          borderRadius:10, padding:"13px 14px",
          color:C.text, fontSize:15, outline:"none", marginBottom:14,
        }}
        onFocus={e => { e.target.style.borderColor = C.gold; }}
        onBlur={e  => { e.target.style.borderColor = C.border; }}
      />

      {mode === "notfound" && (
        <div style={{
          background:C.card, border:`1px solid ${C.border}`,
          borderRadius:14, padding:"16px 18px", marginBottom:14,
          animation:"fadeUp .3s ease",
        }}>
          <p style={{ color:C.text, fontSize:14, fontWeight:700, margin:"0 0 4px" }}>
            Primera vez por acá
          </p>
          <p style={{ color:C.muted, fontSize:12, margin:"0 0 14px" }}>
            Registrate para poder reservar
          </p>
          {[
            { label:"Nombre completo", val:regName, set:setRegName, ph:"Juan García", type:"text" },
            { label:"WhatsApp",        val:regWa,   set:setRegWa,   ph:"+549 11 1234-5678", type:"tel" },
          ].map(({ label, val, set, ph, type }) => (
            <div key={label} style={{ marginBottom:12 }}>
              <label style={{ color:C.muted, fontSize:12, display:"block", marginBottom:4 }}>{label}</label>
              <input type={type} value={val} placeholder={ph} onChange={e => set(e.target.value)}
                style={{
                  width:"100%", boxSizing:"border-box",
                  background:"#0a0a0a", border:`1.5px solid ${C.border}`,
                  borderRadius:9, padding:"12px 14px",
                  color:C.text, fontSize:14, outline:"none",
                }}
                onFocus={e => { e.target.style.borderColor = C.gold; }}
                onBlur={e  => { e.target.style.borderColor = C.border; }}
              />
            </div>
          ))}
          {error && <p style={{ color:C.red, fontSize:12, marginBottom:10 }}>{error}</p>}
          <button onClick={register} disabled={saving} style={{
            width:"100%", padding:"13px",
            background: saving ? "#333" : `linear-gradient(135deg, #C9A84C, #8a6a1e)`,
            border:"none", borderRadius:10,
            color: saving ? C.muted : "#000",
            fontWeight:800, fontSize:14, cursor: saving ? "default" : "pointer",
          }}>
            {saving ? "Registrando..." : "Registrarme y continuar"}
          </button>
        </div>
      )}

      {mode !== "notfound" && (
        <>
          {error && <p style={{ color:C.red, fontSize:13, marginBottom:12 }}>{error}</p>}
          {!misTurnosFirst && (
            <button
              onClick={() => lookup(true)}
              disabled={mode === "loading"}
              style={{
                width:"100%", padding:"14px",
                background: mode==="loading" ? "#333" : `linear-gradient(135deg, #C9A84C, #8a6a1e)`,
                border:"none", borderRadius:12,
                color: mode==="loading" ? C.muted : "#000",
                fontWeight:800, fontSize:15, cursor: mode==="loading" ? "default" : "pointer",
                marginBottom:10,
              }}
            >
              {mode === "loading" ? "Buscando..." : "Reservar turno"}
            </button>
          )}
          {misTurnosFirst ? (
            <button
              onClick={() => lookup(false)}
              disabled={mode === "loading"}
              style={{
                width:"100%", padding:"14px",
                background: mode==="loading" ? "#333" : `linear-gradient(135deg, #C9A84C, #8a6a1e)`,
                border:"none", borderRadius:12,
                color: mode==="loading" ? C.muted : "#000",
                fontWeight:800, fontSize:15, cursor: mode==="loading" ? "default" : "pointer",
              }}
            >
              {mode === "loading" ? "Buscando..." : "Ver mis turnos"}
            </button>
          ) : (
            <button
              onClick={() => lookup(false)}
              disabled={mode === "loading"}
              style={{
                width:"100%", padding:"13px",
                background:"transparent", border:`1px solid ${C.border}`,
                borderRadius:12, color:C.muted,
                fontWeight:600, fontSize:14, cursor:"pointer",
              }}
            >
              Mis turnos
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Step 1: Barber select ─────────────────────────────────────────────────────
function BarberStep({ barbers, onSelect, shopSlug, onQuickBook }) {
  const [quickSlots, setQuickSlots] = useState([]);
  const [qLoading,   setQLoading]   = useState(true);

  useEffect(() => {
    fetch(`${API}/appointments/available-soon?shop_slug=${encodeURIComponent(shopSlug)}&limit=8`)
      .then(r => r.json())
      .then(d => setQuickSlots(d.slots || []))
      .catch(() => {})
      .finally(() => setQLoading(false));
  }, [shopSlug]);

  return (
    <div style={{ padding:"0 16px 24px", animation:"fadeUp .35s ease" }}>
      <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:"16px 0 4px" }}>
        Elegí tu barbero
      </h2>
      <p style={{ color:C.muted, fontSize:13, marginBottom:20 }}>
        Seleccioná con quién querés reservar
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {barbers.map((b, i) => (
          <button key={b.id} onClick={() => onSelect(b)} style={{
            background:    C.card,
            border:        `1px solid ${C.border}`,
            borderRadius:  16,
            padding:       "20px 12px",
            cursor:        "pointer",
            textAlign:     "center",
            transition:    "all .2s",
            animation:     `fadeUp .35s ease ${i * 0.07}s both`,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = C.cardHigh; e.currentTarget.style.boxShadow = `0 4px 24px rgba(212,175,55,0.12)`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; e.currentTarget.style.boxShadow = "none"; }}
          >
            {/* Avatar — photo or initials fallback */}
            <div style={{
              width:72, height:72, borderRadius:"50%",
              margin:"0 auto 12px", position:"relative",
              boxShadow: b.available_today > 0 ? `0 0 0 2px ${C.green}` : `0 0 0 2px ${C.border}`,
              overflow:"hidden",
              background: `linear-gradient(135deg, #C9A84C, #8a6a1e)`,
            }}>
              {b.photo_url ? (
                <img
                  src={b.photo_url}
                  alt={b.name}
                  style={{ width:"100%", height:"100%", objectFit:"cover" }}
                  onError={e => {
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML = `<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#000">${b.name.split(" ").map(w=>w[0]).slice(0,2).join("")}</span>`;
                  }}
                />
              ) : (
                <span style={{
                  position:"absolute", inset:0, display:"flex",
                  alignItems:"center", justifyContent:"center",
                  fontSize:22, fontWeight:800, color:"#000",
                }}>
                  {b.name.split(" ").map(w => w[0]).slice(0,2).join("")}
                </span>
              )}
            </div>
            <p style={{ color:C.text, fontSize:14, fontWeight:700, margin:"0 0 2px" }}>
              {b.name}
            </p>
            {b.instagram && (
              <p style={{ color:C.gold, fontSize:10, margin:"0 0 4px", fontWeight:500 }}>
                {b.instagram}
              </p>
            )}
            <p style={{ color:C.muted, fontSize:11, margin:"0 0 8px" }}>
              {b.specialty || "Barbero"}
            </p>
            {b.available_today > 0 ? (
              <span style={{
                background: C.greenDim, color: C.green,
                fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:20,
                border:`1px solid rgba(34,197,94,0.25)`,
              }}>
                {b.available_today} turno{b.available_today !== 1 ? "s" : ""} hoy
              </span>
            ) : (
              <span style={{
                background:"rgba(255,255,255,0.05)", color:C.muted,
                fontSize:10, padding:"2px 8px", borderRadius:20,
              }}>
                Sin turnos hoy
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Turnos próximos disponibles ──────────────────────────────────── */}
      <div style={{ marginTop:28, paddingTop:20, borderTop:`1px solid ${C.border}` }}>
        <p style={{
          color:C.gold, fontSize:10, fontWeight:700, letterSpacing:"0.2em",
          textTransform:"uppercase", margin:"0 0 14px",
        }}>
          Turnos más próximos disponibles
        </p>
        {qLoading ? (
          <p style={{ color:C.muted, fontSize:13, textAlign:"center", padding:"8px 0" }}>
            Cargando...
          </p>
        ) : quickSlots.length === 0 ? (
          <p style={{ color:C.muted, fontSize:13, textAlign:"center", padding:"8px 0" }}>
            No hay turnos disponibles próximamente
          </p>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {quickSlots.map((slot, i) => {
              const barber = barbers.find(b => String(b.id) === String(slot.barber_id))
                          || { id: slot.barber_id, name: slot.barber_name };
              return (
                <div key={slot.id} style={{
                  background:C.card, border:`1px solid ${C.border}`,
                  borderRadius:12, padding:"10px 14px",
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  animation:`fadeUp .3s ease ${i * 0.05}s both`,
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ color:C.gold, fontWeight:800, fontSize:16, minWidth:44 }}>
                      {slot.time}
                    </span>
                    <div>
                      <p style={{ color:C.text, fontSize:13, fontWeight:600, margin:0 }}>
                        {slot.date_label}
                      </p>
                      <p style={{ color:C.muted, fontSize:11, margin:"2px 0 0" }}>
                        {slot.barber_name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onQuickBook(barber, slot.date_iso, { id: slot.id, time: slot.time })}
                    style={{
                      background:`linear-gradient(135deg, ${C.gold}, #8a6a1e)`,
                      border:"none", borderRadius:8,
                      color:"#000", fontWeight:800, fontSize:11,
                      letterSpacing:"0.1em", padding:"7px 14px",
                      cursor:"pointer", whiteSpace:"nowrap",
                      textTransform:"uppercase",
                    }}
                  >
                    Reservar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 2: Service select ────────────────────────────────────────────────────
function ServiceStep({ services, selected, onSelect }) {
  return (
    <div style={{ padding:"0 16px 24px", animation:"fadeUp .35s ease" }}>
      <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:"16px 0 4px" }}>
        ¿Qué servicio querés?
      </h2>
      <p style={{ color:C.muted, fontSize:13, marginBottom:20 }}>
        Elegí el servicio para tu turno
      </p>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {services.map((s, i) => {
          const isSelected = selected?.id === s.id;
          return (
            <button key={s.id} onClick={() => onSelect(s)} style={{
              background:   isSelected ? C.goldDim : C.card,
              border:       `1.5px solid ${isSelected ? C.gold : C.border}`,
              borderRadius: 14,
              padding:      "16px 18px",
              cursor:       "pointer",
              display:      "flex",
              alignItems:   "center",
              justifyContent:"space-between",
              transition:   "all .2s",
              animation:    `fadeUp .35s ease ${i * 0.07}s both`,
            }}>
              <div style={{ textAlign:"left" }}>
                <p style={{ color:C.text, fontSize:15, fontWeight:600, margin:0 }}>
                  {s.name}
                </p>
                <p style={{ color:C.muted, fontSize:12, margin:"3px 0 0" }}>
                  {s.duration_minutes} min
                </p>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{
                  color: isSelected ? C.goldLight : C.gold,
                  fontSize:18, fontWeight:800,
                }}>
                  {fmtPrice(s.price)}
                </span>
                {isSelected && (
                  <div style={{
                    width:22, height:22, borderRadius:"50%",
                    background:C.gold, display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                         stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Aviso importante */}
      <div style={{
        marginTop:20,
        background:"rgba(201,153,60,0.07)",
        border:`1px solid ${C.goldBorder}`,
        borderRadius:12, padding:"12px 14px",
      }}>
        <p style={{ color:C.gold, fontSize:11, fontWeight:700, margin:"0 0 4px", textTransform:"uppercase", letterSpacing:.5 }}>
          ⚠ Aviso importante
        </p>
        <p style={{ color:"#ccc", fontSize:12, margin:0, lineHeight:1.5 }}>
          La <strong style={{color:C.text}}>ausencia al turno</strong> tiene un cargo del{" "}
          <strong style={{color:C.text}}>30% del servicio reservado</strong>
          {selected ? <> ({fmtPrice(Math.round(selected.price * 0.30))})</> : null}.
          Tolerancia de llegada: <strong style={{color:C.text}}>8 minutos</strong>.
          Cancelación gratuita hasta <strong style={{color:C.text}}>90 min antes</strong>.
        </p>
      </div>
    </div>
  );
}

// ── Step 3: Slot select ───────────────────────────────────────────────────────
function SlotStep({ barberId, selectedDate, onDateChange, selectedSlot, onSlotSelect }) {
  const [slots, setSlots]   = useState([]);
  const [loading, setLoading] = useState(false);
  const dates = [todayStr(), addDays(todayStr(), 1), addDays(todayStr(), 2)];

  useEffect(() => {
    if (!barberId) return;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    fetch(`${API}/appointments/day?barber_id=${barberId}&date=${selectedDate}`)
      .then(r => r.json())
      .then(d => { setSlots(d.slots || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [barberId, selectedDate]);

  const morning = slots.filter(s => parseInt(s.time) < 13);
  const evening = slots.filter(s => parseInt(s.time) >= 13);
  const avail   = slots.filter(s => s.status === "available").length;

  return (
    <div style={{ padding:"0 16px 24px", animation:"fadeUp .35s ease" }}>
      <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:"16px 0 4px" }}>
        Elegí tu horario
      </h2>

      {/* Date pills */}
      <div style={{ display:"flex", gap:8, margin:"12px 0 20px" }}>
        {dates.map((d, i) => {
          const active = d === selectedDate;
          return (
            <button key={d} onClick={() => onDateChange(d)} style={{
              flex:1, padding:"9px 4px", borderRadius:10,
              background:  active ? C.gold  : C.card,
              border:      `1px solid ${active ? C.gold : C.border}`,
              color:       active ? "#000"  : C.muted,
              fontWeight:  active ? 700     : 400,
              fontSize:    12, cursor:"pointer",
              transition:  "all .2s",
            }}>
              {labelDate(d, i)}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p style={{ color:C.muted, textAlign:"center", padding:32 }}>Cargando...</p>
      ) : slots.length === 0 ? (
        <p style={{ color:C.muted, textAlign:"center", padding:32 }}>Sin turnos para este día</p>
      ) : (
        <>
          <p style={{ color:C.muted, fontSize:12, marginBottom:12 }}>
            {avail} turno{avail !== 1 ? "s" : ""} disponible{avail !== 1 ? "s" : ""}
          </p>
          {morning.length > 0 && (
            <SlotGroup label="Mañana" slots={morning} selected={selectedSlot} onSelect={onSlotSelect} />
          )}
          {evening.length > 0 && (
            <SlotGroup label="Tarde"  slots={evening} selected={selectedSlot} onSelect={onSlotSelect} />
          )}
        </>
      )}
    </div>
  );
}

function SlotGroup({ label, slots, selected, onSelect }) {
  return (
    <div style={{ marginBottom:20 }}>
      <p style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:1,
                  textTransform:"uppercase", marginBottom:8 }}>
        {label}
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
        {slots.map((s, i) => {
          const free   = s.status === "available";
          const active = selected?.id === s.id;
          return (
            <button key={s.id} disabled={!free} onClick={() => free && onSelect(s)} style={{
              padding:      "14px 8px",
              borderRadius: 10,
              background:   active ? C.gold : free ? "rgba(212,175,55,0.07)" : "rgba(255,255,255,0.02)",
              border:       `1.5px solid ${active ? C.gold : free ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.05)"}`,
              color:        active ? "#000" : free ? C.gold : "#2e2e2e",
              fontWeight:   active ? 700    : free ? 600    : 400,
              fontSize:     15,
              cursor:       free ? "pointer" : "default",
              transition:   "all .15s",
              animation:    `fadeUp .3s ease ${i * 0.04}s both`,
            }}>
              {s.time}
              <span style={{ display:"block", fontSize:9, marginTop:2,
                             color: active ? "#000" : free ? "rgba(212,175,55,0.6)" : "#222",
                             fontWeight: 600 }}>
                {free ? "libre" : "ocupado"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 4: Confirm ───────────────────────────────────────────────────────────
function ConfirmStep({
  barber, service, slot, date, user,
  onSubmit, loading, error,
  termsAccepted, onTermsChange,
  activeApptId,
}) {
  const absenceFee = Math.round(service.price * 0.30);
  const canSubmit  = termsAccepted && !loading && !activeApptId;

  return (
    <div style={{ padding:"0 16px 32px", animation:"fadeUp .35s ease" }}>
      <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:"16px 0 16px" }}>
        Confirmá tu turno
      </h2>

      {/* Turno activo — bloqueo */}
      {activeApptId && (
        <div style={{
          background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)",
          borderRadius:12, padding:"12px 14px", marginBottom:16,
        }}>
          <p style={{ color:C.red, fontSize:13, fontWeight:700, margin:"0 0 4px" }}>
            Ya tenés un turno activo
          </p>
          <p style={{ color:"#ccc", fontSize:12, margin:0, lineHeight:1.5 }}>
            Cancelá o completá tu turno actual antes de reservar uno nuevo.
          </p>
        </div>
      )}

      {/* Summary card */}
      <div style={{
        background:C.card, border:`1px solid ${C.border}`,
        borderRadius:16, padding:"16px 18px", marginBottom:20,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{
            width:48, height:48, borderRadius:"50%",
            background:`linear-gradient(135deg, #C9A84C, #8a6a1e)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, fontWeight:800, color:"#000", flexShrink:0,
          }}>
            {barber.name.split(" ").map(w=>w[0]).slice(0,2).join("")}
          </div>
          <div>
            <p style={{ color:C.text, fontWeight:700, fontSize:15, margin:0 }}>{barber.name}</p>
            <p style={{ color:C.muted, fontSize:12, margin:"2px 0 0" }}>
              {service.name} · {fmtPrice(service.price)}
            </p>
          </div>
        </div>
        <div style={{
          marginTop:14, paddingTop:14,
          borderTop:`1px solid ${C.border}`,
          display:"flex", justifyContent:"space-between", alignItems:"center",
        }}>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>
            {humanDate(date)} a las {slot.time}
          </p>
          <span style={{
            background:C.goldDim, color:C.gold,
            fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20,
          }}>
            {service.duration_minutes} min
          </span>
        </div>
      </div>

      {/* Aviso multa dinámica */}
      <div style={{
        background:"rgba(201,153,60,0.07)", border:`1px solid ${C.goldBorder}`,
        borderRadius:12, padding:"12px 14px", marginBottom:20,
      }}>
        <p style={{ color:C.gold, fontSize:11, fontWeight:700, margin:"0 0 4px",
                    textTransform:"uppercase", letterSpacing:.5 }}>
          ⚠ Aviso importante
        </p>
        <p style={{ color:"#ccc", fontSize:12, margin:0, lineHeight:1.5 }}>
          La <strong style={{color:C.text}}>ausencia al turno</strong> genera un cargo de{" "}
          <strong style={{color:C.text}}>{fmtPrice(absenceFee)}</strong> (30% de {fmtPrice(service.price)}).
          Tolerancia de llegada: <strong style={{color:C.text}}>8 minutos</strong>.
          Cancelación gratuita hasta <strong style={{color:C.text}}>90 min antes</strong>.
        </p>
      </div>

      {/* Usuario identificado */}
      <div style={{
        background:C.card, border:`1px solid ${C.border}`,
        borderRadius:12, padding:"12px 16px", marginBottom:20,
        display:"flex", alignItems:"center", gap:12,
      }}>
        <div style={{
          width:38, height:38, borderRadius:"50%",
          background:`linear-gradient(135deg, #C9A84C, #8a6a1e)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:14, fontWeight:800, color:"#000", flexShrink:0,
        }}>
          {user.name.split(" ").map(w=>w[0]).slice(0,2).join("")}
        </div>
        <div>
          <p style={{ color:C.text, fontWeight:700, fontSize:14, margin:0 }}>{user.name}</p>
          <p style={{ color:C.muted, fontSize:11, margin:0 }}>DNI {user.dni} · {user.whatsapp}</p>
        </div>
      </div>

      {/* T&C checkbox */}
      <label style={{
        display:"flex", alignItems:"flex-start", gap:10,
        cursor:"pointer", marginBottom:20, marginTop:6,
      }}>
        <div
          onClick={() => onTermsChange(!termsAccepted)}
          style={{
            width:20, height:20, borderRadius:5, flexShrink:0, marginTop:1,
            border:`2px solid ${termsAccepted ? C.gold : C.border}`,
            background: termsAccepted ? C.gold : "transparent",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", transition:"all .15s",
          }}
        >
          {termsAccepted && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                 stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
        <span style={{ color:"#aaa", fontSize:12, lineHeight:1.6 }}>
          Leí y acepto los{" "}
          <a
            href="/terminos" target="_blank" rel="noreferrer"
            style={{ color:C.gold, textDecoration:"underline" }}
            onClick={e => e.stopPropagation()}
          >
            Términos y Condiciones
          </a>
          {" "}de MVZ Barbería, incluyendo la política de ausencias y el cargo del 30%.
          Firma electrónica con validez por Ley N° 25.506.
        </span>
      </label>

      {error && (
        <p style={{ color:C.red, fontSize:13, marginBottom:12, textAlign:"center" }}>
          {error}
        </p>
      )}

      <button onClick={onSubmit} disabled={!canSubmit} style={{
        width:"100%", padding:"16px",
        background: canSubmit ? `linear-gradient(135deg, #C9A84C, #8a6a1e)` : "#222",
        border: canSubmit ? "none" : `1px solid ${C.border}`,
        borderRadius:12,
        color: canSubmit ? "#000" : C.muted,
        fontSize:15, fontWeight:800,
        cursor: canSubmit ? "pointer" : "default",
        letterSpacing:.5, marginTop:4,
        transition:"all .2s",
      }}>
        {loading ? "Reservando..." : !termsAccepted ? "Aceptá los T&C para continuar" : "Confirmar turno"}
      </button>
    </div>
  );
}

// ── Step 5: Success ───────────────────────────────────────────────────────────
function SuccessStep({ appt, dni, onRestart, onRebook }) {
  const [cancelState, setCancelState] = useState("idle"); // idle|confirming|loading|done|error
  const [cancelMsg,   setCancelMsg]   = useState("");
  const [canCancel,   setCanCancel]   = useState(appt?.can_cancel ?? null);

  useEffect(() => {
    if (!appt?.id) return;
    fetch(`${API}/appointments/${appt.id}`)
      .then(r => r.json())
      .then(d => { if (d && !d.error) setCanCancel(d.can_cancel ?? false); })
      .catch(() => {});
  }, [appt?.id]);

  if (!appt) return null;

  const id           = appt.id           || "";
  const booking_code = appt.booking_code || "";
  const barber_name  = appt.barber_name  || "";
  const service_name = appt.service_name || "";
  const price        = appt.price        ?? 0;
  const absence_fee  = appt.absence_fee  ?? 0;
  const date         = appt.date         || "";
  const time         = appt.time         || "";

  const doCancel = async () => {
    setCancelState("loading");
    try {
      const res  = await fetch(`${API}/appointments/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni: (dni || "").replace(/\./g, "").trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || "Error");
      setCancelState("done");
      setCancelMsg("Turno cancelado. El slot quedó libre.");
    } catch (e) {
      setCancelState("error");
      setCancelMsg(e.message);
    }
  };

  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"32px 20px 40px", textAlign:"center",
      animation:"fadeUp .4s ease",
    }}>

      {/* Header icon */}
      <div style={{
        width:72, height:72, borderRadius:"50%",
        background:C.greenDim, border:`2px solid ${C.green}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        marginBottom:16,
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
             stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      <h2 style={{ color:C.text, fontSize:22, fontWeight:800, margin:"0 0 4px" }}>
        ¡Turno confirmado!
      </h2>

      {/* Booking code */}
      <div style={{
        background:C.goldDim, border:`1px solid ${C.goldBorder}`,
        borderRadius:10, padding:"6px 18px", margin:"10px 0 20px",
        display:"inline-flex", alignItems:"center", gap:8,
      }}>
        <span style={{ color:C.muted, fontSize:11, fontWeight:600 }}>Código</span>
        <span style={{ color:C.gold, fontSize:18, fontWeight:800, letterSpacing:1 }}>
          {booking_code || "—"}
        </span>
      </div>

      {/* QR */}
      <div style={{
        background:"#fff", borderRadius:16, padding:12,
        marginBottom:20, display:"inline-block",
        boxShadow:"0 4px 24px rgba(212,175,55,0.15)",
      }}>
        <img
          src={`${API}/appointments/${id}/qr`}
          alt="QR del turno"
          style={{ width:160, height:160, display:"block" }}
        />
      </div>
      <p style={{ color:C.muted, fontSize:11, margin:"0 0 24px" }}>
        Mostrá este QR al barbero para verificar tu turno
      </p>

      {/* Details card */}
      <div style={{
        background:C.card, border:`1px solid ${C.border}`,
        borderRadius:16, padding:"16px 20px", width:"100%",
        maxWidth:360, marginBottom:20, boxSizing:"border-box",
        textAlign:"left",
      }}>
        {[
          ["Barbero",  barber_name                 ],
          ["Servicio", service_name                ],
          ["Precio",   fmtPrice(price)             ],
          ["Fecha",    date                        ],
          ["Hora",     time                        ],
          ["Pago",     "Efectivo / Mercado Pago"   ],
        ].map(([k, v]) => (
          <div key={k} style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"7px 0", borderBottom:`1px solid ${C.border}`,
          }}>
            <span style={{ color:C.muted, fontSize:13 }}>{k}</span>
            <span style={{ color:C.text,  fontSize:13, fontWeight:600 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Absence fee warning */}
      <div style={{
        background:"rgba(201,153,60,0.06)", border:`1px solid ${C.goldBorder}`,
        borderRadius:12, padding:"10px 14px", width:"100%",
        maxWidth:360, marginBottom:22, boxSizing:"border-box", textAlign:"left",
      }}>
        <p style={{ color:C.gold, fontSize:11, fontWeight:700, margin:"0 0 3px",
                    textTransform:"uppercase", letterSpacing:.5 }}>
          Recordá
        </p>
        <p style={{ color:"#bbb", fontSize:12, margin:0, lineHeight:1.5 }}>
          Cargo por ausencia o llegada tardía (+8 min):{" "}
          <strong style={{ color:C.text }}>
            {fmtPrice(absence_fee)}
          </strong>{" "}
          (30% del servicio). Cancelación gratuita hasta 90 min antes.
        </p>
      </div>

      <button onClick={onRestart} style={{
        background:`linear-gradient(135deg, #C9A84C, #8a6a1e)`,
        border:"none", borderRadius:12, padding:"14px 40px",
        color:"#000", fontWeight:800, fontSize:14,
        cursor:"pointer", letterSpacing:.5, marginTop:4,
      }}>
        Volver al inicio
      </button>

      {/* Cancel + Reprogramar */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:360, marginTop:16 }}>
        {cancelState === "done" ? (
          <p style={{ color:C.green, fontSize:13, textAlign:"center", margin:0 }}>{cancelMsg}</p>
        ) : cancelState === "confirming" ? (
          <>
            <p style={{ color:"#ccc", fontSize:13, textAlign:"center", margin:0 }}>
              ¿Confirmás la cancelación? Esta acción libera el slot.
            </p>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setCancelState("idle")} style={{
                flex:1, padding:"11px", background:"transparent",
                border:`1px solid ${C.border}`, borderRadius:10,
                color:C.muted, fontSize:13, cursor:"pointer",
              }}>No, volver</button>
              <button onClick={doCancel} style={{
                flex:1, padding:"11px",
                background:"rgba(239,68,68,0.15)",
                border:"1px solid rgba(239,68,68,0.4)",
                borderRadius:10, color:C.red, fontWeight:700,
                fontSize:13, cursor:"pointer",
              }}>Sí, cancelar</button>
            </div>
          </>
        ) : cancelState === "loading" ? (
          <p style={{ color:C.muted, fontSize:13, textAlign:"center", margin:0 }}>Cancelando...</p>
        ) : (
          <>
            {cancelState === "error" && (
              <p style={{ color:C.red, fontSize:12, textAlign:"center", margin:0 }}>{cancelMsg}</p>
            )}
            {canCancel === false ? (
              <p style={{ color:C.muted, fontSize:12, textAlign:"center", margin:0 }}>
                Cancelación no disponible (menos de 90 min)
              </p>
            ) : (
              <button onClick={() => setCancelState("confirming")} style={{
                width:"100%", padding:"13px",
                background:"rgba(239,68,68,0.1)",
                border:"1px solid rgba(239,68,68,0.4)",
                borderRadius:12, color:C.red,
                fontSize:13, fontWeight:700, letterSpacing:.5,
                cursor:"pointer", textTransform:"uppercase",
              }}>
                Cancelar turno
              </button>
            )}
            <button onClick={() => onRebook && onRebook(appt.barber_id)} style={{
              width:"100%", padding:"13px",
              background:"transparent",
              border:`1.5px solid ${C.goldBorder}`,
              borderRadius:12, color:C.gold,
              fontSize:13, fontWeight:700, letterSpacing:.5,
              cursor:"pointer", textTransform:"uppercase",
            }}>
              Reprogramar
            </button>
          </>
        )}
      </div>

      <a href="/mi-turno" style={{
        color:C.muted, fontSize:12, textDecoration:"underline",
        marginTop:16, cursor:"pointer",
      }}>
        Ver mi turno más tarde
      </a>
    </div>
  );
}

// ── Auth wall — cliente no logueado intenta reservar ─────────────────────────
function AuthWall({ onGoHome }) {
  return (
    <div style={{ padding:"40px 24px", textAlign:"center", animation:"fadeUp .35s ease" }}>
      <div style={{
        width:64, height:64, borderRadius:"50%",
        background:"rgba(212,175,55,0.1)", border:`2px solid ${C.goldBorder}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        margin:"0 auto 20px",
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
             stroke={C.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <h2 style={{ color:C.text, fontSize:20, fontWeight:700, margin:"0 0 8px" }}>
        Iniciá sesión para reservar
      </h2>
      <p style={{ color:C.muted, fontSize:13, margin:"0 0 28px", lineHeight:1.5 }}>
        Necesitás una cuenta para poder reservar tu turno en MVZ Barbería
      </p>
      <div style={{ display:"flex", flexDirection:"column", gap:12, maxWidth:280, margin:"0 auto" }}>
        <button
          onClick={() => navTo("/cliente/login")}
          style={{
            width:"100%", padding:"14px",
            background:`linear-gradient(135deg, #C9A84C, #8a6a1e)`,
            border:"none", borderRadius:12,
            color:"#000", fontWeight:800, fontSize:15, cursor:"pointer",
          }}
        >
          Iniciar sesión
        </button>
        <button
          onClick={() => navTo("/cliente/registro")}
          style={{
            width:"100%", padding:"13px",
            background:"transparent", border:`1.5px solid ${C.border}`,
            borderRadius:12, color:C.text,
            fontWeight:600, fontSize:14, cursor:"pointer",
          }}
        >
          Crear cuenta
        </button>
        <button
          onClick={onGoHome}
          style={{
            background:"none", border:"none", cursor:"pointer",
            color:C.muted, fontSize:13, padding:"8px 0",
          }}
        >
          Volver
        </button>
      </div>
    </div>
  );
}

// ── MisTurnosJwtPanel — mis turnos con JWT ────────────────────────────────────
function MisTurnosJwtPanel({ clientToken, clientUser, onClose }) {
  const [turnos,       setTurnos]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelledIds, setCancelledIds] = useState(new Set());
  const [cancelErrors, setCancelErrors] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`${API}/clients/appointments`, {
          headers: { Authorization: `Bearer ${clientToken}` },
        });
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) throw new Error("Error del servidor");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Error");
        setTurnos(json.turnos || json.appointments || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [clientToken]);

  const doCancel = async (t) => {
    setCancellingId(t.id);
    setCancelErrors(prev => { const n = {...prev}; delete n[t.id]; return n; });
    try {
      const res  = await fetch(`${API}/appointments/${t.id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${clientToken}`,
        },
        body: JSON.stringify({ dni: clientUser?.dni || "" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || "Error");
      setCancelledIds(prev => new Set([...prev, t.id]));
    } catch (e) {
      setCancelErrors(prev => ({ ...prev, [t.id]: e.message }));
    } finally {
      setCancellingId(null);
    }
  };

  const ESTADO_COLOR = {
    pendiente: { bg:"rgba(212,175,55,0.12)", color:C.gold },
    presente:  { bg:"rgba(34,197,94,0.12)",  color:C.green },
    cancelado: { bg:"rgba(239,68,68,0.1)",   color:C.red },
    ausente:   { bg:"rgba(100,100,100,0.12)",color:C.muted },
  };

  return (
    <div style={{ padding:"0 16px 40px", animation:"fadeUp .35s ease" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h2 style={{ color:C.text, fontSize:20, fontWeight:700, margin:0 }}>Mis turnos</h2>
          <p style={{ color:C.muted, fontSize:12, margin:"2px 0 0" }}>{clientUser.name}</p>
        </div>
        <button onClick={onClose} style={{
          background:"none", border:`1px solid ${C.border}`,
          borderRadius:8, padding:"6px 14px",
          color:C.muted, fontSize:12, cursor:"pointer",
        }}>
          Cerrar
        </button>
      </div>

      {loading && <p style={{ color:C.muted, textAlign:"center" }}>Cargando...</p>}
      {error   && <p style={{ color:C.red,  textAlign:"center", fontSize:13 }}>{error}</p>}

      {!loading && turnos.length === 0 && (
        <p style={{ color:C.muted, textAlign:"center", fontSize:14, padding:"20px 0" }}>
          No tenés turnos registrados
        </p>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {[...turnos]
          .sort((a, b) => {
            const da = `${a.fecha || ""} ${a.hora || ""}`;
            const db = `${b.fecha || ""} ${b.hora || ""}`;
            return db.localeCompare(da);
          })
          .map(t => {
          const est = ESTADO_COLOR[t.estado] || ESTADO_COLOR.cancelado;
          return (
            <div key={t.id} style={{
              background:C.card, border:`1px solid ${C.border}`,
              borderRadius:14, padding:"14px 16px",
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                <div>
                  <p style={{ color:C.text, fontWeight:700, fontSize:14, margin:0 }}>
                    {t.fecha} · {t.hora}
                  </p>
                  <p style={{ color:C.muted, fontSize:12, margin:"3px 0 0" }}>
                    {t.barber_nombre} · {t.servicio}
                  </p>
                  <p style={{ color:C.gold, fontSize:13, fontWeight:600, margin:"3px 0 0" }}>
                    ${Number(t.precio).toLocaleString("es-AR")}
                  </p>
                </div>
                <span style={{
                  background:est.bg, color:est.color,
                  borderRadius:20, padding:"4px 12px",
                  fontSize:11, fontWeight:700, whiteSpace:"nowrap",
                }}>
                  {t.estado}
                </span>
              </div>
              {t.estado === "cancelado" && t.cancelled_at && (
                <p style={{ color:C.muted, fontSize:11, margin:"4px 0 0" }}>
                  Cancelado el {new Date(t.cancelled_at).toLocaleDateString("es-AR")}
                </p>
              )}
              {t.booking_code && (
                <p style={{ color:C.muted, fontSize:11, margin:"4px 0 0" }}>
                  Código: {t.booking_code}
                </p>
              )}
              {t.estado === "pendiente" && !cancelledIds.has(t.id) && (
                <div style={{ display:"flex", gap:8, marginTop:10 }}>
                  {t.can_cancel === false ? (
                    <span style={{ color:C.muted, fontSize:11, alignSelf:"center" }}>
                      Cancelación no disponible
                    </span>
                  ) : (
                    <button
                      onClick={() => doCancel(t)}
                      disabled={cancellingId === t.id}
                      style={{
                        flex:1, padding:"9px",
                        background:"rgba(239,68,68,0.1)",
                        border:"1px solid rgba(239,68,68,0.3)",
                        borderRadius:8, color:C.red,
                        fontSize:12, fontWeight:700,
                        cursor: cancellingId === t.id ? "default" : "pointer",
                        textTransform:"uppercase", letterSpacing:.3,
                      }}
                    >
                      {cancellingId === t.id ? "Cancelando..." : "Cancelar"}
                    </button>
                  )}
                  <button
                    onClick={() => navTo("/shop/mvzbarberia")}
                    style={{
                      flex:1, padding:"9px",
                      background:"transparent",
                      border:`1px solid ${C.goldBorder}`,
                      borderRadius:8, color:C.gold,
                      fontSize:12, fontWeight:700, cursor:"pointer",
                      textTransform:"uppercase", letterSpacing:.3,
                    }}
                  >
                    Reprogramar
                  </button>
                </div>
              )}
              {cancelledIds.has(t.id) && (
                <p style={{ color:C.green, fontSize:12, margin:"8px 0 0" }}>Turno cancelado</p>
              )}
              {cancelErrors[t.id] && (
                <p style={{ color:C.red, fontSize:11, margin:"6px 0 0" }}>{cancelErrors[t.id]}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Map panel ─────────────────────────────────────────────────────────────────
function MapPanel() {
  const LAT = -34.5997;
  const LNG = -58.4369;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <MapContainer
        center={[LAT, LNG]}
        zoom={16}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <Marker position={[LAT, LNG]} icon={goldIcon}>
          <Popup>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#111", lineHeight: 1.4 }}>
              <strong>MVZ Barbería — Humboldt 689</strong>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Overlay info card */}
      <div style={{
        position: "absolute",
        bottom: 16,
        left: 16,
        right: 16,
        background: "rgba(10,10,10,0.88)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(201,168,76,0.3)",
        borderRadius: 12,
        padding: "14px 16px",
        zIndex: 1000,
      }}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 10,
          letterSpacing: "0.25em",
          color: "#C9A84C",
          margin: "0 0 4px",
          textTransform: "uppercase",
          fontWeight: 700,
        }}>MVZ Barbería</p>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          color: "#fff",
          margin: "0 0 2px",
          fontWeight: 600,
        }}>Humboldt 689, CABA</p>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          color: "#888",
          margin: 0,
        }}>Lun – Sáb · 09:00 – 20:00</p>
      </div>
    </div>
  );
}

// ── Helpers de auth de cliente ────────────────────────────────────────────────
function getClientAuth() {
  try {
    const token = localStorage.getItem("client_token") || "";
    const user  = JSON.parse(localStorage.getItem("client_user") || "null");
    return { token, user };
  } catch {
    return { token: "", user: null };
  }
}

function navTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// ── Main BookingFlow ──────────────────────────────────────────────────────────
export default function BookingFlow({ shopSlug, startStep = -1, startEntryMode = "book", onGoHome }) {
  const [shopData,  setShopData]  = useState(null);
  const [loading,   setLoading]   = useState(true);

  // step -1=splash, 0=identify, 1=barber, 2=service, 3=slot, 4=confirm, 5=success
  const [step,          setStep]          = useState(startStep);
  const [entryMode,     setEntryMode]     = useState(startEntryMode);
  // Inicializar user desde localStorage si hay sesión activa
  const [user,          setUser]          = useState(() => getClientAuth().user);
  const [selBarber,     setSelBarber]     = useState(null);
  const [selService,    setSelService]    = useState(null);
  const [selSlot,       setSelSlot]       = useState(null);
  const [selDate,       setSelDate]       = useState(todayStr());
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [activeApptId,  setActiveApptId]  = useState(null);
  const [booking,       setBooking]       = useState(false);
  const [bookError,     setBookError]     = useState("");
  const [successData,   setSuccessData]   = useState(null);

  useEffect(() => {
    fetch(`${API}/shops/${shopSlug}`)
      .then(r => r.json())
      .then(d => { setShopData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [shopSlug]);

  // Push a history entry ONLY when advancing forward, so the browser back
  // button can navigate backwards through the flow instead of leaving.
  // Using a ref to detect direction: only push when step increases.
  const prevStepRef = useRef(startStep);
  useEffect(() => {
    if (step > prevStepRef.current && step < 5) {
      window.history.pushState({ bookingStep: step }, "");
    }
    prevStepRef.current = step;
  }, [step]);

  // Intercept browser back button while inside an active booking step.
  useEffect(() => {
    const handlePop = () => {
      if (step <= startStep || step === 5) return; // nothing to handle here
      if (step === 1) { setSelBarber(null); setUser(null); }
      if (step === 2) { setSelService(null); }
      if (step === 3) { setSelSlot(null); }
      setStep(s => s - 1);
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [step, startStep]);

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex",
                    alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:C.muted, fontSize:14 }}>Cargando...</div>
      </div>
    );
  }
  if (!shopData) {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex",
                    alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:C.red, fontSize:14 }}>Barbería no encontrada</div>
      </div>
    );
  }

  const { shop, barbers, services } = shopData;

  const handleBook = async () => {
    if (!termsAccepted) {
      setBookError("Debés aceptar los Términos y Condiciones");
      return;
    }
    setBooking(true);
    setBookError("");
    setActiveApptId(null);
    try {
      const { token: clientToken } = getClientAuth();
      const headers = { "Content-Type": "application/json" };
      if (clientToken) headers["Authorization"] = `Bearer ${clientToken}`;

      const res  = await fetch(`${API}/appointments/book`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          appointment_id: selSlot.id,
          service_id:     selService.id,
          user_id:        user.id,
          terms_accepted: true,
        }),
      });
      // Guard: si el servidor devuelve HTML (crash 500, etc.) dar un mensaje claro
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        throw new Error(`Error del servidor (${res.status}). Por favor intentá de nuevo.`);
      }
      const json = await res.json();
      if (res.status === 409 && json.active_appt_id) {
        setActiveApptId(json.active_appt_id);
        setBookError(json.error);
        return;
      }
      if (!res.ok) throw new Error(json.error || "Error al reservar");
      // Enriquecer con datos del barber_id para la pantalla de reprogramación
      setSuccessData({ ...json.appointment, barber_id: selBarber?.id });
      setStep(5);
    } catch (e) {
      setBookError(e.message);
    } finally {
      setBooking(false);
    }
  };

  const restart = () => {
    setStep(startStep);
    setEntryMode(startEntryMode);
    setUser(null);
    setSelBarber(null);
    setSelService(null);
    setSelSlot(null);
    setSelDate(todayStr());
    setTermsAccepted(false);
    setActiveApptId(null);
    setSuccessData(null);
    setBookError("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        input::placeholder { color: #333; }
        * { -webkit-tap-highlight-color: transparent; }
        @media (min-width: 900px) {
          .booking-layout { display: flex !important; align-items: stretch; }
          .booking-map-col { display: block !important; }
        }
      `}</style>

      {/* Desktop 2-column layout */}
      <div className="booking-layout" style={{ display: "block", minHeight: "100vh", alignItems: "stretch" }}>

        {/* Left col — map (desktop only, sticky) */}
        <div className="booking-map-col" style={{
          display: "none",
          width: "45%",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          alignSelf: "flex-start",
        }}>
          <MapPanel />
        </div>

        {/* Right col — booking content */}
        <div style={{ flex: 1, minWidth: 0, paddingBottom: 60 }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ padding:"16px 16px 0", paddingBottom: 0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          {/* Logo + name */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{
              width:44, height:44, borderRadius:"50%",
              overflow:"hidden", border:`2px solid ${C.goldBorder}`,
              flexShrink:0,
            }}>
              <img src="/logo.jpg" alt="MVZ" style={{ width:"100%", height:"100%", objectFit:"cover" }}
                onError={e => {
                  e.target.parentElement.style.background = `linear-gradient(135deg, #C9A84C, #7A5C10)`;
                  e.target.parentElement.style.display = "flex";
                  e.target.parentElement.style.alignItems = "center";
                  e.target.parentElement.style.justifyContent = "center";
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML += "<span style='font-size:13px;font-weight:800;color:#000;font-family:Inter,sans-serif'>MVZ</span>";
                }}
              />
            </div>
            <div>
              <p style={{
                color: C.gold, fontSize: 9, fontWeight: 700,
                letterSpacing: "0.25em", textTransform: "uppercase", margin: 0,
                fontFamily: "'Inter', sans-serif",
              }}>
                Reservas online
              </p>
              <h1 style={{
                color: C.text, fontSize: 17, fontWeight: 700,
                margin: 0, lineHeight: 1.1,
                fontFamily: "'Playfair Display', Georgia, serif",
                letterSpacing: "0.05em",
              }}>
                {shop.name}
              </h1>
            </div>
          </div>

          {/* Right side: user info + icons */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {(() => {
              const { token: ct, user: cu } = getClientAuth();
              if (ct && cu) {
                return (
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ color:C.muted, fontSize:11 }}>
                      {cu.name.split(" ")[0]}
                    </span>
                    <button
                      onClick={() => {
                        localStorage.removeItem("client_token");
                        localStorage.removeItem("client_user");
                        if (onGoHome) onGoHome();
                        else navTo("/");
                      }}
                      style={{
                        background:"transparent",
                        border:`1px solid ${C.border}`,
                        borderRadius:6, padding:"4px 10px",
                        color:C.muted, fontSize:11, cursor:"pointer",
                      }}
                    >
                      Salir
                    </button>
                  </div>
                );
              }
              return null;
            })()}
            <a href="https://www.instagram.com/mvz.barberia" target="_blank" rel="noreferrer"
               style={{ color:C.muted, display:"flex", alignItems:"center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9993c" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="#c9993c" stroke="none"/>
              </svg>
            </a>
            <a href="https://maps.google.com/?q=Humboldt+689+CABA+Buenos+Aires" target="_blank" rel="noreferrer"
               style={{ color:C.muted, display:"flex", alignItems:"center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9993c" strokeWidth="1.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </a>
            {shop.flash_promo_active && (
              <span style={{
                background:"rgba(251,191,36,0.15)", color:"#fbbf24",
                border:"1px solid rgba(251,191,36,0.35)",
                fontSize:10, fontWeight:700, padding:"4px 10px",
                borderRadius:20, letterSpacing:.5,
              }}>
                ⚡ PROMO
              </span>
            )}
          </div>
        </div>

        {/* Address + hours row */}
        <div style={{
          display:"flex", alignItems:"center", gap:6,
          marginTop:8, paddingBottom:2,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span style={{ color:C.muted, fontSize:11 }}>
            Humboldt 689, CABA
          </span>
          <span style={{ color:"#444", fontSize:11 }}>·</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span style={{ color:C.muted, fontSize:11 }}>
            Lun–Sáb 09:00–20:00
          </span>
        </div>
      </div>

      <GlobalFooterBar />

      {/* Progress — solo pasos 1-4 (no en identify ni success) */}
      {step >= 1 && step <= 4 && <Progress step={step} total={4} />}

      {/* Back button */}
      {step >= 1 && step <= 4 && (
        <BackBtn onClick={() => {
          if (step === 1) { navTo("/"); return; }
          if (step === 2) { setSelService(null); }
          if (step === 3) { setSelSlot(null); }
          setStep(s => s - 1);
        }} />
      )}

      {step === -1 && (
        <SplashStep
          shop={shop}
          onBook={() => { setEntryMode("book"); setStep(0); }}
          onMisTurnos={() => { setEntryMode("misTurnos"); setStep(0); }}
        />
      )}
      {step === 0 && (() => {
        const { token: ct, user: cu } = getClientAuth();
        // Ya logueado + modo reserva → saltar directo a selección de barbero
        if (ct && cu && entryMode === "book") {
          if (!user) setUser(cu);
          setTimeout(() => setStep(1), 0);
          return null;
        }
        // Ya logueado + misTurnos → panel de turnos con JWT
        if (ct && cu && entryMode === "misTurnos") {
          return (
            <MisTurnosJwtPanel
              clientToken={ct}
              clientUser={cu}
              onClose={onGoHome ? onGoHome : () => setStep(startStep)}
            />
          );
        }
        // No logueado + modo reserva → auth wall
        if (!ct && entryMode === "book") {
          return (
            <AuthWall onGoHome={onGoHome ? onGoHome : () => setStep(startStep)} />
          );
        }
        // No logueado + misTurnos → flujo DNI existente
        return (
          <IdentifyStep
            onIdentified={u => { setUser(u); setStep(1); }}
            misTurnosFirst={entryMode === "misTurnos"}
            shopSlug={shopSlug}
            onGoHome={onGoHome ? onGoHome : () => setStep(startStep)}
          />
        );
      })()}
      {step === 1 && (
        <BarberStep
          barbers={barbers}
          onSelect={b => { setSelBarber(b); setSelSlot(null); setStep(2); }}
          shopSlug={shopSlug}
          onQuickBook={(b, dateIso, slot) => {
            setSelBarber(b);
            setSelDate(dateIso);
            setSelSlot(slot);
            setStep(2);
          }}
        />
      )}
      {step === 2 && (
        <ServiceStep
          services={services}
          selected={selService}
          onSelect={s => { setSelService(s); setStep(selSlot ? 4 : 3); }}
        />
      )}
      {step === 3 && (
        <SlotStep
          barberId={selBarber?.id}
          selectedDate={selDate}
          onDateChange={d => { setSelDate(d); setSelSlot(null); }}
          selectedSlot={selSlot}
          onSlotSelect={s => { setSelSlot(s); setStep(4); }}
        />
      )}
      {step === 4 && (
        <ConfirmStep
          barber={selBarber}
          service={selService}
          slot={selSlot}
          date={selDate}
          user={user}
          onSubmit={handleBook}
          loading={booking}
          error={bookError}
          termsAccepted={termsAccepted}
          onTermsChange={setTermsAccepted}
          activeApptId={activeApptId}
        />
      )}
      {step === 5 && (
        <SuccessStep
          appt={successData}
          dni={user?.dni}
          onRestart={restart}
          onRebook={(barberId) => {
            const barber = barbers.find(b => String(b.id) === String(barberId));
            setSelBarber(barber || null);
            setSelSlot(null);
            setSelDate(todayStr());
            setSuccessData(null);
            setStep(barber ? 3 : 1);
          }}
        />
      )}

          </div>{/* end maxWidth */}
        </div>{/* end right col */}
      </div>{/* end booking-layout */}
    </div>
  );
}
