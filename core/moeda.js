/**
 * Valores monetários: no núcleo e na planilha são números (reais, 2 casas). O formato
 * "R$ 1.234,56" existe só na exibição.
 *
 * As somas são feitas em centavos inteiros para evitar erro de ponto flutuante.
 */

/**
 * Converte texto em número. Regras para textos (vindos de CSV ou colagem em pt-BR):
 * - com vírgula → formato BR ("1.234,56", "130,16");
 * - sem vírgula e com mais de um ponto → pontos de milhar ("1.234.567");
 * - sem vírgula e um único ponto seguido de exatamente 3 dígitos → milhar ("1.203" = 1203);
 * - sem vírgula e um único ponto com outra quantidade de dígitos → decimal ("130.16").
 * Aceita "R$", espaços e negativo com "-" ou entre parênteses.
 * @returns {number|null}
 */
export function parseMoeda(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  let s = String(valor).replace(/ /g, ' ').trim();
  if (!s) return null;
  let negativo = false;
  if (/^\(.*\)$/.test(s)) { negativo = true; s = s.slice(1, -1); }
  s = s.replace(/R\$/gi, '').replace(/\s+/g, '');
  if (s.startsWith('-')) { negativo = !negativo; s = s.slice(1); }
  if (!/^[\d.,]+$/.test(s)) return null;
  if (s.includes(',')) {
    if (s.indexOf(',') !== s.lastIndexOf(',')) return null;
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    const pontos = (s.match(/\./g) || []).length;
    if (pontos > 1) s = s.replace(/\./g, '');
    else if (pontos === 1 && /^\d{1,3}\.\d{3}$/.test(s)) s = s.replace('.', '');
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return negativo ? -n : n;
}

/** Centavos inteiros. toPrecision(15) remove o ruído binário (1.005 * 100 = 100.4999…). */
export function paraCentavos(n) {
  const x = Number(n);
  return Math.sign(x) * Math.round(Number((Math.abs(x) * 100).toPrecision(15)));
}

export function arredondar2(n) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return null;
  return paraCentavos(n) / 100;
}

/** Soma ignorando vazios; devolve 0 se todos forem vazios. */
export function somar(valores) {
  let c = 0;
  for (const v of valores) {
    if (v === null || v === undefined || v === '') continue;
    c += paraCentavos(v);
  }
  return c / 100;
}

/** 1234.5 → "1.234,50" */
export function formatarNumeroBR(n, casas = 2) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return '';
  const negativo = Number(n) < 0;
  const fixo = Math.abs(Number(n)).toFixed(casas);
  const [inteiro, dec] = fixo.split('.');
  const milhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (negativo ? '-' : '') + milhar + (casas > 0 ? ',' + dec : '');
}

/** 1234.5 → "R$ 1.234,50"; -10 → "-R$ 10,00" */
export function formatarMoeda(n) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return '';
  const s = formatarNumeroBR(Math.abs(Number(n)), 2);
  return (Number(n) < 0 ? '-' : '') + 'R$ ' + s;
}
