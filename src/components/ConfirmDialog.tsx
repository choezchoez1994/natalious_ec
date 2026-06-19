import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export type ConfirmOptions = {
  /** Título del diálogo. Por defecto "Confirmar". */
  title?: string;
  /** Mensaje principal (texto o nodo). */
  message: ReactNode;
  /** Texto del botón de confirmación. Por defecto "Aceptar". */
  confirmLabel?: string;
  /** Texto del botón de cancelación. Por defecto "Cancelar". */
  cancelLabel?: string;
  /** Estilo de peligro (rojo) para acciones destructivas como eliminar. */
  danger?: boolean;
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

const ConfirmCtx = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null);

/** Hook: devuelve una función `confirm(opts) => Promise<boolean>` que abre el diálogo. */
export function useConfirm() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const okBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setPending({ ...opts, resolve })),
    [],
  );

  const close = useCallback(
    (ok: boolean) => {
      setPending((cur) => {
        cur?.resolve(ok);
        return null;
      });
    },
    [],
  );

  // Foco en el botón principal + atajos de teclado (Enter / Escape).
  useEffect(() => {
    if (!pending) return;
    okBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(false); }
      else if (e.key === "Enter") { e.preventDefault(); close(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, close]);

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {pending &&
        createPortal(
          <div className="nat-confirm-backdrop" onMouseDown={() => close(false)}>
            <div
              className="nat-confirm"
              role="alertdialog"
              aria-modal="true"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className={"nat-confirm-icon" + (pending.danger ? " is-danger" : "")}>
                {pending.danger ? (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
              </div>
              <h3 className="nat-confirm-title">{pending.title ?? "Confirmar"}</h3>
              <p className="nat-confirm-msg">{pending.message}</p>
              <div className="nat-confirm-actions">
                <button type="button" className="nat-btn-ghost nat-confirm-btn" onClick={() => close(false)}>
                  {pending.cancelLabel ?? "Cancelar"}
                </button>
                <button
                  type="button"
                  ref={okBtnRef}
                  className={"nat-confirm-btn " + (pending.danger ? "nat-confirm-danger" : "nat-btn-primary")}
                  onClick={() => close(true)}
                >
                  {pending.confirmLabel ?? "Aceptar"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </ConfirmCtx.Provider>
  );
}
