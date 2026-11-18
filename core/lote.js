/**
 * Colagem em lote (prompt §5.4 e §5.13): valores de guia, nº MTO e pagamentos, colados
 * de planilha/e-mail/ERP. Aceita tabulação (copiar do Excel/Sheets), ";" ou ",", com ou
 * sem cabeçalho. Com cabeçalho, as colunas são achadas pelo NOME.
 *
 *   GUIA       placa ; tributo ; parcela ; valor ; vencimento ; linha_digitavel (opcional)
 *   MTO        placa ; tributo ; parcela ; mto
 *   PAGAMENTO  placa ; tributo ; parcela ; valor ; data ; mto (opcional)
 *
 * Nada é gravado aqui: o resultado é uma prévia com o patch de cada linha (ou o erro).
 */

import { parseDataFlex } from './datas.js';
import { parseMoeda } from './moeda.js';
import { normalizarPlaca } from './placa.js';
import { normalizarMto, statusCalculado, validarObrigacao, obrigacaoQuitada } from './obrigacoes.js';

export const TIPOS_LOTE = {
  GUIA: ['placa', 'tributo', 'parcela', 'valor', 'vencimento', 'linha_digitavel'],
  MTO: ['placa', 'tributo', 'parcela', 'mto'],
  PAGAMENTO: ['placa', 'tributo', 'parcela', 'valor', 'data', 'mto'],
};

const SINONIMOS_COLUNA = {
  placa: ['placa', 'veiculo', 'veículo'],
  tributo: ['tributo', 'tipo', 'imposto'],
  parcela: ['parcela', 'cota', 'parc'],
  valor: ['valor', 'valor_guia', 'valor_pago', 'total', 'r$'],
  vencimento: ['vencimento', 'venc', 'data_vencimento'],
  linha_digitavel: ['linha_digitavel', 'linha digitável', 'linha digitavel', 'codigo de barras', 'código de barras'],
  mto: ['mto', 'nr_lancamento_erp', 'lancamento', 'lançamento', 'nº mto'],
  data: ['data', 'data_pagamento', 'pagamento', 'data pgto'],
};

function semAcento(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

/** "IPVA" | "LIC", "LICENCIAMENTO", "CRLV" → tributo do cadastro */
export function normalizarTributo(v) {
  const s = semAcento(v).replace(/[^a-z]/g, '');
  if (!s) return null;
  if (s.startsWith('ipva')) return 'IPVA';
  if (s.startsWith('lic') || s === 'crlv' || s === 'trlav') return 'LICENCIAMENTO';
  return null;
}

/** "U", "única", "cota única", "CU", "1ª", "2" → "U" | "1".."5" */
export function normalizarParcela(v) {
  const s = semAcento(v).replace(/\s+/g, '');
  if (!s) return null;
  if (['u', 'unica', 'cotaunica', 'cu', 'avista', 'integral'].includes(s)) return 'U';
  const m = s.match(/^([1-5])(a|ª|o|º|parcela)?$/);
  return m ? m[1] : null;
}

function separar(linha, sep) {
  if (sep === '\t') return linha.split('\t').map((c) => c.trim());
  // aspas simples de CSV
  const out = []; let campo = '', aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    if (aspas) {
      if (ch === '"' && linha[i + 1] === '"') { campo += '"'; i++; } else if (ch === '"') aspas = false; else campo += ch;
    } else if (ch === '"') aspas = true;
    else if (ch === sep) { out.push(campo.trim()); campo = ''; } else campo += ch;
  }
  out.push(campo.trim());
  return out;
}

/** Linhas → objetos com as colunas do tipo. Detecta separador e cabeçalho. */
export function lerLinhas(texto, tipo) {
  const colunas = TIPOS_LOTE[tipo];
  if (!colunas) throw new Error(`Tipo de lote desconhecido: ${tipo}`);
  const linhas = String(texto || '').replace(/\r/g, '').split('\n').map((l, i) => ({ n: i + 1, t: l })).filter((l) => l.t.trim());
  if (!linhas.length) return [];
  const amostra = linhas[0].t;
  const sep = amostra.includes('\t') ? '\t' : amostra.includes(';') ? ';' : ',';
  let mapa = colunas.map((_, i) => i);
  const primeira = separar(linhas[0].t, sep).map(semAcento);
  const ehCabecalho = primeira.some((c) => SINONIMOS_COLUNA.placa.includes(c));
  if (ehCabecalho) {
    mapa = colunas.map((col) => primeira.findIndex((c) => (SINONIMOS_COLUNA[col] || [col]).includes(c)));
    linhas.shift();
  }
  return linhas.map((l) => {
    const cel = separar(l.t, sep);
    const reg = { linha: l.n };
    colunas.forEach((col, i) => { reg[col] = mapa[i] >= 0 ? (cel[mapa[i]] || '') : ''; });
    return reg;
  });
}

/**
 * Prévia do lote.
 * @param {object} p
 * @param {'GUIA'|'MTO'|'PAGAMENTO'} p.tipo
 * @param {string} p.texto
 * @param {number} p.exercicio
 * @param {object[]} p.obrigacoes obrigações do exercício
 * @param {object[]} p.veiculos
 * @param {string} p.hoje ISO
 * @returns {{itens:object[], validos:number, comErro:number}}
 */
export function previaLote({ tipo, texto, exercicio, obrigacoes, veiculos, hoje }) {
  const porPlaca = new Map();
  for (const v of veiculos) {
    const n = normalizarPlaca(v.placa);
    if (n) porPlaca.set(n, v);
  }
  const doAno = obrigacoes.filter((o) => Number(o.exercicio) === Number(exercicio));
  const vistos = new Set();
  const itens = lerLinhas(texto, tipo).map((r) => {
    const item = { linha: r.linha, placa: r.placa, tributo: r.tributo, parcela: r.parcela, erro: null, aviso: null, obrigacao_id: null, patch: null };
    const v = porPlaca.get(normalizarPlaca(r.placa));
    if (!v) return { ...item, erro: `Placa ${r.placa || '(vazia)'} não cadastrada` };
    const tributo = normalizarTributo(r.tributo);
    if (!tributo) return { ...item, erro: `Tributo "${r.tributo}" não reconhecido (use IPVA ou LICENCIAMENTO)` };
    let parcela = normalizarParcela(r.parcela);
    const candidatas = doAno.filter((o) => o.veiculo_id === v.veiculo_id && o.tributo === tributo && !['CANCELADO'].includes(o.status));
    if (!parcela && candidatas.length === 1) parcela = String(candidatas[0].parcela);
    const o = candidatas.find((x) => String(x.parcela) === parcela);
    if (!o) {
      const existentes = candidatas.map((x) => x.parcela).join(', ') || 'nenhuma';
      return { ...item, erro: `Obrigação ${tributo} parcela ${r.parcela || '?'} de ${v.placa} em ${exercicio} não encontrada (existentes: ${existentes})` };
    }
    if (vistos.has(o.obrigacao_id)) return { ...item, obrigacao_id: o.obrigacao_id, erro: 'Linha repetida no lote' };
    vistos.add(o.obrigacao_id);
    const patch = {};
    if (tipo === 'GUIA') {
      const valor = parseMoeda(r.valor);
      if (!(valor > 0)) return { ...item, obrigacao_id: o.obrigacao_id, erro: `Valor da guia inválido: "${r.valor}"` };
      if (obrigacaoQuitada(o)) return { ...item, obrigacao_id: o.obrigacao_id, erro: `Obrigação já está ${o.status}` };
      patch.valor_guia = valor;
      if (r.vencimento) {
        const venc = parseDataFlex(r.vencimento);
        if (!venc) return { ...item, obrigacao_id: o.obrigacao_id, erro: `Vencimento inválido: "${r.vencimento}"` };
        patch.vencimento = venc;
      }
      if (r.linha_digitavel) patch.linha_digitavel = r.linha_digitavel.replace(/\s+/g, ' ').trim();
    } else if (tipo === 'MTO') {
      const mto = normalizarMto(r.mto);
      if (!mto) return { ...item, obrigacao_id: o.obrigacao_id, erro: `Nº MTO inválido: "${r.mto}"` };
      patch.nr_lancamento_erp = mto;
      patch.data_lancamento_erp = hoje;
    } else {
      const valor = parseMoeda(r.valor);
      const data = parseDataFlex(r.data);
      if (!(valor > 0)) return { ...item, obrigacao_id: o.obrigacao_id, erro: `Valor pago inválido: "${r.valor}"` };
      if (!data) return { ...item, obrigacao_id: o.obrigacao_id, erro: `Data de pagamento inválida: "${r.data}"` };
      if (data > hoje) return { ...item, obrigacao_id: o.obrigacao_id, erro: `Data de pagamento no futuro: ${data}` };
      patch.valor_pago = valor;
      patch.data_pagamento = data;
      if (r.mto) {
        const mto = normalizarMto(r.mto);
        if (!mto) return { ...item, obrigacao_id: o.obrigacao_id, erro: `Nº MTO inválido: "${r.mto}"` };
        patch.nr_lancamento_erp = mto;
        if (!o.data_lancamento_erp) patch.data_lancamento_erp = hoje;
      }
      const ref = Number(o.valor_guia) > 0 ? Number(o.valor_guia) : null;
      if (ref && valor > ref) patch.encargos = Math.round((valor - ref) * 100) / 100;
    }
    const depois = { ...o, ...patch };
    depois.status = statusCalculado(depois);
    patch.status = depois.status;
    const erros = validarObrigacao(depois);
    if (erros.length) return { ...item, obrigacao_id: o.obrigacao_id, erro: erros.join('; ') };
    let aviso = null;
    if (tipo === 'PAGAMENTO' && !depois.nr_lancamento_erp) aviso = 'Pago sem nº MTO: vai para a fila "Pagos sem lançamento"';
    if (tipo === 'MTO' && o.nr_lancamento_erp && normalizarMto(o.nr_lancamento_erp) !== patch.nr_lancamento_erp) aviso = `Substitui o MTO anterior (${o.nr_lancamento_erp})`;
    if (tipo === 'GUIA' && o.valor_estimado && Math.abs(patch.valor_guia - o.valor_estimado) / o.valor_estimado > 0.2) aviso = `Guia ${Math.round((patch.valor_guia / o.valor_estimado - 1) * 100)}% diferente do estimado`;
    return { ...item, placa: v.placa, tributo, parcela: String(o.parcela), obrigacao_id: o.obrigacao_id, patch, aviso };
  });
  const comErro = itens.filter((i) => i.erro).length;
  return { itens, validos: itens.length - comErro, comErro };
}
