/**
 * Obrigações (IPVA, licenciamento, outros): status, transições e situação de prazo.
 *
 * Fluxo normal (prompt §5.5): PREVISTO → GUIA_DISPONIVEL → LANCADO_ERP (tem nº MTO) → PAGO.
 * Exceções: PAGO_SEM_LANCAMENTO, ISENTO, NAO_APLICA, CANCELADO, BLOQUEADO.
 * A situação de prazo (EM_DIA, VENCE_EM_7_DIAS, VENCE_HOJE, VENCIDO) é sempre calculada.
 */

import { diasEntre, ehIso } from './datas.js';

export const STATUS_OBRIGACAO = [
  'PREVISTO', 'GUIA_DISPONIVEL', 'LANCADO_ERP', 'PAGO', 'PAGO_SEM_LANCAMENTO',
  'ISENTO', 'NAO_APLICA', 'CANCELADO', 'BLOQUEADO',
];

/** Status que só mudam por ação explícita de alguém (não são derivados dos campos). */
const STATUS_MANUAIS = ['ISENTO', 'NAO_APLICA', 'CANCELADO', 'BLOQUEADO'];

/** Status em que a obrigação não gera mais alerta de prazo. */
const STATUS_QUITADOS = ['PAGO', 'PAGO_SEM_LANCAMENTO', 'ISENTO', 'NAO_APLICA', 'CANCELADO'];

const TRANSICOES = {
  PREVISTO: ['GUIA_DISPONIVEL', 'LANCADO_ERP', 'PAGO', 'PAGO_SEM_LANCAMENTO', 'ISENTO', 'NAO_APLICA', 'CANCELADO', 'BLOQUEADO'],
  GUIA_DISPONIVEL: ['PREVISTO', 'LANCADO_ERP', 'PAGO', 'PAGO_SEM_LANCAMENTO', 'ISENTO', 'NAO_APLICA', 'CANCELADO', 'BLOQUEADO'],
  LANCADO_ERP: ['GUIA_DISPONIVEL', 'PAGO', 'CANCELADO', 'BLOQUEADO'],
  PAGO_SEM_LANCAMENTO: ['PAGO'],
  PAGO: [],
  BLOQUEADO: ['PREVISTO', 'GUIA_DISPONIVEL', 'LANCADO_ERP', 'PAGO', 'PAGO_SEM_LANCAMENTO', 'CANCELADO'],
  ISENTO: ['PREVISTO'],
  NAO_APLICA: ['PREVISTO'],
  CANCELADO: ['PREVISTO'],
};

export function transicaoPermitida(de, para) {
  if (de === para) return true;
  return (TRANSICOES[de] || []).includes(para);
}

/** "mto413372", "MTO-413372", "413372" → "MTO 413372" */
export function normalizarMto(valor) {
  if (valor === null || valor === undefined) return null;
  const s = String(valor).toUpperCase().trim();
  if (!s) return null;
  const m = s.match(/^(?:MTO)?[\s:#.-]*(\d{3,})$/);
  return m ? `MTO ${m[1]}` : null;
}

export function temPagamento(o) {
  return Number(o.valor_pago) > 0 && ehIso(o.data_pagamento);
}

/**
 * Status que os campos preenchidos indicam. Os status manuais são mantidos, com uma
 * exceção: BLOQUEADO deixa de valer quando o pagamento é registrado.
 */
export function statusCalculado(o) {
  const atual = o.status || 'PREVISTO';
  if (STATUS_MANUAIS.includes(atual) && !(atual === 'BLOQUEADO' && temPagamento(o))) return atual;
  const mto = normalizarMto(o.nr_lancamento_erp);
  if (temPagamento(o)) return mto ? 'PAGO' : 'PAGO_SEM_LANCAMENTO';
  if (mto) return 'LANCADO_ERP';
  if (Number(o.valor_guia) > 0) return 'GUIA_DISPONIVEL';
  return 'PREVISTO';
}

/** @returns {string[]} lista de erros (vazia se a obrigação for válida) */
export function validarObrigacao(o) {
  const erros = [];
  const status = o.status || 'PREVISTO';
  if (!STATUS_OBRIGACAO.includes(status)) erros.push(`Status desconhecido: ${status}`);
  if (status === 'PAGO' || status === 'PAGO_SEM_LANCAMENTO') {
    if (!(Number(o.valor_pago) > 0)) erros.push('valor_pago é obrigatório (e maior que zero) para marcar como pago');
    if (!ehIso(o.data_pagamento)) erros.push('data_pagamento é obrigatória para marcar como pago');
  }
  const temValor = Number(o.valor_pago) > 0, temData = ehIso(o.data_pagamento);
  if (temValor !== temData && status !== 'PAGO' && status !== 'PAGO_SEM_LANCAMENTO') {
    erros.push(temValor ? 'Informe também a data_pagamento (valor e data do pagamento vão juntos)' : 'Informe também o valor_pago (valor e data do pagamento vão juntos)');
  }
  if (status === 'PAGO' && !normalizarMto(o.nr_lancamento_erp)) erros.push('PAGO exige nº de lançamento no ERP (MTO); sem ele, use PAGO_SEM_LANCAMENTO');
  if (status === 'LANCADO_ERP' && !normalizarMto(o.nr_lancamento_erp)) erros.push('LANCADO_ERP exige nº de lançamento no ERP (MTO)');
  if (status === 'BLOQUEADO' && !String(o.bloqueio_motivo || '').trim()) erros.push('BLOQUEADO exige bloqueio_motivo');
  if (o.nr_lancamento_erp && !normalizarMto(o.nr_lancamento_erp)) erros.push(`Nº MTO em formato inválido: ${o.nr_lancamento_erp}`);
  for (const campo of ['valor_estimado', 'valor_guia', 'valor_pago', 'encargos', 'desconto_obtido']) {
    if (o[campo] !== null && o[campo] !== undefined && o[campo] !== '' && Number(o[campo]) < 0) erros.push(`${campo} não pode ser negativo`);
  }
  return erros;
}

export function obrigacaoQuitada(o) {
  return STATUS_QUITADOS.includes(o.status);
}

/**
 * @param {string|null} vencimento ISO
 * @param {string} hoje ISO
 * @param {boolean} quitada
 * @param {number} diasAlerta janela do "vence em breve" (padrão 7)
 * @returns {'EM_DIA'|'VENCE_EM_7_DIAS'|'VENCE_HOJE'|'VENCIDO'|null} null quando quitada ou sem vencimento
 */
export function situacaoPrazo(vencimento, hoje, quitada, diasAlerta = 7) {
  if (quitada || !ehIso(vencimento)) return null;
  const d = diasEntre(hoje, vencimento);
  if (d < 0) return 'VENCIDO';
  if (d === 0) return 'VENCE_HOJE';
  if (d <= diasAlerta) return 'VENCE_EM_7_DIAS';
  return 'EM_DIA';
}

/** Rótulo da parcela: "cota única", "1ª parcela"… */
export function rotuloParcela(parcela) {
  return String(parcela) === 'U' ? 'cota única' : `${parcela}ª parcela`;
}

/** Histórico padrão do lançamento no ERP (prompt §5.13): "IPVA 2027 – 1ª parcela – BEU1D91". */
export function historicoErp(o) {
  const trib = o.tributo === 'LICENCIAMENTO' ? 'Licenciamento' : o.tributo === 'OUTRO' ? (o.descricao_outro || 'Outro') : 'IPVA';
  const meio = o.tributo === 'IPVA' ? ` – ${rotuloParcela(o.parcela)}` : '';
  return `${trib} ${o.exercicio}${meio} – ${o.placa || ''}`.trim();
}

export const FILAS = {
  A_LANCAR_ERP: 'A lançar no ERP',
  PAGO_SEM_LANCAMENTO: 'Pagos sem lançamento',
  VENCIDOS: 'Vencidos',
  BLOQUEADOS: 'Bloqueados',
  SEM_ESTIMATIVA: 'Sem estimativa',
};

/**
 * Situação de prazo e filas de trabalho de uma obrigação.
 * @returns {{situacao_prazo:string|null, filas:string[]}}
 */
export function classificar(o, hoje, diasAlerta = 7) {
  const quitada = obrigacaoQuitada(o);
  const situacao = situacaoPrazo(o.vencimento, hoje, quitada || o.status === 'BLOQUEADO', diasAlerta);
  const filas = [];
  const ativa = !['CANCELADO', 'NAO_APLICA', 'ISENTO'].includes(o.status);
  if (ativa && Number(o.valor_guia) > 0 && !normalizarMto(o.nr_lancamento_erp) && !temPagamento(o)) filas.push('A_LANCAR_ERP');
  if (o.status === 'PAGO_SEM_LANCAMENTO') filas.push('PAGO_SEM_LANCAMENTO');
  if (situacao === 'VENCIDO') filas.push('VENCIDOS');
  if (o.status === 'BLOQUEADO') filas.push('BLOQUEADOS');
  if (ativa && !quitada && (o.valor_estimado === null || o.valor_estimado === undefined || o.valor_estimado === '') && !(Number(o.valor_guia) > 0)) filas.push('SEM_ESTIMATIVA');
  return { situacao_prazo: situacao, filas };
}

/** Valor da camada mais avançada disponível: pago → guia → estimado. */
export function valorAtual(o) {
  if (Number(o.valor_pago) > 0) return { camada: 'PAGO', valor: Number(o.valor_pago) };
  if (Number(o.valor_guia) > 0) return { camada: 'DEVIDO', valor: Number(o.valor_guia) };
  if (o.valor_estimado !== null && o.valor_estimado !== undefined && o.valor_estimado !== '') return { camada: 'ESTIMADO', valor: Number(o.valor_estimado) };
  return { camada: null, valor: null };
}

/** CSV (";", pt-BR) da fila "A lançar no ERP", com os campos que o lançamento precisa. */
export function csvLancamentoErp(obrigacoes) {
  const cab = ['CNPJ', 'Placa', 'Tributo', 'Parcela', 'Vencimento', 'Valor', 'Linha digitável', 'Histórico', 'Obrigação'];
  const br = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
  const num = (v) => (v === null || v === undefined || v === '' ? '' : Number(v).toFixed(2).replace('.', ','));
  const esc = (v) => {
    const s = String(v === null || v === undefined ? '' : v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const linhas = obrigacoes.map((o) => [o.cnpj, o.placa, o.tributo, rotuloParcela(o.parcela), br(o.vencimento), num(o.valor_guia),
    o.linha_digitavel, historicoErp(o), o.obrigacao_id].map(esc).join(';'));
  return [cab.join(';'), ...linhas].join('\n') + '\n';
}
