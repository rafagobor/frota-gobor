/**
 * CNPJ (numérico e alfanumérico) e CPF.
 *
 * CNPJ alfanumérico (Receita Federal, a partir de jul/2026): as 12 primeiras posições
 * aceitam [0-9A-Z] e as 2 últimas (DV) continuam numéricas. No cálculo do DV, cada
 * caractere vale (código ASCII − 48): '0'..'9' → 0..9, 'A' → 17, ..., 'Z' → 42.
 * Para CNPJs só com números, o resultado é idêntico ao algoritmo tradicional.
 * Exemplo oficial usado nos testes: 12.ABC.345/01DE-35.
 */

const PESOS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export function limparCnpj(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor).toUpperCase().replace(/[^0-9A-Z]/g, '');
}

function dvCnpj(base, pesos) {
  let soma = 0;
  for (let i = 0; i < pesos.length; i++) soma += (base.charCodeAt(i) - 48) * pesos[i];
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cnpjValido(valor) {
  const c = limparCnpj(valor);
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(c)) return false;
  if (/^(\d)\1{13}$/.test(c)) return false;
  const dv1 = dvCnpj(c.slice(0, 12), PESOS_DV1);
  const dv2 = dvCnpj(c.slice(0, 12) + dv1, PESOS_DV2);
  return c[12] === String(dv1) && c[13] === String(dv2);
}

export function cnpjAlfanumerico(valor) {
  return /[A-Z]/.test(limparCnpj(valor).slice(0, 12));
}

/** XX.XXX.XXX/XXXX-XX (devolve o valor original se não tiver 14 caracteres). */
export function formatarCnpj(valor) {
  const c = limparCnpj(valor);
  if (c.length !== 14) return valor === null || valor === undefined ? '' : String(valor);
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}

export function limparCpf(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor).replace(/\D/g, '');
}

export function cpfValido(valor) {
  const c = limparCpf(valor).padStart(11, '0');
  if (!/^\d{11}$/.test(c) || /^(\d)\1{10}$/.test(c)) return false;
  const calc = (n) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(c[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(c[9]) && calc(10) === Number(c[10]);
}

export function formatarCpf(valor) {
  const c = limparCpf(valor);
  if (c.length !== 11) return valor === null || valor === undefined ? '' : String(valor);
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}

/** Valida um campo que aceita CNPJ ou CPF (locatários podem ser pessoa física). */
export function documentoValido(valor) {
  const c = limparCnpj(valor);
  if (c.length === 14) return cnpjValido(c);
  if (/^\d{11}$/.test(c)) return cpfValido(c);
  return false;
}

export function formatarDocumento(valor) {
  const c = limparCnpj(valor);
  if (c.length === 14) return formatarCnpj(c);
  if (/^\d{11}$/.test(c)) return formatarCpf(c);
  return valor === null || valor === undefined ? '' : String(valor);
}
