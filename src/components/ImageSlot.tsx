import type { CSSProperties } from "react";
import { Sparkle } from "./icons";

interface Props {
  url?: string | null;
  ratio?: string; // "3 / 4", "1 / 1", "auto"
  fit?: "cover" | "contain";
  radius?: number;
  placeholder?: string;
  alt?: string;
  style?: CSSProperties;
  fill?: boolean;
}

/**
 * Reemplaza el web component <image-slot> del prototipo.
 * Muestra la imagen (Supabase Storage) o un placeholder boutique discreto.
 */
export function ImageSlot({
  url,
  ratio = "3 / 4",
  fit = "cover",
  radius = 0,
  placeholder = "",
  alt = "",
  style = {},
  fill = false,
}: Props) {
  const base: CSSProperties = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style }
    : { aspectRatio: ratio, borderRadius: radius, ...style };

  return (
    <div className="nat-imageslot" style={base}>
      {url ? (
        <img src={url} alt={alt || placeholder} style={{ objectFit: fit }} loading="lazy" />
      ) : (
        <div className="nat-imageslot-ph">
          <Sparkle size={18} color="var(--teal)" />
          {placeholder ? <span>{placeholder}</span> : null}
        </div>
      )}
    </div>
  );
}
