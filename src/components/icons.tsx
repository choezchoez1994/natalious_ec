import type { CSSProperties } from "react";

export function Sparkle({
  size = 14,
  color = "currentColor",
  style = {},
}: {
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        lineHeight: 0,
        color,
        fontSize: size,
        transform: "translateY(0.04em)",
        ...style,
      }}
    >
      ✦
    </span>
  );
}

type IconFn = (active?: boolean) => JSX.Element;

export const Icon: Record<"inicio" | "catalogo" | "categorias" | "whatsapp" | "carrito", IconFn> = {
  inicio: (a) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={a ? 2.1 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.2 12 4l9 7.2" />
      <path d="M5.5 9.6V20h13V9.6" />
    </svg>
  ),
  catalogo: (a) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={a ? 2.1 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </svg>
  ),
  categorias: (a) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={a ? 2.1 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 6.2h17" />
      <path d="M3.5 12h17" />
      <path d="M3.5 17.8h17" />
      <circle cx="7.5" cy="6.2" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="17.8" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  whatsapp: (a) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={a ? 2.1 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 11.6a7.6 7.6 0 0 1-11.1 6.8L4.5 19.5l1.2-4.2A7.6 7.6 0 1 1 20 11.6Z" />
      <path d="M9.2 9.1c.2 2.4 2.3 4.5 4.7 4.7.5 0 1-.4 1.1-.9l-1.6-.8-.7.7c-.9-.4-1.7-1.2-2.1-2.1l.7-.7-.8-1.6c-.5.1-.9.6-1 1Z" fill="currentColor" stroke="none" />
    </svg>
  ),
  carrito: (a) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={a ? 2.1 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h2l2.1 11.4a1.6 1.6 0 0 0 1.6 1.3h8a1.6 1.6 0 0 0 1.6-1.3L20.5 8H6.2" />
      <circle cx="9.5" cy="20" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  ),
};

export const LockIcon = ({ size = 13 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const TrashIcon = ({ size = 15 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" />
  </svg>
);

export const ChevronLeft = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const BenefitIcon: Record<string, JSX.Element> = {
  truck: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h10v8H3zM13 10h4l3 3v2h-7z" />
      <circle cx="7" cy="17" r="1.5" />
      <circle cx="17" cy="17" r="1.5" />
    </svg>
  ),
  ruler: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="8" rx="1.4" />
      <path d="M7.5 8v3M12 8v4M16.5 8v3" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 11.5a7.3 7.3 0 0 1-10.7 6.5L5 19.3l1.2-4A7.3 7.3 0 1 1 20 11.5Z" />
    </svg>
  ),
  spark: <Sparkle size={16} color="currentColor" />,
};
