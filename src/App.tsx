import { Navigate, Route, Routes } from "react-router-dom";
import { CatalogProvider } from "./store/CatalogContext";
import { CartProvider } from "./store/CartContext";
import { AuthProvider } from "./store/AuthContext";
import { ConfirmProvider } from "./components/ConfirmDialog";
import { PublicLayout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Catalog, Categories } from "./pages/Catalog";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { AdminApp } from "./pages/admin/AdminApp";
import { isSupabaseConfigured } from "./lib/supabase";

function ConfigWarning() {
  return (
    <div className="nat-gate">
      <div className="nat-gate-card" style={{ maxWidth: 460 }}>
        <h2 style={{ fontFamily: "'Bodoni Moda',serif", fontStyle: "italic", fontWeight: 600, fontSize: 22, color: "var(--ink)", textAlign: "center" }}>
          Configura Supabase
        </h2>
        <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, color: "var(--ink)", opacity: 0.7, textAlign: "center", lineHeight: 1.5 }}>
          Copia <code>.env.example</code> a <code>.env</code> y completa{" "}
          <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>. Luego ejecuta las
          migraciones de <code>supabase/</code>. Revisa el README para los pasos.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  if (!isSupabaseConfigured) return <ConfigWarning />;

  return (
    <AuthProvider>
      <CatalogProvider>
        <CartProvider>
          <ConfirmProvider>
          <div className="nat-app nat-wide">
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/catalogo" element={<Catalog />} />
                <Route path="/catalogo/:category" element={<Catalog />} />
                <Route path="/categorias" element={<Categories />} />
                <Route path="/producto/:id" element={<ProductDetail />} />
                <Route path="/carrito" element={<Cart />} />
              </Route>
              <Route path="/admin/*" element={<AdminApp />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          </ConfirmProvider>
        </CartProvider>
      </CatalogProvider>
    </AuthProvider>
  );
}
