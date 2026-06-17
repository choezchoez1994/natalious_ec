import { useCatalog } from "../store/CatalogContext";
import { AField, ASelect } from "./form";

export interface Zona {
  provinciaCod: string;
  provinciaNombre: string;
  cantonCod: string;
  cantonNombre: string;
  parroquiaCod: string;
  parroquiaNombre: string;
}

export const ZONA_VACIA: Zona = {
  provinciaCod: "",
  provinciaNombre: "",
  cantonCod: "",
  cantonNombre: "",
  parroquiaCod: "",
  parroquiaNombre: "",
};

/**
 * Selects encadenados Provincia → Cantón → Parroquia (DPA INEC).
 * Emite la zona completa (códigos + nombres) en cada cambio.
 */
export function ZonaSelect({ value, onChange }: { value: Zona; onChange: (z: Zona) => void }) {
  const { catalogs } = useCatalog();
  const cantones = catalogs.cantones.filter((c) => c.provincia_cod === value.provinciaCod);
  const parroquias = catalogs.parroquias.filter((p) => p.canton_cod === value.cantonCod);

  const onProvincia = (cod: string) => {
    const p = catalogs.provincias.find((x) => x.codigo === cod);
    onChange({ ...ZONA_VACIA, provinciaCod: cod, provinciaNombre: p?.nombre ?? "" });
  };
  const onCanton = (cod: string) => {
    const c = catalogs.cantones.find((x) => x.codigo === cod);
    onChange({
      ...value,
      cantonCod: cod,
      cantonNombre: c?.nombre ?? "",
      parroquiaCod: "",
      parroquiaNombre: "",
    });
  };
  const onParroquia = (cod: string) => {
    const p = catalogs.parroquias.find((x) => x.codigo === cod);
    onChange({ ...value, parroquiaCod: cod, parroquiaNombre: p?.nombre ?? "" });
  };

  return (
    <>
      <div className="nat-admin-2col" style={{ gap: 12 }}>
        <AField label="Provincia">
          <ASelect value={value.provinciaCod} onChange={(e) => onProvincia((e.target as HTMLSelectElement).value)}>
            <option value="">— Elige —</option>
            {catalogs.provincias.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
          </ASelect>
        </AField>
        <AField label="Cantón">
          <ASelect value={value.cantonCod} disabled={!value.provinciaCod} onChange={(e) => onCanton((e.target as HTMLSelectElement).value)}>
            <option value="">{value.provinciaCod ? "— Elige —" : "Elige provincia"}</option>
            {cantones.map((c) => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
          </ASelect>
        </AField>
      </div>
      <AField label="Parroquia">
        <ASelect value={value.parroquiaCod} disabled={!value.cantonCod} onChange={(e) => onParroquia((e.target as HTMLSelectElement).value)}>
          <option value="">{value.cantonCod ? "— Elige —" : "Elige cantón"}</option>
          {parroquias.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
        </ASelect>
      </AField>
    </>
  );
}
