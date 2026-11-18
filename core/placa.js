/**
 * Placas de veículos (formato antigo LLLNNNN e Mercosul LLLNLNN).
 *
 * Regra de equivalência (prompt §5.1): na conversão para o padrão Mercosul, o 5º
 * caractere troca dígito por letra (0=A, 1=B, ..., 9=J). A forma canônica
 * (`placa_norm`) usa sempre o dígito, então CUC6H59 e CUC6759 têm a mesma placa_norm.
 * Todo "match" (cadastro, PDFs, migração, busca) compara pela placa_norm.
 */

const LETRAS_MERCOSUL = 'ABCDEFGHIJ';

/** Maiúsculas, sem hífen, espaço ou qualquer caractere não alfanumérico. */
export function limparPlaca(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** @returns {'ANTIGO'|'MERCOSUL'|null} */
export function formatoPlaca(valor) {
  const p = limparPlaca(valor);
  if (/^[A-Z]{3}[0-9]{4}$/.test(p)) return 'ANTIGO';
  if (/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(p)) return 'MERCOSUL';
  return null;
}

export function placaValida(valor) {
  return formatoPlaca(valor) !== null;
}

/**
 * Forma canônica para busca e unicidade. Mercosul com 5º caractere entre A e J vira
 * a forma numérica. Uma letra de K a Z (placa emitida já no padrão Mercosul, sem
 * equivalente antigo) é mantida como está.
 * @returns {string|null} null se a placa for inválida
 */
export function normalizarPlaca(valor) {
  const p = limparPlaca(valor);
  const formato = formatoPlaca(p);
  if (!formato) return null;
  if (formato === 'ANTIGO') return p;
  const idx = LETRAS_MERCOSUL.indexOf(p[4]);
  if (idx < 0) return p;
  return p.slice(0, 4) + String(idx) + p.slice(5);
}

/** Converte para a forma Mercosul (útil para exibir as duas formas na busca). */
export function paraMercosul(valor) {
  const p = limparPlaca(valor);
  const formato = formatoPlaca(p);
  if (!formato) return null;
  if (formato === 'MERCOSUL') return p;
  return p.slice(0, 4) + LETRAS_MERCOSUL[Number(p[4])] + p.slice(5);
}

export function placasEquivalentes(a, b) {
  const na = normalizarPlaca(a);
  return na !== null && na === normalizarPlaca(b);
}

/** As formas pelas quais a placa pode ser procurada (antiga e Mercosul). */
export function formasDaPlaca(valor) {
  const norm = normalizarPlaca(valor);
  if (!norm) return [];
  const merc = paraMercosul(norm);
  return merc && merc !== norm ? [norm, merc] : [norm];
}

/** Exibição: antiga como ABC-1234; Mercosul como ABC1D23. */
export function formatarPlaca(valor) {
  const p = limparPlaca(valor);
  const formato = formatoPlaca(p);
  if (formato === 'ANTIGO') return p.slice(0, 3) + '-' + p.slice(3);
  return p;
}

/** Último caractere numérico da placa (usado nos calendários por final de placa). */
export function finalDaPlaca(valor) {
  const norm = normalizarPlaca(valor);
  return norm ? norm[6] : null;
}
