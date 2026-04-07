const C = {
  gold:       "#D4AF37",
  goldDim:    "rgba(212,175,55,0.10)",
  goldBorder: "rgba(212,175,55,0.30)",
  bg:         "#080808",
  card:       "#0f0f0f",
  border:     "#1e1e1e",
  text:       "#f0f0f0",
  muted:      "#888888",
};

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{
        color: C.gold, fontSize: 14, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: 1,
        margin: "0 0 10px", paddingBottom: 8,
        borderBottom: `1px solid ${C.border}`,
      }}>
        {title}
      </h2>
      <div style={{ color: "#ccc", fontSize: 14, lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}

function Li({ children }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
      <span style={{ color: C.gold, flexShrink: 0, marginTop: 2 }}>›</span>
      <span>{children}</span>
    </div>
  );
}

export default function TerminosPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      fontFamily: "'SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* Header */}
        <div style={{
          padding: "24px 0 20px",
          borderBottom: `1px solid ${C.border}`,
          marginBottom: 32,
        }}>
          <button
            onClick={() => window.history.back()}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.muted, fontSize: 13, padding: "0 0 14px",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Volver
          </button>

          <div style={{
            display: "inline-block",
            background: C.goldDim,
            border: `1px solid ${C.goldBorder}`,
            borderRadius: 8,
            padding: "4px 12px",
            fontSize: 11,
            fontWeight: 700,
            color: C.gold,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 12,
          }}>
            Documento legal
          </div>
          <h1 style={{ color: C.text, fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>
            Términos y Condiciones
          </h1>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
            MVZ Barbería · Última actualización: abril 2025
          </p>
        </div>

        {/* Sections */}
        <Section title="1. Aceptación obligatoria">
          <p>
            Al confirmar una reserva en MVZ Barbería, el cliente declara haber leído,
            comprendido y aceptado en su totalidad estos Términos y Condiciones. La
            aceptación se realiza mediante firma electrónica con validez legal conforme
            a la <strong style={{ color: C.text }}>Ley N° 25.506 de Firma Digital</strong> de la
            República Argentina.
          </p>
          <p style={{ marginTop: 10 }}>
            La aceptación es un requisito obligatorio para completar la reserva. Sin
            aceptación expresa no se procesará ningún turno.
          </p>
        </Section>

        <Section title="2. Una reserva activa por usuario">
          <Li>
            Cada número de WhatsApp puede tener <strong style={{ color: C.text }}>una sola
            reserva activa</strong> a la vez.
          </Li>
          <Li>
            Para reservar un nuevo turno, el turno anterior debe estar completado o
            cancelado dentro del plazo permitido.
          </Li>
          <Li>
            El sistema verificará automáticamente esta condición al momento de confirmar
            la reserva.
          </Li>
        </Section>

        <Section title="3. Cancelación">
          <Li>
            La cancelación es <strong style={{ color: C.text }}>gratuita</strong> únicamente
            si se realiza con <strong style={{ color: C.text }}>más de 90 minutos</strong> de
            anticipación al horario del turno.
          </Li>
          <Li>
            Pasada esa ventana, la cancelación no estará disponible y aplicará el cargo
            por ausencia descripto en la sección 5.
          </Li>
          <Li>
            Las cancelaciones se realizan desde la pantalla de confirmación de turno
            o contactando directamente al barbero.
          </Li>
        </Section>

        <Section title="4. Reprogramación">
          <Li>
            Se permite <strong style={{ color: C.text }}>una (1) sola reprogramación</strong> por
            reserva.
          </Li>
          <Li>
            La reprogramación solo es posible con <strong style={{ color: C.text }}>más de 90
            minutos</strong> de anticipación al turno original.
          </Li>
          <Li>
            Una vez utilizado el derecho de reprogramación, el turno queda fijo y
            no admite nuevos cambios.
          </Li>
        </Section>

        <Section title="5. Cargo por ausencia (no-show)">
          <p>
            La ausencia al turno sin cancelación previa dentro del plazo habilitado,
            así como la llegada posterior a los <strong style={{ color: C.text }}>8 minutos de
            tolerancia</strong>, genera automáticamente un cargo por ausencia equivalente al
            <strong style={{ color: C.text }}> 30% del valor del servicio reservado</strong>.
          </p>

          <div style={{
            background: C.goldDim, border: `1px solid ${C.goldBorder}`,
            borderRadius: 12, padding: "14px 16px", margin: "14px 0",
          }}>
            <p style={{ color: C.gold, fontSize: 12, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: .5, margin: "0 0 10px" }}>
              Ejemplos de cálculo
            </p>
            {[
              ["Corte",                "$20.000", "$6.000"],
              ["Corte + Barba",        "$28.000", "$8.400"],
              ["Corte + Cejas + Barba","$35.000", "$10.500"],
            ].map(([svc, price, fine]) => (
              <div key={svc} style={{
                display: "flex", justifyContent: "space-between",
                padding: "5px 0", borderBottom: `1px solid ${C.border}`,
                fontSize: 13,
              }}>
                <span style={{ color: "#ccc" }}>{svc} ({price})</span>
                <span style={{ color: C.gold, fontWeight: 700 }}>Multa: {fine}</span>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 10 }}>
            Este cargo representa la compensación por el tiempo reservado al barbero
            y el tiempo muerto generado por la inasistencia. El monto será comunicado
            al cliente vía WhatsApp junto con el alias de pago.
          </p>
        </Section>

        <Section title="6. Medios de pago">
          <Li>El pago de los servicios es <strong style={{ color: C.text }}>exclusivamente presencial</strong>.</Li>
          <Li>Se acepta <strong style={{ color: C.text }}>efectivo</strong> y <strong style={{ color: C.text }}>Mercado Pago</strong>.</Li>
          <Li>Alias Mercado Pago: <strong style={{ color: C.text }}>resquin.mvz</strong></Li>
          <Li>No se realizan cobros anticipados online para la reserva del turno.</Li>
        </Section>

        <Section title="7. Sistema de ticket QR">
          <Li>
            Al confirmar una reserva, el sistema genera un <strong style={{ color: C.text }}>código
            QR único</strong> asociado al turno.
          </Li>
          <Li>
            El QR es personal e intransferible. Puede ser solicitado por el barbero
            al momento de la atención para verificar la identidad del cliente.
          </Li>
          <Li>
            El código de reserva (formato <strong style={{ color: C.text }}>OE-XXXX</strong>) identifica
            unívocamente cada turno en el sistema.
          </Li>
        </Section>

        <Section title="8. Datos personales">
          <p>
            El tratamiento de los datos personales (nombre, DNI, WhatsApp) proporcionados
            al reservar se rige por la{" "}
            <strong style={{ color: C.text }}>Ley N° 25.326 de Protección de Datos Personales</strong>{" "}
            de la República Argentina. Los datos son utilizados exclusivamente para la
            gestión de turnos y comunicaciones relacionadas con el servicio.
          </p>
          <p style={{ marginTop: 10 }}>
            El titular de los datos tiene derecho de acceso, rectificación y supresión
            conforme a la ley citada.
          </p>
        </Section>

        <Section title="9. Firma electrónica">
          <p>
            La aceptación de estos términos mediante casilla de verificación al momento
            de reservar constituye una{" "}
            <strong style={{ color: C.text }}>firma electrónica válida</strong> en los términos
            de la Ley N° 25.506 de la República Argentina, con plenos efectos jurídicos.
          </p>
          <p style={{ marginTop: 10 }}>
            La fecha y hora de aceptación quedan registradas en el sistema junto con los
            datos del turno.
          </p>
        </Section>

        <Section title="10. Jurisdicción">
          <p>
            Cualquier controversia derivada de la interpretación o cumplimiento de estos
            Términos y Condiciones será resuelta ante los tribunales ordinarios con
            competencia en la{" "}
            <strong style={{ color: C.text }}>Ciudad Autónoma de Buenos Aires (CABA)</strong>,
            República Argentina, con renuncia expresa a cualquier otro fuero que pudiera
            corresponder.
          </p>
        </Section>

        {/* Footer */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: "16px 18px",
          textAlign: "center",
        }}>
          <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>
            MVZ Barbería · CABA, Argentina
          </p>
          <p style={{ color: C.muted, fontSize: 11, margin: "4px 0 0" }}>
            Ley N° 25.506 (Firma Digital) · Ley N° 25.326 (Datos Personales)
          </p>
        </div>

      </div>
    </div>
  );
}
