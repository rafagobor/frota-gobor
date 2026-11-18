/**
 * RENAVAM: texto com 11 dígitos (zeros à esquerda) e dígito verificador em módulo 11.
 *
 * Na planilha "previa 2027" os RENAVAMs foram gravados como número e perderam os
 * zeros à esquerda (33 com 9 dígitos e 179 com 10). Aqui eles voltam a 11 dígitos.
 */

const PESOS = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3];

/** Apenas os dígitos. Aceita número (1219574594), "1219574594.0" (Excel) ou texto com separadores. */
export function limparRenavam(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  let s;
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor) || !Number.isInteger(valor) || valor < 0) return '';
    s = String(valor);
  } else {
    s = String(valor).trim().replace(/\.0+$/, '');
  }
  return s.replace(/\D/g, '');
}

/** @returns {string|null} 11 dígitos, ou null se vazio ou com mais de 11 dígitos */
export function normalizarRenavam(valor) {
  const s = limparRenavam(valor);
  if (!s || s.length > 11) return null;
  return s.padStart(11, '0');
}

/** Dígito verificador a partir dos 10 primeiros dígitos (já completados com zeros). */
export function dvRenavam(base10) {
  if (!/^\d{10}$/.test(base10)) throw new Error('Base do RENAVAM deve ter 10 dígitos');
  const invertida = base10.split('').reverse();
  let soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(invertida[i]) * PESOS[i];
  const dv = (soma * 10) % 11;
  return dv === 10 ? 0 : dv;
}

export function renavamValido(valor) {
  const r = normalizarRenavam(valor);
  if (!r || /^0+$/.test(r)) return false;
  return dvRenavam(r.slice(0, 10)) === Number(r[10]);
}

/**
 * Diagnóstico para o Relatório de Saneamento.
 * @returns {{original:any, normalizado:string|null, valido:boolean, motivo:string|null}}
 */
export function analisarRenavam(valor) {
  const digitos = limparRenavam(valor);
  const normalizado = normalizarRenavam(valor);
  let motivo = null;
  if (!digitos) motivo = 'RENAVAM vazio';
  else if (digitos.length > 11) motivo = `RENAVAM com ${digitos.length} dígitos (máximo 11)`;
  else if (!renavamValido(valor)) motivo = 'Dígito verificador inválido';
  return { original: valor, normalizado, valido: motivo === null, motivo };
}
