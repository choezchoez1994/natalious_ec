import { useEffect, useMemo, useState } from "react";
import { ACard, ASectionTitle, AField, AInput, ASelect, AStepper, PriceField } from "../../components/form";
import { Spinner } from "../../components/ui";
import { useCatalog } from "../../store/CatalogContext";
import { fetchMovements, manualSale, registerMovement } from "../../services/inventory";
import { availableStock } from "../../lib/effective";
import { money, today } from "../../lib/format";
import type { Movement } from "../../lib/types";

type Mode = "salida" | "ingreso" | "venta";

function StockBox({ size, cur }: { size: string; cur: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 9, padding: "10px 12px", marginBottom: 14 }}>
      <div>
        <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--ink)", opacity: 0.55 }}>Talla</div>
        <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{size || "—"}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--ink)", opacity: 0.55 }}>Stock actual</div>
        <div style={{ fontFamily: "'Bodoni Moda',serif", fontSize: 20, fontWeight: 700, color: cur <= 0 ? "#9a3b32" : "var(--ink)" }}>{cur} u.</div>
      </div>
    </div>
  );
}

function ProductSizeColor({
  pid, size, color, onProduct, onSize, onColor,
}: {
  pid: string; size: string; color: string;
  onProduct: (id: string) => void; onSize: (s: string) => void; onColor: (c: string) => void;
}) {
  const { products } = useCatalog();
  const p = products.find((x) => x.id === pid);
  return (
    <>
      <AField label="Producto">
        <ASelect value={pid} onChange={(e) => onProduct((e.target as HTMLSelectElement).value)}>
          {products.map((pp) => <option key={pp.id} value={pp.id}>{pp.name}{pp.hidden ? " (oculto)" : ""}</option>)}
        </ASelect>
      </AField>
      <div className="nat-admin-2col" style={{ gap: 12 }}>
        {p && p.effColors.length > 0 && (
          <AField label="Color" hint="No afecta stock.">
            <ASelect value={color} onChange={(e) => onColor((e.target as HTMLSelectElement).value)}>
              <option value="">—</option>
              {p.effColors.map((c) => <option key={c.name} value={c.name}>{c.name}{c.blocked ? " (bloqueado)" : ""}</option>)}
            </ASelect>
          </AField>
        )}
        {p && p.effSizes.length > 0 && (
          <AField label="Talla" hint="El stock se afecta por talla.">
            <ASelect value={size} onChange={(e) => onSize((e.target as HTMLSelectElement).value)}>
              {p.effSizes.map((s) => <option key={s.name} value={s.name}>{s.name}{s.blocked ? " (bloqueada)" : ""}</option>)}
            </ASelect>
          </AField>
        )}
      </div>
    </>
  );
}

function MovementForm({ mode, onDone }: { mode: "ingreso" | "salida"; onDone: () => Promise<void> }) {
  const { products, catalogs } = useCatalog();
  const reasons = catalogs.movementReasons.filter((r) => r.kind === mode && !(mode === "salida" && r.id === "venta"));
  const [pid, setPid] = useState(products[0]?.id ?? "");
  const p = products.find((x) => x.id === pid);
  const firstAvail = (arr: { name: string; blocked?: boolean }[]) => (arr.find((c) => !c.blocked) ?? arr[0])?.name ?? "";
  const [color, setColor] = useState(p ? firstAvail(p.effColors) : "");
  const [size, setSize] = useState(p ? firstAvail(p.effSizes) : "");
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState(reasons[0]?.id ?? "");
  const [customReason, setCustomReason] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [resp, setResp] = useState("Administradora");
  const [force, setForce] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!reasons.find((r) => r.id === reason)) setReason(reasons[0]?.id ?? ""); }, [reason, reasons]);

  const onProduct = (id: string) => {
    setPid(id);
    const np = products.find((x) => x.id === id);
    setColor(np ? firstAvail(np.effColors) : "");
    setSize(np ? firstAvail(np.effSizes) : "");
  };
  const cur = p ? availableStock(p, size) : 0;

  const submit = async () => {
    setBusy(true);
    const res = await registerMovement({ productId: pid, kind: mode, color, size, qty, reason, customReason, date, note, responsable: resp, force });
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, t: "Movimiento registrado ✓" });
      setQty(1); setNote(""); setForce(false);
      await onDone();
      setTimeout(() => setMsg(null), 2200);
    } else setMsg({ ok: false, t: res.error ?? "Error" });
  };

  return (
    <ACard>
      <h3 className="nat-editor-h">{mode === "ingreso" ? "Registrar ingreso" : "Registrar salida (no venta)"}</h3>
      <ProductSizeColor pid={pid} size={size} color={color} onProduct={onProduct} onSize={setSize} onColor={setColor} />
      <StockBox size={size} cur={cur} />

      <div className="nat-admin-2col" style={{ gap: 12 }}>
        <AField label="Cantidad"><AStepper value={qty} min={1} onChange={setQty} /></AField>
        <AField label={mode === "ingreso" ? "Motivo de ingreso" : "Motivo de salida"}>
          <ASelect value={reason} onChange={(e) => setReason((e.target as HTMLSelectElement).value)}>
            {reasons.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </ASelect>
        </AField>
      </div>
      {reason === "otro" && <AField label="Especifica el motivo"><AInput value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Ej. donación, muestra…" /></AField>}

      <div className="nat-admin-2col" style={{ gap: 12 }}>
        <AField label="Fecha"><input type="date" className="nat-input" value={date} onChange={(e) => setDate(e.target.value)} /></AField>
        <AField label="Responsable"><AInput value={resp} onChange={(e) => setResp(e.target.value)} /></AField>
      </div>
      <AField label="Observación"><AInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opcional" /></AField>

      {mode === "salida" && qty > cur && (
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
          <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12.5, color: "#8a352d", fontWeight: 600 }}>Ajuste autorizado: permitir salida mayor al stock ({cur} u.)</span>
        </label>
      )}
      {mode === "salida" && qty > cur && !force && <div className="nat-stockhint is-out" style={{ marginBottom: 12 }}>La cantidad supera el stock disponible ({cur} u.).</div>}
      {msg && <div className={"nat-movemsg " + (msg.ok ? "ok" : "err")}>{msg.t}</div>}

      <button className="nat-btn-primary" style={{ width: "100%" }} onClick={submit} disabled={busy || (mode === "salida" && qty > cur && !force)}>
        {busy ? "Registrando…" : mode === "ingreso" ? "Registrar ingreso" : "Registrar salida"}
      </button>
    </ACard>
  );
}

function ManualSaleForm({ onDone }: { onDone: () => Promise<void> }) {
  const { products, catalogs } = useCatalog();
  const [pid, setPid] = useState(products[0]?.id ?? "");
  const p = products.find((x) => x.id === pid);
  const firstAvail = (arr: { name: string; blocked?: boolean }[]) => (arr.find((c) => !c.blocked) ?? arr[0])?.name ?? "";
  const [color, setColor] = useState(p ? firstAvail(p.effColors) : "");
  const [size, setSize] = useState(p ? firstAvail(p.effSizes) : "");
  const [qty, setQty] = useState(1);
  const [precio, setPrecio] = useState<number | null>(p ? p.retail : null);
  const [canal, setCanal] = useState("");
  const [f, setF] = useState({ cedula: "", nombres: "", apellidos: "", correo: "", celular: "", ciudad: "", direccion: "", formaPago: "", estadoPago: "Pagado", banco: "", comprobante: "" });
  const [note, setNote] = useState("");
  const [force, setForce] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));

  const onProduct = (id: string) => {
    setPid(id);
    const np = products.find((x) => x.id === id);
    setColor(np ? firstAvail(np.effColors) : "");
    setSize(np ? firstAvail(np.effSizes) : "");
    setPrecio(np ? np.retail : null);
  };
  const cur = p ? availableStock(p, size) : 0;
  const isTransfer = f.formaPago === "Transferencia bancaria";

  const submit = async () => {
    if (!f.nombres.trim() || !f.apellidos.trim()) return setMsg({ ok: false, t: "Ingresa nombres y apellidos del cliente." });
    if (!f.celular.trim()) return setMsg({ ok: false, t: "Ingresa el celular del cliente." });
    if (!f.ciudad.trim()) return setMsg({ ok: false, t: "Selecciona la ciudad." });
    if (!canal) return setMsg({ ok: false, t: "Selecciona el canal de origen." });
    if (!f.formaPago) return setMsg({ ok: false, t: "Selecciona la forma de pago." });
    if (isTransfer && (!f.banco.trim() || !f.comprobante.trim())) return setMsg({ ok: false, t: "Banco y comprobante son obligatorios en transferencia." });
    if (!precio || precio <= 0) return setMsg({ ok: false, t: "Ingresa un precio de venta válido." });

    setBusy(true);
    const res = await manualSale({
      productId: pid, size, color, qty, precioVenta: precio,
      cliente: { cedula: f.cedula, nombres: f.nombres, apellidos: f.apellidos, correo: f.correo, celular: f.celular, ciudad: f.ciudad, direccion: f.direccion },
      pago: { formaPago: f.formaPago, estadoPago: f.estadoPago, bancoOrigen: f.banco, numeroComprobante: f.comprobante, valorPagado: f.estadoPago === "Pagado" ? precio * qty : 0, fechaPago: f.estadoPago === "Pagado" ? today() : "", observacionPago: "" },
      canal, note, force,
    });
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, t: "Venta manual registrada ✓" });
      setQty(1); setNote("");
      await onDone();
      setTimeout(() => setMsg(null), 2400);
    } else setMsg({ ok: false, t: res.error ?? "Error" });
  };

  return (
    <ACard>
      <h3 className="nat-editor-h">Venta manual desde inventario</h3>
      <p className="nat-editor-sub">Descuenta stock por talla de inmediato, cuenta como venta y alimenta los reportes.</p>
      <ProductSizeColor pid={pid} size={size} color={color} onProduct={onProduct} onSize={setSize} onColor={setColor} />
      <StockBox size={size} cur={cur} />
      <div className="nat-admin-2col" style={{ gap: 12 }}>
        <AField label="Cantidad"><AStepper value={qty} min={1} onChange={setQty} /></AField>
        <AField label="Precio de venta real (unitario)"><PriceField value={precio} onCommit={(v) => setPrecio(v)} /></AField>
      </div>

      <h3 className="nat-editor-h" style={{ marginTop: 4 }}>Datos del cliente</h3>
      <div className="nat-admin-2col" style={{ gap: 12 }}>
        <AField label="Cédula / identificación"><AInput value={f.cedula} onChange={(e) => set("cedula", e.target.value)} /></AField>
        <AField label="Celular"><AInput value={f.celular} inputMode="tel" onChange={(e) => set("celular", e.target.value)} /></AField>
      </div>
      <div className="nat-admin-2col" style={{ gap: 12 }}>
        <AField label="Nombres"><AInput value={f.nombres} onChange={(e) => set("nombres", e.target.value)} /></AField>
        <AField label="Apellidos"><AInput value={f.apellidos} onChange={(e) => set("apellidos", e.target.value)} /></AField>
      </div>
      <div className="nat-admin-2col" style={{ gap: 12 }}>
        <AField label="Correo (opcional)"><AInput value={f.correo} inputMode="email" onChange={(e) => set("correo", e.target.value)} /></AField>
        <AField label="Ciudad">
          <ASelect value={f.ciudad} onChange={(e) => set("ciudad", (e.target as HTMLSelectElement).value)}>
            <option value="">— Elige —</option>
            {catalogs.cities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </ASelect>
        </AField>
      </div>
      <AField label="Dirección de entrega"><AInput value={f.direccion} onChange={(e) => set("direccion", e.target.value)} /></AField>
      <AField label="Canal de origen">
        <ASelect value={canal} onChange={(e) => setCanal((e.target as HTMLSelectElement).value)}>
          <option value="">— Elige —</option>
          {catalogs.channels.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </ASelect>
      </AField>

      <h3 className="nat-editor-h" style={{ marginTop: 4 }}>Pago</h3>
      <div className="nat-admin-2col" style={{ gap: 12 }}>
        <AField label="Forma de pago">
          <ASelect value={f.formaPago} onChange={(e) => set("formaPago", (e.target as HTMLSelectElement).value)}>
            <option value="">— Elige —</option>
            {catalogs.paymentMethods.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </ASelect>
        </AField>
        <AField label="Estado de pago">
          <ASelect value={f.estadoPago} onChange={(e) => set("estadoPago", (e.target as HTMLSelectElement).value)}>
            {catalogs.paymentStatuses.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </ASelect>
        </AField>
      </div>
      {isTransfer && (
        <div className="nat-admin-2col" style={{ gap: 12 }}>
          <AField label="Banco de origen">
            <ASelect value={f.banco} onChange={(e) => set("banco", (e.target as HTMLSelectElement).value)}>
              <option value="">— Elige —</option>
              {catalogs.banks.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
            </ASelect>
          </AField>
          <AField label="N° comprobante / referencia"><AInput value={f.comprobante} onChange={(e) => set("comprobante", e.target.value)} /></AField>
        </div>
      )}
      <AField label="Notas"><AInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opcional" /></AField>

      {qty > cur && (
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
          <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12.5, color: "#8a352d", fontWeight: 600 }}>Forzar venta sobre stock ({cur} u.)</span>
        </label>
      )}
      {msg && <div className={"nat-movemsg " + (msg.ok ? "ok" : "err")}>{msg.t}</div>}
      <button className="nat-btn-primary" style={{ width: "100%" }} onClick={submit} disabled={busy || (qty > cur && !force)}>
        {busy ? "Registrando…" : "Registrar venta · " + money((precio ?? 0) * qty)}
      </button>
    </ACard>
  );
}

function Kardex({ movements }: { movements: Movement[] }) {
  const [filter, setFilter] = useState("todos");
  let list = movements;
  if (filter === "salida") list = movements.filter((m) => m.kind === "salida" && m.reason !== "venta");
  else if (filter === "ingreso") list = movements.filter((m) => m.kind === "ingreso");
  else if (filter === "venta") list = movements.filter((m) => m.reason === "venta");

  return (
    <ACard>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <h3 className="nat-editor-h" style={{ margin: 0 }}>Kardex · historial</h3>
        <div className="nat-filterbar" style={{ display: "flex", gap: 6 }}>
          {[["todos", "Todos"], ["venta", "Ventas"], ["salida", "Salidas"], ["ingreso", "Ingresos"]].map(([id, lb]) => (
            <button key={id} className={"nat-chip" + (filter === id ? " is-active" : "")} style={{ flex: "none", padding: "6px 12px", fontSize: 12 }} onClick={() => setFilter(id)}>{lb}</button>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13.5, color: "var(--ink)", opacity: 0.55, margin: 0 }}>Aún no hay movimientos registrados.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 560, overflowY: "auto" }}>
          {list.map((m) => (
            <div key={m.id} className="nat-kardex-row">
              <span className={"nat-kardex-tag " + (m.kind === "salida" ? (m.reason === "venta" ? "venta" : "salida") : "ingreso")}>
                {m.kind === "salida" ? "−" : "+"}{m.qty}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.product_name}</div>
                <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 11.5, color: "var(--ink)", opacity: 0.6 }}>
                  {m.sku} · {m.color !== "—" ? m.color + " · " : ""}{m.size !== "—" ? "T " + m.size + " · " : ""}{m.reason_label}{m.note ? " · " + m.note : ""}
                </div>
              </div>
              <div style={{ textAlign: "right", flex: "none" }}>
                <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{m.prev}→{m.next}</div>
                <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 11, color: "var(--ink)", opacity: 0.5 }}>{m.fecha}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ACard>
  );
}

export function Movements() {
  const { reload } = useCatalog();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("salida");

  const refresh = async () => setMovements(await fetchMovements());
  useEffect(() => { void refresh().finally(() => setLoading(false)); }, []);
  const onDone = useMemo(() => async () => { await refresh(); await reload(); }, [reload]);

  if (loading) return <Spinner />;

  return (
    <div>
      <ASectionTitle kicker="Inventario" title="Movimientos" />
      <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "var(--ink)", opacity: 0.6, margin: "-6px 0 16px" }}>
        Cada cambio de stock genera un movimiento (Kardex). Las <strong>ventas</strong> (manuales o por orden enviada) alimentan los reportes de rotación.
      </p>
      <div className="nat-seg" style={{ marginBottom: 16 }}>
        <button className={"nat-seg-btn" + (mode === "salida" ? " is-active" : "")} onClick={() => setMode("salida")}>Salida</button>
        <button className={"nat-seg-btn" + (mode === "ingreso" ? " is-active" : "")} onClick={() => setMode("ingreso")}>Ingreso</button>
        <button className={"nat-seg-btn" + (mode === "venta" ? " is-active" : "")} onClick={() => setMode("venta")}>Venta manual</button>
      </div>
      <div className="nat-admin-2col" style={{ alignItems: "start" }}>
        {mode === "venta" ? <ManualSaleForm onDone={onDone} /> : <MovementForm mode={mode} onDone={onDone} />}
        <Kardex movements={movements} />
      </div>
    </div>
  );
}
