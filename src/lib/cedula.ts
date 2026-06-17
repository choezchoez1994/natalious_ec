/**
 * Validación de cédula ecuatoriana (10 dígitos, módulo 10).
 * - 2 primeros dígitos: provincia válida (01–24, o 30 = exterior).
 * - 3er dígito < 6 (persona natural).
 * - 10º dígito: verificador (algoritmo módulo 10 con coeficientes 2,1,2,1…).
 */
export function validarCedulaEC(ced: string): boolean {
  if (!/^\d{10}$/.test(ced)) return false;
  const prov = parseInt(ced.slice(0, 2), 10);
  if (prov < 1 || (prov > 24 && prov !== 30)) return false;
  if (parseInt(ced[2], 10) > 5) return false;
  const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let v = parseInt(ced[i], 10) * coef[i];
    if (v >= 10) v -= 9;
    suma += v;
  }
  const verificador = (10 - (suma % 10)) % 10;
  return verificador === parseInt(ced[9], 10);
}

/**
 * Valida el campo "Cédula / identificación":
 * - 10 dígitos → debe ser cédula ecuatoriana válida.
 * - Otro formato → se acepta como pasaporte/identificación extranjera (mín. 4 caracteres).
 * Devuelve "" si es válido, o el mensaje de error.
 */
export function validarIdentificacion(valor: string): string {
  const s = (valor || "").trim();
  if (!s) return "Ingresa tu cédula o identificación.";
  if (/^\d{10}$/.test(s)) {
    return validarCedulaEC(s) ? "" : "La cédula ecuatoriana no es válida.";
  }
  if (/^\d+$/.test(s)) return "La cédula debe tener 10 dígitos.";
  return s.length >= 4 ? "" : "Ingresa una identificación válida.";
}
