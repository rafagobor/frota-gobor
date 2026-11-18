/**
 * Datas no núcleo são sempre texto ISO "AAAA-MM-DD" (dia de calendário, sem fuso).
 *
 * Os adaptadores do Apps Script convertem Date da planilha para ISO no fuso
 * America/Sao_Paulo antes de chamar o núcleo, e convertem de volta ao gravar. Assim a
 * lógica de prazos não depende do fuso de quem executa (Node nos testes, Apps Script em
 * produção). Toda a aritmética usa UTC.
 */

const DIA_MS = 86400000;

const MESES = {
  janeiro: 1, jan: 1, fevereiro: 2, fev: 2, marco: 3, mar: 3, abril: 4, abr: 4,
  maio: 5, mai: 5, junho: 6, jun: 6, julho: 7, jul: 7, agosto: 8, ago: 8,
  setembro: 9, set: 9, outubro: 10, out: 10, novembro: 11, nov: 11, dezembro: 12, dez: 12,
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** @returns {string|null} ISO se a data existir no calendário */
export function isoDeYMD(ano, mes, dia) {
  const y = Number(ano), m = Number(mes), d = Number(dia);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
  if (y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function ehIso(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [y, m, d] = valor.split('-');
  return isoDeYMD(y, m, d) === valor;
}

/** "dd/mm/aaaa", "dd/mm/aa", "dd-mm-aaaa", "dd.mm.aaaa" → ISO. Ano com 2 dígitos = 20aa. */
export function parseDataBR(texto) {
  if (texto === null || texto === undefined) return null;
  const m = String(texto).trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
  if (!m) return null;
  const ano = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  return isoDeYMD(ano, m[2], m[1]);
}

/**
 * Aceita ISO ("2027-01-15" ou "2027-01-15T10:30..."), data BR ou Date (componentes
 * locais: no Apps Script, converta antes com Utilities.formatDate).
 * @returns {string|null}
 */
export function parseDataFlex(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null;
    return isoDeYMD(valor.getFullYear(), valor.getMonth() + 1, valor.getDate());
  }
  const s = String(valor).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
  if (iso) return isoDeYMD(iso[1], iso[2], iso[3]);
  const semHora = s.replace(/\s+\d{1,2}:\d{2}(:\d{2})?$/, '');
  return parseDataBR(semHora);
}

/** "dd/mm/aaaa hh:mm" ou ISO com hora → "AAAA-MM-DD HH:MM" (sem fuso). */
export function parseDataHora(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const s = String(valor).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})/);
  if (m) {
    const d = isoDeYMD(m[1], m[2], m[3]);
    return d && Number(m[4]) < 24 && Number(m[5]) < 60 ? `${d} ${pad2(m[4])}:${m[5]}` : null;
  }
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})\s+(\d{1,2})[:h](\d{2})/);
  if (m) {
    const d = parseDataBR(`${m[1]}/${m[2]}/${m[3]}`);
    return d && Number(m[4]) < 24 && Number(m[5]) < 60 ? `${d} ${pad2(m[4])}:${m[5]}` : null;
  }
  return null;
}

/** ISO → "dd/mm/aaaa" */
export function dataBR(iso) {
  if (!ehIso(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function paraUTC(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function deUTC(ms) {
  const t = new Date(ms);
  return `${t.getUTCFullYear()}-${pad2(t.getUTCMonth() + 1)}-${pad2(t.getUTCDate())}`;
}

/** Dias de `de` até `ate` (positivo se `ate` for depois). */
export function diasEntre(de, ate) {
  if (!ehIso(de) || !ehIso(ate)) throw new Error(`Data inválida: ${!ehIso(de) ? de : ate}`);
  return Math.round((paraUTC(ate) - paraUTC(de)) / DIA_MS);
}

export function somarDias(iso, dias) {
  if (!ehIso(iso)) throw new Error(`Data inválida: ${iso}`);
  return deUTC(paraUTC(iso) + dias * DIA_MS);
}

/** Soma meses ajustando para o último dia do mês quando necessário (31/01 + 1 → 28/02). */
export function somarMeses(iso, meses) {
  if (!ehIso(iso)) throw new Error(`Data inválida: ${iso}`);
  const [y, m, d] = iso.split('-').map(Number);
  const total = y * 12 + (m - 1) + meses;
  const ny = Math.floor(total / 12), nm = (total % 12) + 1;
  const ultimo = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return isoDeYMD(ny, nm, Math.min(d, ultimo));
}

/** "setembro", "Março", "SET" → número do mês (ou null). */
export function mesPorExtenso(texto) {
  if (texto === null || texto === undefined) return null;
  const chave = String(texto).trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\.$/, '');
  return MESES[chave] || null;
}

/** ISO → competência "AAAA-MM" */
export function competenciaDe(iso) {
  if (!ehIso(iso)) throw new Error(`Data inválida: ${iso}`);
  return iso.slice(0, 7);
}

export function ehCompetencia(valor) {
  return typeof valor === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);
}

export function somarCompetencia(comp, meses) {
  if (!ehCompetencia(comp)) throw new Error(`Competência inválida: ${comp}`);
  return somarMeses(`${comp}-01`, meses).slice(0, 7);
}

/** 0 = domingo ... 6 = sábado */
export function diaDaSemana(iso) {
  return new Date(paraUTC(iso)).getUTCDay();
}

export function ehDiaUtil(iso, feriados = []) {
  const dow = diaDaSemana(iso);
  return dow !== 0 && dow !== 6 && !feriados.includes(iso);
}

export function proximoDiaUtil(iso, feriados = []) {
  let d = iso;
  while (!ehDiaUtil(d, feriados)) d = somarDias(d, 1);
  return d;
}

export function compararIso(a, b) {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a < b ? -1 : 1;
}
