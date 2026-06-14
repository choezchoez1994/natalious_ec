import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImageSlot } from "../components/ImageSlot";
import { SectionHead, EmptyState, Spinner } from "../components/ui";
import { Sparkle } from "../components/icons";
import { ACard, AField, AInput, ASelect } from "../components/form";
import { useCart } from "../store/CartContext";
import { useCatalog } from "../store/CatalogContext";
import { createOrder } from "../services/orders";
import { availableStock } from "../lib/effective";
import { money, today } from "../lib/format";
import type { Cliente, Pago } from "../lib/types";

function emailOk(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || "");
}

export function Cart() {
  const navigate = useNavigate();
  const { items, total, count, updateQty, removeItem, clear } = useCart();
  const { productById, catalogs, loading, reload } = useCatalog();

  const [step, setStep] = useState<"cart" | "datos">("cart");
  const [done, setDone] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    cedula: "", nombres: "", apellidos: "", correo: "", celular: "", ciudad: "", direccion: "",
    formaPago: "", estadoPago: "Pendiente", banco: "", comprobante: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) return <Spinner />;

  if (done) {
    return (
      <div className="nat-shell" style={{ padding: "40px 18px 30px", maxWidth: 560 }}>
        <div style={{ textAlign: "center" }}>
          <div className="nat-empty-mark" style={{ margin: "0 auto", width: 64, height: 64 }}><Sparkle size={26} color="var(--teal)" /></div>
          <h2 style={{ margin: "18px 0 6px", fontFamily: "'Bodoni Moda',serif", fontStyle: "italic", fontWeight: 600, fontSize: 26, color: "var(--ink)" }}>¡Orden generada!</h2>
          <p style={{ margin: "0 auto 6px", maxWidth: 420, fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14.5, lineHeight: 1.5, color: "var(--ink)", opacity: 0.7 }}>
            Tu orden <strong>{done}</strong> fue generada correctamente. Nos comunicaremos contigo para coordinar el envío.
          </p>
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

  const submit = async () => {
    if (!form.cedula.trim()) return setErr("Ingresa tu cédula o identificación.");
    if (!form.nombres.trim()) return setErr("Ingresa tus nombres.");
    if (!form.apellidos.trim()) return setErr("Ingresa tus apellidos.");
    if (!emailOk(form.correo)) return setErr("Ingresa un correo válido.");
    if (!form.celular.trim()) return setErr("Ingresa tu celular.");
    if (!form.ciudad.trim()) return setErr("Selecciona tu ciudad de residencia.");
    if (!form.direccion.trim()) return setErr("Ingresa la dirección de entrega.");
    if (!form.formaPago) return setErr("Elige una forma de pago.");
    if (isTransfer && !form.banco.trim()) return setErr("Indica el banco de origen de la transferencia.");
    if (isTransfer && !form.comprobante.trim()) return setErr("Indica el número de comprobante / referencia.");

    setErr("");
    setSubmitting(true);
    const cliente: Cliente = {
      cedula: form.cedula, nombres: form.nombres, apellidos: form.apellidos,
      correo: form.correo, celular: form.celular, ciudad: form.ciudad, direccion: form.direccion,
    };
    const pago: Pago = {
      formaPago: form.formaPago,
      estadoPago: form.estadoPago,
      bancoOrigen: form.banco,
      numeroComprobante: form.comprobante,
      valorPagado: form.estadoPago === "Pagado" ? total : 0,
      fechaPago: form.estadoPago === "Pagado" ? today() : "",
      observacionPago: "",
    };
    const res = await createOrder(cliente, pago, "Sitio web / carrito", items);
    setSubmitting(false);
    if (res.ok && res.numero) {
      clear();
      void reload();
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
            <h3 className="nat-editor-h">Datos para la entrega</h3>
            <div className="nat-admin-2col" style={{ gap: 12 }}>
              <AField label="Cédula / identificación"><AInput value={form.cedula} onChange={(e) => set("cedula", e.target.value)} /></AField>
              <AField label="Celular"><AInput value={form.celular} inputMode="tel" onChange={(e) => set("celular", e.target.value)} /></AField>
            </div>
            <div className="nat-admin-2col" style={{ gap: 12 }}>
              <AField label="Nombres"><AInput value={form.nombres} onChange={(e) => set("nombres", e.target.value)} /></AField>
              <AField label="Apellidos"><AInput value={form.apellidos} onChange={(e) => set("apellidos", e.target.value)} /></AField>
            </div>
            <AField label="Correo electrónico"><AInput value={form.correo} inputMode="email" onChange={(e) => set("correo", e.target.value)} /></AField>
            <div className="nat-admin-2col" style={{ gap: 12 }}>
              <AField label="Ciudad de residencia">
                <ASelect value={form.ciudad} onChange={(e) => set("ciudad", (e.target as HTMLSelectElement).value)}>
                  <option value="">— Elige —</option>
                  {catalogs.cities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </ASelect>
              </AField>
              <AField label="Dirección de entrega"><AInput value={form.direccion} onChange={(e) => set("direccion", e.target.value)} /></AField>
            </div>

            <h3 className="nat-editor-h" style={{ marginTop: 4 }}>Forma de pago</h3>
            <AField label="¿Cómo quieres pagar?" hint="La tienda confirma el estado y el comprobante del pago.">
              <ASelect value={form.formaPago} onChange={(e) => set("formaPago", (e.target as HTMLSelectElement).value)}>
                <option value="">— Elige —</option>
                {catalogs.paymentMethods.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </ASelect>
            </AField>
            {isTransfer && (
              <div className="nat-admin-2col" style={{ gap: 12 }}>
                <AField label="Banco de origen" hint="Requerido para transferencia.">
                  <ASelect value={form.banco} onChange={(e) => set("banco", (e.target as HTMLSelectElement).value)}>
                    <option value="">— Elige —</option>
                    {catalogs.banks.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </ASelect>
                </AField>
                <AField label="N° comprobante / referencia" hint="Requerido para transferencia.">
                  <AInput value={form.comprobante} onChange={(e) => set("comprobante", e.target.value)} />
                </AField>
              </div>
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
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>Total</span>
              <span style={{ fontFamily: "'Bodoni Moda',serif", fontWeight: 700, fontSize: 22, color: "var(--teal)" }}>{money(total)}</span>
            </div>
          </ACard>
        </div>
      )}
    </div>
  );
}
