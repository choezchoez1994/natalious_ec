import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wordmark } from "../../components/ui";
import { LockIcon } from "../../components/icons";
import { AInput } from "../../components/form";
import { useAuth } from "../../store/AuthContext";
import { Dashboard } from "./Dashboard";
import { Orders } from "./Orders";
import { Inventory } from "./Inventory";
import { Movements } from "./Movements";
import { Reports } from "./Reports";
import { CarouselAdmin } from "./CarouselAdmin";
import { CatalogsAdmin } from "./CatalogsAdmin";
import { Settings } from "./Settings";

const TABS = [
  { id: "dashboard", label: "Resumen" },
  { id: "orders", label: "Órdenes" },
  { id: "inventory", label: "Inventario" },
  { id: "movements", label: "Movimientos" },
  { id: "reports", label: "Reportes" },
  { id: "carousel", label: "Carrusel" },
  { id: "catalogs", label: "Catálogos" },
  { id: "settings", label: "Ajustes" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function AdminLogin() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const res = await signIn(email.trim(), pwd);
    setBusy(false);
    if (!res.ok) setErr(res.error ?? "No se pudo iniciar sesión.");
  };

  return (
    <div className="nat-gate">
      <div className="nat-gate-card">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6, color: "var(--teal)" }}>
          <LockIcon size={30} />
        </div>
        <Wordmark size={24} />
        <h2 style={{ margin: "14px 0 4px", fontFamily: "'Bodoni Moda',serif", fontStyle: "italic", fontWeight: 600, fontSize: 22, color: "var(--ink)", textAlign: "center" }}>Panel privado</h2>
        <p style={{ margin: "0 0 18px", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13.5, color: "var(--ink)", opacity: 0.6, textAlign: "center" }}>
          Ingresa con tu cuenta de administradora.
        </p>
        <form onSubmit={submit}>
          <AInput type="email" autoComplete="email" placeholder="correo@natalious.ec" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 10 }} />
          <AInput type="password" autoComplete="current-password" placeholder="Contraseña" value={pwd} onChange={(e) => setPwd(e.target.value)} />
          {err && <div style={{ color: "#9a3b32", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12.5, fontWeight: 600, textAlign: "center", marginTop: 8 }}>{err}</div>}
          <button type="submit" className="nat-btn-primary" style={{ width: "100%", marginTop: 14 }} disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
        </form>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <button onClick={() => navigate("/")} className="nat-link">← Volver a la tienda</button>
        </div>
      </div>
    </div>
  );
}

export function AdminApp() {
  const { session, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("dashboard");

  if (loading) {
    return (
      <div className="nat-gate">
        <div className="nat-spinner" />
      </div>
    );
  }
  if (!session) return <AdminLogin />;
  if (!isAdmin) {
    return (
      <div className="nat-gate">
        <div className="nat-gate-card">
          <h2 style={{ fontFamily: "'Bodoni Moda',serif", fontStyle: "italic", fontWeight: 600, fontSize: 22, color: "var(--ink)", textAlign: "center" }}>Sin permisos</h2>
          <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, color: "var(--ink)", opacity: 0.7, textAlign: "center" }}>
            Tu cuenta no tiene rol de administradora.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => navigate("/")} className="nat-btn-ghost">Ir a la tienda</button>
            <button onClick={() => signOut()} className="nat-btn-primary">Salir</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nat-admin">
      <header className="nat-admin-head">
        <div className="nat-shell" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, padding: "0 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Wordmark size={20} light />
            <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--paper)", opacity: 0.7, borderLeft: "1px solid rgba(255,255,255,0.25)", paddingLeft: 10 }}>Panel</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => navigate("/")} className="nat-admin-exit">Ver tienda ↗</button>
            <button onClick={() => signOut()} className="nat-admin-exit">Salir</button>
          </div>
        </div>
      </header>

      <nav className="nat-admin-tabs">
        <div className="nat-shell" style={{ display: "flex", gap: 4, padding: "0 12px", overflowX: "auto" }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={"nat-admin-tab" + (tab === t.id ? " is-active" : "")}>{t.label}</button>
          ))}
        </div>
      </nav>

      <main className="nat-shell" style={{ padding: "22px 18px 60px" }}>
        {tab === "dashboard" && <Dashboard onGoTab={setTab} />}
        {tab === "orders" && <Orders />}
        {tab === "inventory" && <Inventory />}
        {tab === "movements" && <Movements />}
        {tab === "reports" && <Reports />}
        {tab === "carousel" && <CarouselAdmin />}
        {tab === "catalogs" && <CatalogsAdmin />}
        {tab === "settings" && <Settings />}
      </main>
    </div>
  );
}
