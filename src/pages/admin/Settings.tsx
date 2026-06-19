import { useEffect, useRef, useState } from "react";
import { ACard, ASectionTitle, AField, AInput, ATextarea, AToggle, LocalInput } from "../../components/form";
import { ZonaSelect } from "../../components/ZonaSelect";
import type { Zona } from "../../components/ZonaSelect";
import { Icon } from "../../components/icons";
import { Spinner } from "../../components/ui";
import { useConfirm } from "../../components/ConfirmDialog";
import { useCatalog } from "../../store/CatalogContext";
import { setSocial, setTienda, setWA } from "../../services/settings";
import { createCategory, deleteCategory, updateCategory } from "../../services/catalogs";
import { waLinkGeneral } from "../../lib/wa";
import { fmtPhone, fillTemplate, money } from "../../lib/format";
import type { WaConfig } from "../../lib/types";

function StoreSettings() {
  const { config, reload } = useCatalog();
  const t = config.tienda;
  const [zona, setZona] = useState<Zona>({
    provinciaCod: t.provinciaCod, provinciaNombre: t.provinciaNombre,
    cantonCod: t.cantonCod, cantonNombre: t.cantonNombre,
    parroquiaCod: t.parroquiaCod, parroquiaNombre: t.parroquiaNombre,
  });
  useEffect(() => {
    setZona({
      provinciaCod: t.provinciaCod, provinciaNombre: t.provinciaNombre,
      cantonCod: t.cantonCod, cantonNombre: t.cantonNombre,
      parroquiaCod: t.parroquiaCod, parroquiaNombre: t.parroquiaNombre,
    });
  }, [t.provinciaCod, t.cantonCod, t.parroquiaCod]);

  const onZona = async (z: Zona) => {
    setZona(z);
    await setTienda({
      provinciaCod: z.provinciaCod, provinciaNombre: z.provinciaNombre,
      cantonCod: z.cantonCod, cantonNombre: z.cantonNombre,
      parroquiaCod: z.parroquiaCod, parroquiaNombre: z.parroquiaNombre,
    });
    await reload();
  };

  return (
    <ACard>
      <p className="nat-editor-sub">
        Ubicación y dirección de la tienda. Cuando un cliente elige la misma parroquia, podrá optar
        por <strong>retirar en tienda</strong> (sin costo de envío) y verá esta dirección.
      </p>
      <ZonaSelect value={zona} onChange={onZona} />
      <AField label="Dirección de la tienda" hint="Se muestra al cliente que elige retiro en tienda.">
        <LocalInput value={t.direccion} onCommit={async (v) => { await setTienda({ direccion: v }); await reload(); }} placeholder="Calle, número, referencia…" />
      </AField>
    </ACard>
  );
}

function VarChip({ token, onInsert }: { token: string; onInsert: (t: string) => void }) {
  return (
    <button type="button" onClick={() => onInsert(token)} style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 7, cursor: "pointer", padding: "4px 9px", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12.5, fontWeight: 600, color: "var(--teal)" }}>
      {"{" + token + "}"}
    </button>
  );
}

function WhatsAppSettings() {
  const { config, reload } = useCatalog();
  const [form, setForm] = useState<WaConfig>(config.wa);
  const tplRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => setForm(config.wa), [config.wa]);

  const set = (k: keyof WaConfig, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const commit = async (patch?: Partial<WaConfig>) => {
    await setWA(patch ?? form);
    await reload();
  };
  const insertVar = (token: string) => {
    const el = tplRef.current;
    const t = "{" + token + "}";
    if (!el) {
      set("template", (form.template || "") + " " + t);
      return;
    }
    const s = el.selectionStart, e = el.selectionEnd, val = form.template || "";
    const next = val.slice(0, s) + t + val.slice(e);
    set("template", next);
    requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = s + t.length; });
  };

  const preview = (form.greeting || "") + " " + fillTemplate(form.template || "", { producto: "Flare Pants Premium", precio: money(18), mayor: money(16), color: "Negro", talla: "M" });
  const previewGeneral = (form.greeting || "") + " " + (form.generalTemplate || "");

  return (
    <div className="nat-admin-2col">
      <ACard>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
          <div>
            <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>Contacto por WhatsApp</div>
            <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12.5, color: "var(--ink)", opacity: 0.55 }}>Contacto secundario (footer y ficha de producto).</div>
          </div>
          <AToggle on={form.enabled} onChange={(on) => { set("enabled", on); void commit({ ...form, enabled: on }); }} labels={["Activo", "Inactivo"]} />
        </div>

        <AField label="Número de WhatsApp" hint={"Se mostrará como " + fmtPhone(form.number)}>
          <AInput value={form.number} inputMode="tel" onChange={(e) => set("number", e.target.value)} onBlur={() => commit()} placeholder="593959915283" />
        </AField>
        <AField label="Saludo"><AInput value={form.greeting} onChange={(e) => set("greeting", e.target.value)} onBlur={() => commit()} /></AField>
        <AField label="Plantilla del mensaje de producto" hint="Toca una variable para insertarla donde está el cursor.">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {["producto", "precio", "mayor", "color", "talla"].map((t) => <VarChip key={t} token={t} onInsert={insertVar} />)}
          </div>
          <ATextarea ref={tplRef} rows={3} value={form.template} onChange={(e) => set("template", e.target.value)} onBlur={() => commit()} />
        </AField>
        <AField label="Mensaje general (botón del catálogo)">
          <ATextarea rows={2} value={form.generalTemplate} onChange={(e) => set("generalTemplate", e.target.value)} onBlur={() => commit()} />
        </AField>
        <div className="nat-admin-2col" style={{ gap: 14 }}>
          <AField label="Horario de atención"><AInput value={form.hours} onChange={(e) => set("hours", e.target.value)} onBlur={() => commit()} /></AField>
          <AField label="Nota de respuesta"><AInput value={form.replyNote} onChange={(e) => set("replyNote", e.target.value)} onBlur={() => commit()} /></AField>
        </div>
      </ACard>

      <div>
        <ACard style={{ background: "#0b141a", border: "none", padding: 0, overflow: "hidden", position: "sticky", top: 80 }}>
          <div style={{ background: "#1f2c33", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 999, background: "var(--teal)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'Bodoni Moda',serif", fontStyle: "italic", fontWeight: 700 }}>n</span>
            <div>
              <div style={{ color: "#fff", fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, fontSize: 14 }}>natalious</div>
              <div style={{ color: "#8fa4ad", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 11.5 }}>{form.enabled ? "en línea" : "no disponible"}</div>
            </div>
          </div>
          <div className="nat-wa-bg" style={{ padding: "18px 14px", display: "flex", flexDirection: "column", gap: 10, minHeight: 240, background: "#0b141a", backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
            <Bubble text={preview} time="12:45 ✓✓" />
            <Bubble text={previewGeneral} time="12:46 ✓✓" />
          </div>
          <div style={{ padding: 14, background: "#0b141a" }}>
            <a href={waLinkGeneral(form)} target="_blank" rel="noreferrer" className="nat-btn-wa" style={{ width: "100%" }}>
              {Icon.whatsapp(false)} Abrir chat de prueba
            </a>
          </div>
        </ACard>
        <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, color: "var(--ink)", opacity: 0.55, marginTop: 10, textAlign: "center" }}>
          Vista previa con datos de ejemplo. Las variables se completan con el producto real.
        </p>
      </div>
    </div>
  );
}

function Bubble({ text, time }: { text: string; time: string }) {
  return (
    <div style={{ position: "relative", alignSelf: "flex-end", maxWidth: "88%", background: "#075e54", color: "#e9f3ee", borderRadius: "12px 12px 3px 12px", padding: "10px 13px 18px", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13.5, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
      {text}
      <span style={{ position: "absolute", right: 10, bottom: 5, fontSize: 10, color: "rgba(233,243,238,0.6)" }}>{time}</span>
    </div>
  );
}

function CategoryManager() {
  const { categories, products, reload } = useCatalog();
  const confirm = useConfirm();
  const ordered = [...categories].sort((a, b) => a.sort - b.sort);
  const [newName, setNewName] = useState("");
  const count = (id: string) => products.filter((p) => p.category_id === id).length;

  const move = async (id: string, dir: number) => {
    const i = ordered.findIndex((c) => c.id === id);
    const j = i + dir;
    if (j < 0 || j >= ordered.length) return;
    await updateCategory(ordered[i].id, { sort: ordered[j].sort });
    await updateCategory(ordered[j].id, { sort: ordered[i].sort });
    await reload();
  };

  return (
    <ACard>
      <p className="nat-editor-sub">Crea categorías, define su orden, visibilidad en el carrusel y estado.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ordered.map((c, i) => (
          <div key={c.id} className="nat-opt-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
            <div className="nat-admin-2col" style={{ gap: 12 }}>
              <AField label="Nombre"><LocalInput value={c.name} onCommit={async (v) => { await updateCategory(c.id, { name: v }); await reload(); }} /></AField>
              <AField label="Frase / claim corto"><LocalInput value={c.tagline} onCommit={async (v) => { await updateCategory(c.id, { tagline: v }); await reload(); }} /></AField>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, fontWeight: 700, color: "var(--teal)" }}>{count(c.id)} productos</span>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <AToggle on={c.active} onChange={async (v) => { await updateCategory(c.id, { active: v }); await reload(); }} /><span className="nat-toggle-text">Activa</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <AToggle on={c.show_in_carousel} onChange={async (v) => { await updateCategory(c.id, { show_in_carousel: v }); await reload(); }} /><span className="nat-toggle-text">En carrusel</span>
              </label>
              <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                <button className="nat-iconbtn" disabled={i === 0} title="Subir" onClick={() => move(c.id, -1)}>↑</button>
                <button className="nat-iconbtn" disabled={i === ordered.length - 1} title="Bajar" onClick={() => move(c.id, 1)}>↓</button>
                <button className="nat-iconbtn is-danger" title="Eliminar" onClick={async () => { if (await confirm({ title: "Eliminar categoría", message: "¿Eliminar categoría “" + c.name + "”? Los productos quedarán sin categoría.", confirmLabel: "Eliminar", danger: true })) { await deleteCategory(c.id); await reload(); } }}>✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 7, marginTop: 12 }}>
        <AInput value={newName} placeholder="Nueva categoría (ej. Tops)" onChange={(e) => setNewName(e.target.value)} onKeyDown={async (e) => { if (e.key === "Enter" && newName.trim()) { await createCategory(newName.trim()); setNewName(""); await reload(); } }} />
        <button className="nat-btn-ghost" style={{ padding: "10px 16px", flex: "none" }} onClick={async () => { if (newName.trim()) { await createCategory(newName.trim()); setNewName(""); await reload(); } }}>+ Crear</button>
      </div>
    </ACard>
  );
}

export function Settings() {
  const { config, loading, reload } = useCatalog();
  if (loading) return <Spinner />;

  return (
    <div>
      <ASectionTitle kicker="Tienda" title="Ajustes" />
      <ASectionTitle kicker="Ubicación" title="Datos de la tienda" />
      <StoreSettings />

      <ASectionTitle kicker="Contacto" title="WhatsApp" />
      <WhatsAppSettings />

      <ASectionTitle kicker="Marca" title="Redes sociales" />
      <ACard>
        <div className="nat-admin-2col" style={{ gap: 14 }}>
          <AField label="Instagram"><LocalInput value={config.social.handleIg} onCommit={async (v) => { await setSocial({ handleIg: v }); await reload(); }} placeholder="@natalious.ec" /></AField>
          <AField label="TikTok"><LocalInput value={config.social.handleTk} onCommit={async (v) => { await setSocial({ handleTk: v }); await reload(); }} placeholder="@natalious.ec" /></AField>
        </div>
        <AField label="Hashtags sugeridos" hint="Para tus publicaciones."><LocalInput value={config.social.hashtags} onCommit={async (v) => { await setSocial({ hashtags: v }); await reload(); }} /></AField>
      </ACard>

      <ASectionTitle kicker="Catálogo" title="Categorías" />
      <CategoryManager />
    </div>
  );
}
