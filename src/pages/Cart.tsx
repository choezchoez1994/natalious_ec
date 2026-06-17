import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImageSlot } from "../components/ImageSlot";
import { SectionHead, EmptyState, Spinner } from "../components/ui";
import { Sparkle } from "../components/icons";
import { ACard, AField, AInput, ASelect } from "../components/form";
import { ZonaSelect, ZONA_VACIA } from "../components/ZonaSelect";
import type { Zona } from "../components/ZonaSelect";
import { useCart } from "../store/CartContext";
import { useCatalog } from "../store/CatalogContext";
import { createOrder } from "../services/orders";
import { buscarCliente } from "../services/clientes";
import { availableStock } from "../lib/effective";
import { envioEfectivo } from "../lib/envio";
import { validarIdentificacion } from "../lib/cedula";
import { money, today } from "../lib/format";
import type { Cliente, Pago } from "../lib/types";

function emailOk(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || "");
}

export function Cart() {
  const navigate = useNavigate();
  const { items, total, count, updateQty, removeItem, clear } = useCart();
  const { productById, catalogs, config, loading, reload } = useCatalog();

  const [step, setStep] = useState<"cart" | "datos">("cart");
  const [done, setDone] = useState<string | null>(null);
  const [doneRetiro, setDoneRetiro] = useState<string | null>(null);
  const [tipoEntrega, setTipoEntrega] = useState<"servientrega" | "retiro">("servientrega");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    cedula: "", nombres: "", apellidos: "", correo: "", celular: "", direccion: "",
    formaPago: "", estadoPago: "Pendiente", banco: "",
  });
  const [zona, setZona] = useState<Zona>(ZONA_VACIA);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) return <Spinner />;

  if (done) {
    return (
      <div className="nat-shell" style={{ padding: "40px 18px 30px", maxWidth: 560 }}>
        <div style={{ textAlign: "center" }}>
          <div className="nat-empty-mark" style={{ margin: "0 auto", width: 64, height: 64 }}><Sparkle size={26} color="var(--teal)" /></div>
          <h2 style={{ margin: "18px 0 6px", fontFamily: "'Bodoni Moda',serif", fontStyle: "italic", fontWeight: 600, fontSize: 26, color: "var(--ink)" }}>¡Orden generada!</h2>
          <p style={{ margin: "0 auto 6px", maxWidth: 420, fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14.5, lineHeight: 1.5, color: "var(--ink)", opacity: 0.7 }}>
            Tu orden <strong>{done}</strong> fue generada correctamente. {doneRetiro !== null ? "Coordinaremos contigo el retiro." : "Nos comunicaremos contigo para coordinar el envío."}
          </p>
          {doneRetiro !== null && (
            <div style={{ margin: "14px auto 0", maxWidth: 420, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--teal)", marginBottom: 4 }}>Retiro en tienda</div>
              <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14.5, color: "var(--ink)" }}>{doneRetiro || "Te compartiremos la dirección por WhatsApp."}</div>
            </div>
          )}
          <button className="nat-btn-primary" style={{ marginTop: 18 }} onClick={() => navigate("/catalogo")}>Seguir comprando</button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="nat-shell" style={{ padding: "30px 18px" }}>
        <SectionHead kicker="Mi pedido" title="Carrito" />
        <EmptyState title="Tu carrito está vacío" body="Agrega tus prendas favoritas y genera tu pedido en minutos." action="Ver catálogo" onAction={() => navigate("/catalogo")} />
      </div>
    );
  }

  const isTransfer = form.formaPago === "Transferencia bancaria";

  const cantonObj = catalogs.cantones.find((c) => c.codigo === zona.cantonCod);
  const parrObj = catalogs.parroquias.find((p) => p.codigo === zona.parroquiaCod);
  const tienda = config.tienda;
  // ¿la parroquia elegida es la misma de la tienda? Sólo entonces se permite retiro.
  const puedeRetirar = !!tienda.parroquiaCod && zona.parroquiaCod === tienda.parroquiaCod;
  const tipoEntregaEf: "servientrega" | "retiro" = puedeRetirar ? tipoEntrega : "servientrega";
  const envio = tipoEntregaEf === "retiro" || !zona.cantonCod ? 0 : envioEfectivo(cantonObj, parrObj);
  const totalConEnvio = total + envio;

  const onBlurCedula = async () => {
    const msg = validarIdentificacion(form.cedula);
    setErrors((e) => ({ ...e, cedula: msg }));
    if (msg) return;
    const cli = await buscarCliente(form.cedula.trim());
    if (!cli) return;
    setForm((f) => ({ ...f, nombres: cli.nombres, apellidos: cli.apellidos, correo: cli.correo, celular: cli.celular, direccion: cli.direccion }));
    if (cli.provincia_cod && cli.canton_cod && cli.parroquia_cod) {
      setZona({
        provinciaCod: cli.provincia_cod, provinciaNombre: cli.provincia_nombre,
        cantonCod: cli.canton_cod, cantonNombre: cli.canton_nombre,
        parroquiaCod: cli.parroquia_cod, parroquiaNombre: cli.parroquia_nombre,
      });
    }
  };

  const rules: Record<string, () => string> = {
    cedula: () => validarIdentificacion(form.cedula),
    celular: () => (form.celular.trim() ? "" : "Ingresa tu celular."),
    nombres: () => (form.nombres.trim() ? "" : "Ingresa tus nombres."),
    apellidos: () => (form.apellidos.trim() ? "" : "Ingresa tus apellidos."),
    correo: () => (emailOk(form.correo) ? "" : "Ingresa un correo válido."),
    zona: () => (zona.provinciaCod && zona.cantonCod && zona.parroquiaCod ? "" : "Selecciona provincia, cantón y parroquia."),
    direccion: () => (form.direccion.trim() ? "" : "Ingresa tu dirección."),
    formaPago: () => (form.formaPago ? "" : "Elige una forma de pago."),
    banco: () => (!isTransfer || form.banco.trim() ? "" : "Indica el banco de origen."),
  };
  const blurField = (name: string) => setErrors((e) => ({ ...e, [name]: rules[name]?.() ?? "" }));

  const submit = async () => {
    const next: Record<string, string> = {};
    Object.keys(rules).forEach((k) => { const m = rules[k](); if (m) next[k] = m; });
    setErrors(next);
    if (Object.keys(next).length > 0) { setErr(""); return; }

    setErr("");
    setSubmitting(true);
    const cliente: Cliente = {
      cedula: form.cedula, nombres: form.nombres, apellidos: form.apellidos,
      correo: form.correo, celular: form.celular, direccion: form.direccion,
      provinciaCod: zona.provinciaCod, provinciaNombre: zona.provinciaNombre,
      cantonCod: zona.cantonCod, cantonNombre: zona.cantonNombre,
      parroquiaCod: zona.parroquiaCod, parroquiaNombre: zona.parroquiaNombre,
      ciudad: zona.cantonNombre,
      tipoEntrega: tipoEntregaEf,
    };
    const pago: Pago = {
      formaPago: form.formaPago,
      estadoPago: form.estadoPago,
      bancoOrigen: form.banco,
      numeroComprobante: "",
      valorPagado: form.estadoPago === "Pagado" ? totalConEnvio : 0,
      fechaPago: form.estadoPago === "Pagado" ? today() : "",
      observacionPago: "",
    };
    const res = await createOrder(cliente, pago, "Sitio web / carrito", items);
    setSubmitting(false);
    if (res.ok && res.numero) {
      clear();
      void reload();
      if (tipoEntregaEf === "retiro") setDoneRetiro(tienda.direccion || "");
      setDone(res.numero);
    } else {
      setErr(res.error ?? "No se pudo generar la orden.");
    }
  };

  return (
    <div className="nat-shell" style={{ padding: "26px 18px 8px", maxWidth: 820 }}>
      <SectionHead
        kicker="Mi pedido"
        title={step === "cart" ? "Carrito" : "Tus datos"}
        right={step === "datos" ? <button className="nat-link" onClick={() => { setStep("cart"); setErr(""); }}>← Volver</button> : undefined}
      />

      {step === "cart" ? (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px" }}>
            <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{count} {count === 1 ? "prenda" : "prendas"}</span>
            <button className="nat-link" onClick={clear}>Vaciar carrito</button>
          </div>
          {items.map((i) => {
            const ep = productById(i.productId);
            const max = ep && !ep.backorderActive ? availableStock(ep, i.talla) : 99999;
            const atMax = i.cantidad >= max;
            return (
              <div key={i.id} className="nat-cartline">
                <div className="nat-cartline-img"><ImageSlot url={i.image} ratio="1 / 1" radius={10} placeholder={i.productName} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Bodoni Moda',serif", fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>{i.productName}</div>
                  <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12.5, color: "var(--ink)", opacity: 0.6, margin: "2px 0 8px" }}>
                    {i.color ? "Color " + i.color : ""}{i.color && i.talla ? " · " : ""}{i.talla ? "Talla " + i.talla : ""}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div className="nat-qty">
                      <button onClick={() => updateQty(i.id, i.cantidad - 1)} aria-label="Menos">−</button>
                      <span>{i.cantidad}</span>
                      <button onClick={() => updateQty(i.id, i.cantidad + 1)} disabled={atMax} aria-label="Más">+</button>
                    </div>
                    <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12.5, color: "var(--ink)", opacity: 0.6 }}>{money(i.precioUnitario)} c/u</span>
                    {ep && !ep.backorderActive && (
                      <span className={"nat-cart-stock" + (atMax ? " is-max" : "")}>{atMax ? "Máx · " + max + " en stock" : max + " disponibles"}</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right", flex: "none", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <span style={{ fontFamily: "'Bodoni Moda',serif", fontWeight: 700, fontSize: 18, color: "var(--ink)" }}>{money(i.subtotal)}</span>
                  <button className="nat-tagx" style={{ width: 28, height: 28 }} title="Quitar" onClick={() => removeItem(i.id)}>✕</button>
                </div>
              </div>
            );
          })}

          <div className="nat-cart-summary">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>Total</span>
              <span style={{ fontFamily: "'Bodoni Moda',serif", fontWeight: 700, fontSize: 26, color: "var(--ink)" }}>{money(total)}</span>
            </div>
            <button className="nat-btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={() => { setStep("datos"); setErr(""); }}>Continuar al pedido →</button>
            <p style={{ margin: "10px 0 0", textAlign: "center", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, color: "var(--ink)", opacity: 0.55 }}>Sin pago en línea: coordinamos el envío contigo.</p>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 18 }} className="nat-admin-2col">
          <ACard>
            <h3 className="nat-editor-h">Tus datos</h3>
            <div className="nat-admin-2col" style={{ gap: 12 }}>
              <AField label="Cédula / identificación" hint="Si ya compraste antes, cargamos tus datos." error={errors.cedula}>
                <AInput className={errors.cedula ? "is-error" : ""} value={form.cedula} onChange={(e) => set("cedula", e.target.value)} onBlur={onBlurCedula} />
              </AField>
              <AField label="Celular" error={errors.celular}>
                <AInput className={errors.celular ? "is-error" : ""} value={form.celular} inputMode="tel" onChange={(e) => set("celular", e.target.value)} onBlur={() => blurField("celular")} />
              </AField>
            </div>
            <div className="nat-admin-2col" style={{ gap: 12 }}>
              <AField label="Nombres" error={errors.nombres}>
                <AInput className={errors.nombres ? "is-error" : ""} value={form.nombres} onChange={(e) => set("nombres", e.target.value)} onBlur={() => blurField("nombres")} />
              </AField>
              <AField label="Apellidos" error={errors.apellidos}>
                <AInput className={errors.apellidos ? "is-error" : ""} value={form.apellidos} onChange={(e) => set("apellidos", e.target.value)} onBlur={() => blurField("apellidos")} />
              </AField>
            </div>
            <AField label="Correo electrónico" error={errors.correo}>
              <AInput className={errors.correo ? "is-error" : ""} value={form.correo} inputMode="email" onChange={(e) => set("correo", e.target.value)} onBlur={() => blurField("correo")} />
            </AField>
            <AField label="Dirección" hint="Tu dirección (calle, número, referencia)." error={errors.direccion}>
              <AInput className={errors.direccion ? "is-error" : ""} value={form.direccion} onChange={(e) => set("direccion", e.target.value)} onBlur={() => blurField("direccion")} />
            </AField>

            <h3 className="nat-editor-h" style={{ marginTop: 4 }}>Entrega</h3>
            <ZonaSelect value={zona} onChange={(z) => { setZona(z); if (z.provinciaCod && z.cantonCod && z.parroquiaCod) setErrors((e) => ({ ...e, zona: "" })); }} />
            {errors.zona && <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, fontWeight: 600, color: "#9a3b32", margin: "-8px 0 14px" }}>{errors.zona}</div>}
            {puedeRetirar && (
              <AField label="Tipo de entrega" hint="Estás en la misma zona de la tienda: puedes retirar sin costo de envío.">
                <div style={{ display: "flex", gap: 8 }}>
                  {([["servientrega", "Envío Servientrega"], ["retiro", "Retiro en tienda"]] as const).map(([id, lb]) => (
                    <button key={id} type="button" onClick={() => setTipoEntrega(id)} className="nat-statebtn"
                      style={{ flex: 1, borderColor: "var(--teal)", color: tipoEntregaEf === id ? "#fff" : "var(--teal)", background: tipoEntregaEf === id ? "var(--teal)" : "transparent" }}>
                      {lb}
                    </button>
                  ))}
                </div>
                {tipoEntregaEf === "retiro" && (
                  <div style={{ marginTop: 8, fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "var(--ink)" }}>
                    Retiras en: <strong>{tienda.direccion || "te compartiremos la dirección por WhatsApp"}</strong>
                  </div>
                )}
              </AField>
            )}

            <h3 className="nat-editor-h" style={{ marginTop: 4 }}>Forma de pago</h3>
            <AField label="¿Cómo quieres pagar?" hint="La tienda confirma el estado y el comprobante del pago." error={errors.formaPago}>
              <ASelect className={errors.formaPago ? "is-error" : ""} value={form.formaPago} onChange={(e) => { set("formaPago", (e.target as HTMLSelectElement).value); setErrors((er) => ({ ...er, formaPago: "" })); }}>
                <option value="">— Elige —</option>
                {catalogs.paymentMethods.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </ASelect>
            </AField>
            {isTransfer && (
              <AField label="Banco de origen" hint="La tienda confirma el comprobante del pago." error={errors.banco}>
                <ASelect className={errors.banco ? "is-error" : ""} value={form.banco} onChange={(e) => { set("banco", (e.target as HTMLSelectElement).value); setErrors((er) => ({ ...er, banco: "" })); }}>
                  <option value="">— Elige —</option>
                  {catalogs.banks.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                </ASelect>
              </AField>
            )}
            {err && <div className="nat-movemsg err">{err}</div>}
            <button className="nat-btn-primary" style={{ width: "100%" }} onClick={submit} disabled={submitting}>
              {submitting ? "Generando…" : "Generar orden"}
            </button>
          </ACard>

          <ACard style={{ alignSelf: "start" }}>
            <h3 className="nat-editor-h">Resumen</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((i) => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13 }}>
                  <span style={{ color: "var(--ink)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {i.cantidad}× {i.productName} <span style={{ opacity: 0.55 }}>{i.talla}{i.color ? " · " + i.color : ""}</span>
                  </span>
                  <span style={{ fontWeight: 700, color: "var(--ink)", flex: "none" }}>{money(i.subtotal)}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "var(--ink)" }}>
                <span style={{ opacity: 0.7 }}>Subtotal</span>
                <span style={{ fontWeight: 700 }}>{money(total)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "var(--ink)" }}>
                <span style={{ opacity: 0.7 }}>Envío {zona.cantonCod ? "" : "(elige tu ubicación)"}</span>
                <span style={{ fontWeight: 700 }}>{zona.cantonCod ? (tipoEntregaEf === "retiro" ? "Retiro en tienda" : envio > 0 ? money(envio) : "Gratis") : "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
                <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>Total</span>
                <span style={{ fontFamily: "'Bodoni Moda',serif", fontWeight: 700, fontSize: 22, color: "var(--teal)" }}>{money(totalConEnvio)}</span>
              </div>
            </div>
          </ACard>
        </div>
      )}
    </div>
  );
}
