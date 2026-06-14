import {
  forwardRef,
  useEffect,
  useState,
} from "react";
import type { CSSProperties, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { Sparkle } from "./icons";

export function ACard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: 18, ...style }}>
      {children}
    </div>
  );
}

export function ASectionTitle({ kicker, title, right }: { kicker?: string; title: string; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
      <div>
        {kicker && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--teal)", marginBottom: 4 }}>
            <Sparkle size={11} />
            <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>{kicker}</span>
          </div>
        )}
        <h2 style={{ margin: 0, fontFamily: "'Bodoni Moda',serif", fontWeight: 600, fontSize: 24, color: "var(--ink)" }}>{title}</h2>
      </div>
      {right}
    </div>
  );
}

export function AField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: "var(--ink)", marginBottom: 6 }}>{label}</div>
      {children}
      {hint && <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, color: "var(--ink)", opacity: 0.55, marginTop: 5 }}>{hint}</div>}
    </label>
  );
}

export function AInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={"nat-input " + (props.className || "")} />;
}

export const ATextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function ATextarea(props, ref) {
    return <textarea ref={ref} {...props} className={"nat-input " + (props.className || "")} />;
  }
);

export function ASelect(props: InputHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const { children, ...rest } = props;
  return (
    <select {...(rest as any)} className={"nat-input " + (props.className || "")}>
      {children}
    </select>
  );
}

export function AToggle({ on, onChange, labels }: { on: boolean; onChange: (v: boolean) => void; labels?: [string, string] }) {
  return (
    <button onClick={() => onChange(!on)} className="nat-toggle-wrap" aria-pressed={on} type="button">
      <span className="nat-track" data-on={on ? "1" : "0"}><span className="nat-knob" /></span>
      {labels && <span className="nat-toggle-text">{on ? labels[0] : labels[1]}</span>}
    </button>
  );
}

export function AStepper({ value, onChange, min = 0, step = 1 }: { value: number; onChange: (v: number) => void; min?: number; step?: number }) {
  const set = (v: number) => onChange(Math.max(min, v));
  return (
    <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--line)", borderRadius: 9, background: "var(--paper)", overflow: "hidden" }}>
      <button type="button" className="nat-step" onClick={() => set(value - step)}>−</button>
      <input type="number" value={value} onChange={(e) => set(parseInt(e.target.value || "0", 10))} style={{ width: 48, textAlign: "center", border: "none", background: "transparent", fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: "var(--ink)", MozAppearance: "textfield" }} />
      <button type="button" className="nat-step" onClick={() => set(value + step)}>+</button>
    </div>
  );
}

/** Input que confirma onBlur (evita perder el cursor con re-render del store). */
export function LocalInput({
  value,
  onCommit,
  multiline,
  rows,
  ...rest
}: {
  value: string;
  onCommit: (v: string) => void;
  multiline?: boolean;
  rows?: number;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const [v, setV] = useState(value ?? "");
  useEffect(() => setV(value ?? ""), [value]);
  const commit = () => { if (v !== value) onCommit(v); };
  if (multiline) {
    return (
      <ATextarea
        rows={rows || 3}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
      />
    );
  }
  return (
    <AInput
      {...rest}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
    />
  );
}

export function PriceField({
  value,
  onCommit,
  placeholder,
  prefix = "$",
}: {
  value: number | null;
  onCommit: (v: number | null) => void;
  placeholder?: string;
  prefix?: string;
}) {
  const [v, setV] = useState(value == null ? "" : String(value));
  useEffect(() => setV(value == null ? "" : String(value)), [value]);
  const commit = () => onCommit(v === "" ? null : parseFloat(v.replace(",", ".")) || 0);
  return (
    <div className="nat-priceinput">
      <span>{prefix}</span>
      <input
        value={v}
        inputMode="decimal"
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value.replace(/[^\d.,]/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />
    </div>
  );
}
