import { useState, useEffect, useCallback } from "react";

const API = "https://web-production-d26db.up.railway.app/api/v1";

const C = {
  gold:       "#D4AF37",
  goldDim:    "rgba(212,175,55,0.12)",
  goldBorder: "rgba(212,175,55,0.35)",
  bg:         "#080808",
  card:       "#0f0f0f",
  cardHigh:   "#161616",
  border:     "#1e1e1e",
  text:       "#f0f0f0",
  muted:      "#666666",
  green:      "#22c55e",
  greenDim:   "rgba(34,197,94,0.1)",
  red:        "#ef4444",
  redDim:     "rgba(239,68,68,0.1)",
  blue:       "#60a5fa",
};

function authHeaders(token) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function fmtPrice(p) { return `$${Number(p).toLocaleString("es-AR")}`; }

// ── Reusable Field ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type="text", placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:12 }}>
      <label style={{ color:C.muted, fontSize:11, display:"block", marginBottom:4 }}>{label}</label>
      <input type={type} value={value || ""} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width:"100%", boxSizing:"border-box",
          background:"#0d0d0d", border:`1.5px solid ${focused ? C.gold : C.border}`,
          borderRadius:8, padding:"10px 12px", color:C.text, fontSize:14, outline:"none",
          transition:"border-color .15s",
        }}
      />
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent }) {
  return (
    <div style={{
      flex:1, background:C.card, border:`1px solid ${C.border}`,
      borderRadius:14, padding:"16px 14px",
    }}>
      <p style={{ color:C.muted, fontSize:11, margin:"0 0 6px", fontWeight:600,
                  textTransform:"uppercase", letterSpacing:.8 }}>{label}</p>
      <p style={{ color: accent || C.text, fontSize:24, fontWeight:800, margin:0 }}>{value}</p>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    available:   { bg:"rgba(96,165,250,0.12)",  color:C.blue,  label:"Libre"        },
    booked:      { bg:C.greenDim,               color:C.green, label:"Reservado"    },
    rescheduled: { bg:"rgba(168,85,247,0.12)",  color:"#a855f7", label:"Reprogramado" },
    cancelled:   { bg:C.redDim,                color:C.red,   label:"Cancelado"    },
    completed:   { bg:C.goldDim,               color:C.gold,  label:"Completo"     },
    no_show:     { bg:"rgba(239,68,68,0.18)",   color:C.red,   label:"Ausente"      },
  };
  const s = map[status] || map.available;
  return (
    <span style={{
      background:s.bg, color:s.color, fontSize:11, fontWeight:700,
      padding:"2px 8px", borderRadius:20,
    }}>{s.label}</span>
  );
}

// ── Dashboard tab ─────────────────────────────────────────────────────────────
function DashboardTab({ token }) {
  const [data,       setData]       = useState(null);
  const [date,       setDate]       = useState(() => new Date().toISOString().slice(0,10));
  const [loading,    setLoading]    = useState(false);
  const [noShowLoading, setNoShowLoading] = useState(null); // appointment id being processed

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/admin/stats?date=${date}`, { headers: authHeaders(token) })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token, date]);

  useEffect(() => { load(); }, [load]);

  const handleNoShow = async (apptId) => {
    if (!confirm("¿Marcar como ausente y cobrar la multa?")) return;
    setNoShowLoading(apptId);
    try {
      const res  = await fetch(`${API}/admin/appointments/${apptId}/no-show`, {
        method: "POST",
        headers: authHeaders(token),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      // Abrir link de WhatsApp automáticamente
      if (json.wa_link) window.open(json.wa_link, "_blank");
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setNoShowLoading(null);
    }
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                    marginBottom:16 }}>
        <h3 style={{ color:C.text, fontSize:16, fontWeight:700, margin:0 }}>Agenda del día</h3>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{
            background:"#0d0d0d", border:`1px solid ${C.border}`,
            borderRadius:8, padding:"6px 10px", color:C.text, fontSize:12, outline:"none",
          }}
        />
      </div>

      {/* Stats row */}
      {data?.stats && (
        <div style={{ display:"flex", gap:10, marginBottom:20 }}>
          <StatCard label="Reservados" value={data.stats.booked}   accent={C.green} />
          <StatCard label="Total slots" value={data.stats.total} />
          <StatCard label="Ingresos est."
                    value={fmtPrice(data.stats.revenue)}
                    accent={C.gold} />
        </div>
      )}

      {loading && <p style={{ color:C.muted, textAlign:"center", padding:32 }}>Cargando...</p>}

      {!loading && data?.agenda?.length === 0 && (
        <p style={{ color:C.muted, textAlign:"center", padding:32 }}>Sin turnos para este día</p>
      )}

      {/* Agenda table */}
      {!loading && data?.agenda?.length > 0 && (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr>
                {["Hora","Código","Cliente","Servicio","Precio","Estado",""].map(h => (
                  <th key={h} style={{
                    color:C.muted, fontWeight:600, padding:"8px 10px", textAlign:"left",
                    borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.agenda.filter(r => r.status !== "available").map((r, i) => (
                <tr key={r.id}
                  style={{ background: i % 2 === 0 ? "transparent" : "#0d0d0d" }}>

                  <td style={{ padding:"9px 10px", color:C.gold, fontWeight:700, whiteSpace:"nowrap" }}>
                    {r.hora}
                  </td>

                  <td style={{ padding:"9px 10px" }}>
                    {r.booking_code ? (
                      <span style={{ color:C.gold, fontWeight:700, fontSize:12 }}>
                        {r.booking_code}
                      </span>
                    ) : (
                      <span style={{ color:"#333" }}>—</span>
                    )}
                  </td>

                  <td style={{ padding:"9px 10px", color:C.text }}>
                    <div>{r.client_name || "—"}</div>
                    {(r.client_wa || r.whatsapp_number) && (
                      <a href={`https://wa.me/${(r.client_wa || r.whatsapp_number).replace(/\D/g,"")}`}
                         target="_blank" rel="noreferrer"
                         style={{ color:C.green, fontSize:11 }}>
                        WhatsApp ↗
                      </a>
                    )}
                  </td>

                  <td style={{ padding:"9px 10px", color:C.muted }}>{r.service_name}</td>

                  <td style={{ padding:"9px 10px", color:C.text, whiteSpace:"nowrap" }}>
                    {fmtPrice(r.price)}
                    {r.absence_charge_amount > 0 && (
                      <div style={{ color:C.red, fontSize:10 }}>
                        Multa: {fmtPrice(r.absence_charge_amount)}
                      </div>
                    )}
                  </td>

                  <td style={{ padding:"9px 10px" }}>
                    <Badge status={r.status} />
                  </td>

                  {/* Botón cobrar ausencia */}
                  <td style={{ padding:"9px 10px" }}>
                    {r.show_no_show_btn && (
                      <button
                        onClick={() => handleNoShow(r.id)}
                        disabled={noShowLoading === r.id}
                        style={{
                          background:"rgba(239,68,68,0.15)",
                          border:"1px solid rgba(239,68,68,0.4)",
                          borderRadius:7, padding:"5px 10px",
                          color:C.red, fontSize:11, fontWeight:700,
                          cursor: noShowLoading === r.id ? "default" : "pointer",
                          whiteSpace:"nowrap",
                        }}
                      >
                        {noShowLoading === r.id ? "..." : `⚠ Cobrar ausencia (${fmtPrice(r.absence_fee)})`}
                      </button>
                    )}
                    {r.status === "no_show" && r.absence_charge_sent && (
                      <span style={{ color:"#555", fontSize:11 }}>Notificado ✓</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Barbers tab ───────────────────────────────────────────────────────────────
function BarbersTab({ token }) {
  const [barbers,  setBarbers]  = useState([]);
  const [editing,  setEditing]  = useState(null); // null | {} | barber object
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState("");
  const [passModal, setPassModal] = useState(null); // barber object
  const [newPass,   setNewPass]   = useState("");
  const [passSaving, setPassSaving] = useState(false);
  const [passErr,    setPassErr]    = useState("");

  const load = useCallback(() => {
    fetch(`${API}/admin/barbers`, { headers: authHeaders(token) })
      .then(r => r.json())
      .then(setBarbers)
      .catch(() => {});
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setErr("");
    try {
      const isNew = !editing.id;
      const url   = isNew
        ? `${API}/admin/barbers`
        : `${API}/admin/barbers/${editing.id}`;
      const res   = await fetch(url, {
        method:  isNew ? "POST" : "PUT",
        headers: authHeaders(token),
        body:    JSON.stringify(editing),
      });
      const json  = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      setEditing(null);
      load();
    } catch(e) { setErr(e.message); }
    finally    { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm("¿Desactivar este barbero?")) return;
    await fetch(`${API}/admin/barbers/${id}`, {
      method:"DELETE", headers: authHeaders(token),
    });
    load();
  };

  const savePass = async () => {
    setPassSaving(true); setPassErr("");
    try {
      const res  = await fetch(`${API}/admin/barbers/${passModal.id}/set-password`, {
        method:  "POST",
        headers: authHeaders(token),
        body:    JSON.stringify({ password: newPass }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      setPassModal(null); setNewPass("");
    } catch (e) { setPassErr(e.message); }
    finally     { setPassSaving(false); }
  };

  const initials = name => name.split(" ").map(w=>w[0]).slice(0,2).join("");

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                    marginBottom:16 }}>
        <h3 style={{ color:C.text, fontSize:16, fontWeight:700, margin:0 }}>Barberos</h3>
        <button onClick={() => setEditing({ name:"", specialty:"", whatsapp:"" })}
          style={{
            background:C.goldDim, border:`1px solid ${C.goldBorder}`,
            borderRadius:8, padding:"7px 14px",
            color:C.gold, fontSize:12, fontWeight:700, cursor:"pointer",
          }}>
          + Agregar
        </button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {barbers.map(b => (
          <div key={b.id} style={{
            background:C.card, border:`1px solid ${C.border}`,
            borderRadius:12, padding:"14px 16px",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            opacity: b.is_active ? 1 : 0.45,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{
                width:42, height:42, borderRadius:"50%",
                background:`linear-gradient(135deg, #D4AF37, #7A5C10)`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:14, fontWeight:800, color:"#000",
              }}>{initials(b.name)}</div>
              <div>
                <p style={{ color:C.text, fontWeight:700, fontSize:14, margin:0 }}>{b.name}</p>
                <p style={{ color:C.muted, fontSize:12, margin:0 }}>{b.specialty || "—"}</p>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setEditing({...b})}
                style={{ background:"transparent", border:`1px solid ${C.border}`,
                         borderRadius:7, padding:"5px 12px", color:C.muted,
                         fontSize:12, cursor:"pointer" }}>
                Editar
              </button>
              <button onClick={() => { setPassModal(b); setNewPass(""); setPassErr(""); }}
                style={{ background:C.goldDim, border:`1px solid ${C.goldBorder}`,
                         borderRadius:7, padding:"5px 12px", color:C.gold,
                         fontSize:12, cursor:"pointer" }}>
                {b.has_password ? "Contraseña" : "Setear clave"}
              </button>
              <button onClick={() => remove(b.id)}
                style={{ background:C.redDim, border:`1px solid rgba(239,68,68,0.25)`,
                         borderRadius:7, padding:"5px 12px", color:C.red,
                         fontSize:12, cursor:"pointer" }}>
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Password modal */}
      {passModal && (
        <Modal title={`Contraseña — ${passModal.name}`} onClose={() => setPassModal(null)}>
          <p style={{ color:C.muted, fontSize:13, marginBottom:14 }}>
            El barbero usará su slug <strong style={{color:C.gold}}>{passModal.slug}</strong> como usuario.
          </p>
          <Field label="Nueva contraseña" value={newPass} onChange={setNewPass}
                 type="password" placeholder="Mínimo 4 caracteres" />
          {passErr && <p style={{ color:C.red, fontSize:12 }}>{passErr}</p>}
          <ModalActions onSave={savePass} onCancel={() => setPassModal(null)} saving={passSaving} />
        </Modal>
      )}

      {/* Edit modal */}
      {editing && (
        <Modal title={editing.id ? "Editar barbero" : "Nuevo barbero"}
               onClose={() => setEditing(null)}>
          <Field label="Nombre *" value={editing.name}
                 onChange={v => setEditing(e=>({...e,name:v}))} />
          <Field label="Especialidad" value={editing.specialty}
                 onChange={v => setEditing(e=>({...e,specialty:v}))} placeholder="Desvanecidos" />
          <Field label="WhatsApp" value={editing.whatsapp}
                 onChange={v => setEditing(e=>({...e,whatsapp:v}))}
                 type="tel" placeholder="+549 11 1234-5678" />
          <Field label="Instagram" value={editing.instagram}
                 onChange={v => setEditing(e=>({...e,instagram:v}))} placeholder="@usuario" />
          <Field label="URL foto" value={editing.photo_url}
                 onChange={v => setEditing(e=>({...e,photo_url:v}))}
                 placeholder="https://..." />
          {err && <p style={{ color:C.red, fontSize:12 }}>{err}</p>}
          <ModalActions onSave={save} onCancel={() => setEditing(null)} saving={saving} />
        </Modal>
      )}
    </div>
  );
}

// ── Services tab ──────────────────────────────────────────────────────────────
function ServicesTab({ token }) {
  const [services, setServices] = useState([]);
  const [editing,  setEditing]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState("");

  const load = useCallback(() => {
    fetch(`${API}/admin/services`, { headers: authHeaders(token) })
      .then(r => r.json())
      .then(setServices)
      .catch(() => {});
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setErr("");
    try {
      const isNew = !editing.id;
      const url   = isNew
        ? `${API}/admin/services`
        : `${API}/admin/services/${editing.id}`;
      const res   = await fetch(url, {
        method:  isNew ? "POST" : "PUT",
        headers: authHeaders(token),
        body:    JSON.stringify(editing),
      });
      const json  = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      setEditing(null); load();
    } catch(e) { setErr(e.message); }
    finally    { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm("¿Desactivar este servicio?")) return;
    await fetch(`${API}/admin/services/${id}`, {
      method:"DELETE", headers: authHeaders(token),
    });
    load();
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                    marginBottom:16 }}>
        <h3 style={{ color:C.text, fontSize:16, fontWeight:700, margin:0 }}>Servicios</h3>
        <button
          onClick={() => setEditing({ name:"", price:"", duration_minutes:30, display_order:0 })}
          style={{
            background:C.goldDim, border:`1px solid ${C.goldBorder}`,
            borderRadius:8, padding:"7px 14px",
            color:C.gold, fontSize:12, fontWeight:700, cursor:"pointer",
          }}>
          + Agregar
        </button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {services.map(s => (
          <div key={s.id} style={{
            background:C.card, border:`1px solid ${C.border}`,
            borderRadius:12, padding:"14px 16px",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            opacity: s.is_active ? 1 : 0.45,
          }}>
            <div>
              <p style={{ color:C.text, fontWeight:700, fontSize:14, margin:0 }}>{s.name}</p>
              <p style={{ color:C.muted, fontSize:12, margin:0 }}>
                {s.duration_minutes} min
              </p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ color:C.gold, fontWeight:800, fontSize:16 }}>
                {fmtPrice(s.price)}
              </span>
              <button onClick={() => setEditing({...s, price:String(s.price)})}
                style={{ background:"transparent", border:`1px solid ${C.border}`,
                         borderRadius:7, padding:"5px 12px", color:C.muted,
                         fontSize:12, cursor:"pointer" }}>
                Editar
              </button>
              <button onClick={() => remove(s.id)}
                style={{ background:C.redDim, border:`1px solid rgba(239,68,68,0.25)`,
                         borderRadius:7, padding:"5px 12px", color:C.red,
                         fontSize:12, cursor:"pointer" }}>
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing.id ? "Editar servicio" : "Nuevo servicio"}
               onClose={() => setEditing(null)}>
          <Field label="Nombre *" value={editing.name}
                 onChange={v => setEditing(e=>({...e,name:v}))} />
          <Field label="Precio *" value={editing.price}
                 onChange={v => setEditing(e=>({...e,price:v}))}
                 type="number" placeholder="3500" />
          <Field label="Duración (minutos)" value={editing.duration_minutes}
                 onChange={v => setEditing(e=>({...e,duration_minutes:v}))}
                 type="number" placeholder="30" />
          <Field label="Orden" value={editing.display_order}
                 onChange={v => setEditing(e=>({...e,display_order:v}))}
                 type="number" placeholder="0" />
          {err && <p style={{ color:C.red, fontSize:12 }}>{err}</p>}
          <ModalActions onSave={save} onCancel={() => setEditing(null)} saving={saving} />
        </Modal>
      )}
    </div>
  );
}

// ── Settings tab ──────────────────────────────────────────────────────────────
function SettingsTab({ token, shop, onShopUpdate }) {
  const [form,    setForm]    = useState({ ...shop });
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState("");
  const [file,    setFile]    = useState(null);
  const [importing, setImp]   = useState(false);
  const [importMsg, setIMsg]  = useState("");

  const save = async () => {
    setSaving(true); setMsg("");
    try {
      const res  = await fetch(`${API}/admin/shop`, {
        method:"PUT", headers: authHeaders(token),
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      localStorage.setItem("admin_shop", JSON.stringify(json));
      onShopUpdate(json);
      setMsg("Cambios guardados ✓");
    } catch(e) { setMsg(e.message); }
    finally    { setSaving(false); }
  };

  const togglePromo = async () => {
    const res  = await fetch(`${API}/admin/promo`, {
      method:"POST", headers: authHeaders(token),
    });
    const json = await res.json();
    if (res.ok) {
      const updated = { ...form, flash_promo_active: json.flash_promo_active };
      setForm(updated);
      onShopUpdate(updated);
    }
  };

  const importClients = async () => {
    if (!file) return;
    setImp(true); setIMsg("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res  = await fetch(`${API}/admin/clients/import`, {
        method:"POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setIMsg(`✓ ${json.created} clientes importados`);
    } catch(e) { setIMsg(e.message); }
    finally    { setImp(false); }
  };

  return (
    <div>
      <h3 style={{ color:C.text, fontSize:16, fontWeight:700, margin:"0 0 16px" }}>Configuración</h3>

      <Field label="Nombre del negocio" value={form.name}
             onChange={v => setForm(f=>({...f,name:v}))} />
      <Field label="URL del logo" value={form.logo_url}
             onChange={v => setForm(f=>({...f,logo_url:v}))} placeholder="https://..." />
      <Field label="Dirección" value={form.address}
             onChange={v => setForm(f=>({...f,address:v}))} />
      <Field label="WhatsApp" value={form.whatsapp}
             onChange={v => setForm(f=>({...f,whatsapp:v}))} type="tel" />
      <Field label="Nueva contraseña" value={form.password || ""}
             onChange={v => setForm(f=>({...f,password:v}))}
             type="password" placeholder="Dejar vacío para no cambiar" />

      {msg && (
        <p style={{ color: msg.includes("✓") ? C.green : C.red, fontSize:13, marginBottom:12 }}>
          {msg}
        </p>
      )}

      <button onClick={save} disabled={saving} style={{
        width:"100%", padding:12, marginBottom:20,
        background: `linear-gradient(135deg, #E8CC6A, #9A7B1E)`,
        border:"none", borderRadius:10,
        color:"#000", fontWeight:800, fontSize:14, cursor:"pointer",
      }}>
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>

      {/* Flash promo toggle */}
      <div style={{
        background:C.card, border:`1px solid ${C.border}`,
        borderRadius:12, padding:"16px 18px", marginBottom:20,
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <p style={{ color:C.text, fontWeight:700, fontSize:14, margin:0 }}>
              ⚡ Promoción Relámpago
            </p>
            <p style={{ color:C.muted, fontSize:12, margin:"3px 0 0" }}>
              Visible en la página de reservas
            </p>
          </div>
          <button onClick={togglePromo} style={{
            width:52, height:28, borderRadius:14, cursor:"pointer",
            border:"none",
            background: form.flash_promo_active
              ? `linear-gradient(135deg, #E8CC6A, #9A7B1E)`
              : C.border,
            position:"relative", transition:"background .2s",
          }}>
            <span style={{
              position:"absolute", top:4,
              left:  form.flash_promo_active ? 26 : 4,
              width:20, height:20, borderRadius:"50%",
              background: form.flash_promo_active ? "#000" : C.muted,
              transition:"left .2s",
            }}/>
          </button>
        </div>
      </div>

      {/* Client import */}
      <div style={{
        background:C.card, border:`1px solid ${C.border}`,
        borderRadius:12, padding:"16px 18px",
      }}>
        <p style={{ color:C.text, fontWeight:700, fontSize:14, margin:"0 0 4px" }}>
          Importar clientes (.xlsx)
        </p>
        <p style={{ color:C.muted, fontSize:12, margin:"0 0 12px" }}>
          Columnas: Nombre, DNI, WhatsApp
        </p>
        <input type="file" accept=".xlsx"
          onChange={e => setFile(e.target.files[0])}
          style={{ color:C.muted, fontSize:13, marginBottom:10, display:"block" }}
        />
        {importMsg && (
          <p style={{ color: importMsg.includes("✓") ? C.green : C.red,
                      fontSize:12, marginBottom:8 }}>{importMsg}</p>
        )}
        <button onClick={importClients} disabled={!file || importing} style={{
          background:C.goldDim, border:`1px solid ${C.goldBorder}`,
          borderRadius:8, padding:"7px 16px",
          color: file ? C.gold : C.muted, fontSize:12, fontWeight:700,
          cursor: file ? "pointer" : "default",
        }}>
          {importing ? "Importando..." : "Importar"}
        </button>
      </div>
    </div>
  );
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function Modal({ title, children, onClose }) {
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.8)",
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      zIndex:1000, padding:"0 0 0 0",
    }}>
      <div style={{
        background:"#141414", borderRadius:"20px 20px 0 0",
        width:"100%", maxWidth:480,
        padding:"24px 20px 32px",
        maxHeight:"90vh", overflowY:"auto",
        animation:"slideUp .3s ease",
      }}>
        <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div style={{ display:"flex", justifyContent:"space-between",
                      alignItems:"center", marginBottom:20 }}>
          <h3 style={{ color:C.text, fontSize:16, fontWeight:700, margin:0 }}>{title}</h3>
          <button onClick={onClose} style={{
            background:"none", border:"none", color:C.muted, fontSize:22, cursor:"pointer",
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onSave, onCancel, saving }) {
  return (
    <div style={{ display:"flex", gap:10, marginTop:16 }}>
      <button onClick={onCancel} style={{
        flex:1, padding:12, background:"transparent",
        border:`1px solid ${C.border}`, borderRadius:10,
        color:C.muted, fontSize:14, cursor:"pointer",
      }}>Cancelar</button>
      <button onClick={onSave} disabled={saving} style={{
        flex:2, padding:12,
        background:`linear-gradient(135deg, #E8CC6A, #9A7B1E)`,
        border:"none", borderRadius:10,
        color:"#000", fontWeight:800, fontSize:14,
        cursor: saving ? "default" : "pointer",
      }}>
        {saving ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}

// ── Main AdminPanel ───────────────────────────────────────────────────────────
const TABS = [
  { id:"dashboard", label:"Dashboard" },
  { id:"barbers",   label:"Barberos"  },
  { id:"services",  label:"Servicios" },
  { id:"settings",  label:"Config"    },
];

export default function AdminPanel({ token: initialToken, shop: initialShop, onLogout }) {
  const [token] = useState(initialToken);
  const [shop,  setShop]  = useState(initialShop);
  const [tab,   setTab]   = useState("dashboard");

  return (
    <div style={{
      minHeight:"100vh", background:C.bg,
      fontFamily:"'SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>
      <style>{`
        input::placeholder{color:#333}
        input[type=number]{-moz-appearance:textfield}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div style={{ maxWidth:680, margin:"0 auto" }}>

      {/* Header */}
      <div style={{
        padding:"20px 20px 0",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        borderBottom:`1px solid ${C.border}`, paddingBottom:16, marginBottom:20,
      }}>
        <div>
          <p style={{ color:C.gold, fontSize:10, fontWeight:700,
                      letterSpacing:2, textTransform:"uppercase", margin:0 }}>
            Panel Admin
          </p>
          <h1 style={{ color:C.text, fontSize:18, fontWeight:800, margin:0 }}>
            {shop.name}
          </h1>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <a href={`/shop/${shop.slug}`} target="_blank" rel="noreferrer"
             style={{ color:C.muted, fontSize:12 }}>
            Ver sitio →
          </a>
          <button onClick={onLogout} style={{
            background:"transparent", border:`1px solid ${C.border}`,
            borderRadius:8, padding:"6px 12px", color:C.muted,
            fontSize:12, cursor:"pointer",
          }}>
            Salir
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{
        display:"flex", gap:0,
        borderBottom:`1px solid ${C.border}`,
        padding:"0 16px", marginBottom:20,
        overflowX:"auto",
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:"10px 16px", background:"none", border:"none",
            borderBottom:`2px solid ${tab === t.id ? C.gold : "transparent"}`,
            color: tab === t.id ? C.text : C.muted,
            fontWeight: tab === t.id ? 700 : 400,
            fontSize:13, cursor:"pointer", whiteSpace:"nowrap",
            transition:"all .15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding:"0 16px 40px", animation:"fadeUp .3s ease" }} key={tab}>
        {tab === "dashboard" && <DashboardTab token={token} shop={shop} />}
        {tab === "barbers"   && <BarbersTab   token={token} shop={shop} />}
        {tab === "services"  && <ServicesTab  token={token} />}
        {tab === "settings"  && (
          <SettingsTab token={token} shop={shop} onShopUpdate={s => setShop(s)} />
        )}
      </div>

      </div>{/* end maxWidth container */}
    </div>
  );
}
