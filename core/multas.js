/**
 * Multas: chave de deduplicação, mesclagem NA → NP e sinalizações automáticas.
 *
 * Chave (prompt §5.8): órgão (sigla) + nº do AIT normalizado. A Notificação de
 * Penalidade de um AIT que já existe ATUALIZA o registro (fase, valores, vencimento e
 * novo PDF anexado). Não cria outro registro. A NIC (cód. 500-2) tem AIT próprio e é
 * um registro separado, ligado pelo `ait_origem`.
 */

import { diasEntre, ehIso } from './datas.js';
import { normalizarPlaca } from './placa.js';

const ORDEM_FASE = { AUTUACAO: 1, PENALIDADE: 2 };

/** Campos que identificam a infração. Divergência entre documentos = conflito (vai para revisão). */
const CAMPOS_IDENTIDADE = ['placa_documento', 'data_hora_infracao', 'cod_infracao'];

/** Campos que mudam de uma fase para outra: a fase mais avançada prevalece. */
const CAMPOS_DA_FASE = [
  'valor_original', 'valor_com_desconto', 'valor_desconto_sne', 'vencimento_pgto',
  'linha_digitavel', 'prazo_recurso', 'nr_notificacao',
];

/** "1C 4260909" → "1C4260909"; "j-003.821.681" → "J003821681" */
export function normalizarAit(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor).toUpperCase().replace(/[^0-9A-Z]/g, '');
}

/** "der sp" → "DER-SP"; " PRF " → "PRF" */
export function normalizarOrgao(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor).toUpperCase().trim().replace(/[\s_/]+/g, '-').replace(/-+/g, '-');
}

export function chaveMulta(orgaoSigla, nrAit) {
  const o = normalizarOrgao(orgaoSigla), a = normalizarAit(nrAit);
  if (!o || !a) return null;
  return `${o}|${a}`;
}

export function ehNic(codInfracao) {
  return /^500/.test(String(codInfracao || '').replace(/\D/g, ''));
}

function vazio(v) {
  return v === null || v === undefined || v === '';
}

function comparavel(campo, valor) {
  if (campo === 'placa_documento') return normalizarPlaca(valor);
  if (campo === 'data_hora_infracao') return String(valor).slice(0, 10);
  if (campo === 'cod_infracao') return String(valor).replace(/\D/g, '');
  return valor;
}

/**
 * Mescla um documento extraído com o registro existente da mesma chave.
 * @param {object|null} existente registro atual (com `doc_ids` como array)
 * @param {object} nova campos extraídos do novo documento (inclui `fase`)
 * @param {string} docId id do arquivo no Drive
 * @returns {{acao:'CRIAR'|'ATUALIZAR'|'DUPLICADO'|'CONFLITO', registro:object,
 *            alterados:string[], conflitos:string[]}}
 */
export function mesclarNotificacao(existente, nova, docId) {
  if (!existente) {
    return { acao: 'CRIAR', registro: { ...nova, doc_ids: docId ? [docId] : [] }, alterados: Object.keys(nova), conflitos: [] };
  }
  const docs = Array.isArray(existente.doc_ids) ? existente.doc_ids : [];
  if (docId && docs.includes(docId)) {
    return { acao: 'DUPLICADO', registro: existente, alterados: [], conflitos: [] };
  }

  const conflitos = [];
  for (const campo of CAMPOS_IDENTIDADE) {
    if (!vazio(existente[campo]) && !vazio(nova[campo]) && comparavel(campo, existente[campo]) !== comparavel(campo, nova[campo])) {
      conflitos.push(`${campo}: "${existente[campo]}" × "${nova[campo]}"`);
    }
  }
  const rankAtual = ORDEM_FASE[existente.fase], rankNovo = ORDEM_FASE[nova.fase];
  if ((existente.fase || nova.fase) && (!rankAtual || !rankNovo) && existente.fase !== nova.fase) {
    conflitos.push(`fase incompatível: ${existente.fase} × ${nova.fase}`);
  }
  if (conflitos.length) return { acao: 'CONFLITO', registro: existente, alterados: [], conflitos };

  const avanca = rankNovo > rankAtual;
  const registro = { ...existente, doc_ids: docId ? [...docs, docId] : docs };
  const alterados = [];
  const definir = (campo, valor) => {
    if (registro[campo] !== valor) { registro[campo] = valor; alterados.push(campo); }
  };

  for (const [campo, valor] of Object.entries(nova)) {
    if (vazio(valor) || campo === 'doc_ids') continue;
    if (campo === 'data_expedicao') {
      // A data de expedição da autuação é a usada no alerta de expedição fora do prazo.
      const alvo = nova.fase === 'PENALIDADE' ? 'data_expedicao_penalidade' : 'data_expedicao';
      if (vazio(registro[alvo]) || nova.fase === 'PENALIDADE') definir(alvo, valor);
      continue;
    }
    if (avanca && (campo === 'fase' || CAMPOS_DA_FASE.includes(campo))) definir(campo, valor);
    else if (vazio(registro[campo])) definir(campo, valor);
  }
  return { acao: 'ATUALIZAR', registro, alterados, conflitos: [] };
}

/**
 * Sinalizações que dependem só da própria multa. EXPEDICAO_FORA_PRAZO é ALERTA para
 * avaliação humana (art. 281, parágrafo único, II do CTB), nunca conclusão.
 */
export function flagsMulta(m) {
  const flags = [];
  if (m.gravidade === 'GRAVISSIMA') flags.push('GRAVISSIMA');
  if (Number(m.fator_multiplicador) > 1) flags.push('FATOR_MULTIPLICADOR');
  if (m.suspensao_cnh === 'S' || m.suspensao_cnh === true) flags.push('SUSPENSAO_CNH');
  const dataInfracao = vazio(m.data_hora_infracao) ? null : String(m.data_hora_infracao).slice(0, 10);
  if (ehIso(dataInfracao) && ehIso(m.data_expedicao) && diasEntre(dataInfracao, m.data_expedicao) > 30) {
    flags.push('EXPEDICAO_FORA_PRAZO');
  }
  return flags;
}

/**
 * Reincidência da mesma placa, motorista ou locatário nos `janelaDias` anteriores à infração.
 * @param {object} m multa avaliada (com placa_norm, motorista_id, locatario_id, data_hora_infracao)
 * @param {object[]} historico demais multas
 */
export function flagsReincidencia(m, historico, janelaDias = 30) {
  const flags = new Set();
  const data = String(m.data_hora_infracao || '').slice(0, 10);
  if (!ehIso(data)) return [];
  for (const h of historico) {
    if (h.multa_id && h.multa_id === m.multa_id) continue;
    const dh = String(h.data_hora_infracao || '').slice(0, 10);
    if (!ehIso(dh)) continue;
    const d = diasEntre(dh, data);
    if (d < 0 || d > janelaDias) continue;
    if (m.placa_norm && h.placa_norm === m.placa_norm) flags.add('REINCIDENCIA_PLACA');
    if (m.motorista_id && h.motorista_id === m.motorista_id) flags.add('REINCIDENCIA_MOTORISTA');
    if (m.locatario_id && h.locatario_id === m.locatario_id) flags.add('REINCIDENCIA_LOCATARIO');
  }
  return [...flags];
}
