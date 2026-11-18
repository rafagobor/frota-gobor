/**
 * Geração das obrigações de um exercício (prompt §5.3 e §5.4).
 *
 * Tudo vem das tabelas de referência (calendário, alíquotas, taxas, valores venais):
 * nada é escrito de memória e nenhum valor é inventado. Sem regra → pendência.
 *
 * Idempotente: rodar de novo não duplica. Completa o que falta, recalcula estimativas e
 * vencimentos das obrigações ainda não pagas e cancela parcelas que deixaram de existir
 * (ex.: mudança de forma de pagamento). Obrigação paga, lançada no ERP ou com guia nunca
 * é alterada.
 */

import { ehIso } from './datas.js';
import { arredondar2, formatarMoeda, formatarNumeroBR, paraCentavos } from './moeda.js';
import { normalizarPlaca } from './placa.js';
import { obrigacaoId } from './ids.js';
import { categoriaDoTipo } from './veiculos.js';

/** Grupo usado no calendário e nas taxas. */
export const GRUPO_POR_TIPO = {
  CAVALO: 'CAMINHAO', TRUCK: 'CAMINHAO', TOCO: 'CAMINHAO',
  CARRETA: 'IMPLEMENTO', BITREM: 'IMPLEMENTO', CARRETINHA: 'IMPLEMENTO',
  AUTOMOVEL: 'AUTOMOVEL', VAN: 'UTILITARIO', UTILITARIO: 'UTILITARIO',
};

/** Observação gravada pelo sistema quando o vencimento vem de calendário projetado (D-10). */
export const OBS_PROVISORIO = 'Vencimento provisório (calendário do ano anterior projetado)';

/** Situações que impedem novas obrigações. */
const SITUACOES_FORA = ['VENDIDO', 'BAIXADO', 'HISTORICO'];

/** Obrigações que a geração não altera. */
export function obrigacaoTravada(o) {
  return ['PAGO', 'PAGO_SEM_LANCAMENTO', 'LANCADO_ERP', 'ISENTO', 'CANCELADO', 'NAO_APLICA', 'BLOQUEADO'].includes(o.status)
    || Number(o.valor_pago) > 0 || Number(o.valor_guia) > 0 || !!o.nr_lancamento_erp;
}

function grupoDe(tipo) {
  return GRUPO_POR_TIPO[tipo] || 'TODOS';
}

/** Linhas do calendário para veículo/tributo, preferindo o grupo e o final exatos. */
export function linhasCalendario(calendario, { exercicio, uf, tributo, tipo, final }) {
  const grupos = [grupoDe(tipo), 'TODOS'];
  for (const g of grupos) {
    for (const f of [final, '*']) {
      const linhas = calendario.filter((c) => Number(c.exercicio) === Number(exercicio) && c.uf === uf && c.tributo === tributo
        && c.grupo_veiculo === g && String(c.final_placa) === String(f));
      if (linhas.length) return linhas;
    }
  }
  return [];
}

/** Regra de alíquota: tipo → categoria → grupo → TODOS. */
export function regraAliquota(aliquotas, { exercicio, uf, tipo }) {
  const chaves = [tipo, categoriaDoTipo(tipo), grupoDe(tipo), 'TODOS'].filter(Boolean);
  for (const k of chaves) {
    const r = aliquotas.find((a) => Number(a.exercicio) === Number(exercicio) && a.uf === uf && String(a.tipo_ou_categoria).toUpperCase() === k);
    if (r) return r;
  }
  return null;
}

export function taxaLicenciamento(taxas, { exercicio, uf, tipo }) {
  for (const g of [grupoDe(tipo), 'TODOS']) {
    const t = taxas.find((x) => Number(x.exercicio) === Number(exercicio) && x.uf === uf && x.grupo_veiculo === g);
    if (t) return t;
  }
  return null;
}

/** Divide um total em n parcelas em centavos; a última absorve a diferença. */
export function dividirEmParcelas(total, n) {
  const c = paraCentavos(total);
  const base = Math.floor(c / n);
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? c - base * (n - 1) : base) / 100);
}

/**
 * Estimativa do IPVA total e da cota única.
 * @returns {{total:number|null, cotaUnica:number|null, texto:string, motivo:string|null}}
 */
export function estimarIpva({ venal, aliquotaPct, descontoPct }) {
  if (!(Number(venal) > 0)) return { total: null, cotaUnica: null, texto: '', motivo: 'SEM_VALOR_VENAL' };
  if (aliquotaPct === null || aliquotaPct === undefined || aliquotaPct === '') return { total: null, cotaUnica: null, texto: '', motivo: 'SEM_ALIQUOTA' };
  const total = arredondar2(Number(venal) * Number(aliquotaPct) / 100);
  const desc = Number(descontoPct) > 0 ? Number(descontoPct) : 0;
  const cotaUnica = arredondar2(total * (1 - desc / 100));
  const texto = `venal ${formatarNumeroBR(venal, 2)} × ${formatarNumeroBR(aliquotaPct, 2)}%` + (desc ? ` − desc. ${formatarNumeroBR(desc, 2)}%` : '');
  return { total, cotaUnica, texto, motivo: null };
}

function locacaoVigente(locacoes, veiculoId, data) {
  if (!ehIso(data)) return null;
  return locacoes.find((l) => l.veiculo_id === veiculoId && ehIso(l.inicio) && l.inicio <= data && (!l.fim || data <= l.fim)) || null;
}

function responsavel(locacoes, v, tributo, vencimento) {
  const l = locacaoVigente(locacoes, v.veiculo_id, vencimento);
  const repassa = l && (tributo === 'IPVA' ? l.repassa_ipva : l.repassa_licenciamento) === 'S';
  return repassa ? { responsavel_pgto: 'LOCATARIO', repasse_status: 'A_COBRAR' } : { responsavel_pgto: 'GOBOR', repasse_status: 'NAO_APLICA' };
}

/**
 * Planeja a geração (não grava nada).
 * @param {object} p
 * @param {number} p.exercicio
 * @param {object[]} p.veiculos
 * @param {{calendario:object[], aliquotas:object[], taxas:object[], venais:object[]}} p.tabelas
 * @param {object[]} [p.locacoes]
 * @param {object[]} [p.existentes] obrigações já gravadas (qualquer exercício)
 * @param {{formaPadrao?:string, tributos?:string[]}} [p.opcoes]
 */
export function planejarExercicio({ exercicio, veiculos, tabelas, locacoes = [], existentes = [], opcoes = {} }) {
  const ex = Number(exercicio);
  const inicioAno = `${ex}-01-01`;
  const tributos = opcoes.tributos || ['IPVA', 'LICENCIAMENTO'];
  const formaPadrao = opcoes.formaPadrao || 'COTA_UNICA';
  const { calendario = [], aliquotas = [], taxas = [], venais = [] } = tabelas;
  const venalDe = new Map(venais.filter((x) => Number(x.exercicio) === ex).map((x) => [x.veiculo_id, x]));
  const existentesDoAno = new Map(existentes.filter((o) => Number(o.exercicio) === ex && tributos.includes(o.tributo)).map((o) => [o.obrigacao_id, o]));

  const plano = { exercicio: ex, novas: [], atualizar: [], encerrar: [], mantidas: 0, naoTributados: 0, foraDoExercicio: 0, pendencias: [] };
  const gerados = new Set();
  const pend = (v, tipo, detalhe, tributo) => plano.pendencias.push({ veiculo_id: v.veiculo_id, placa: v.placa, uf: v.uf_registro, tributo, tipo, detalhe });

  for (const v of veiculos) {
    if (SITUACOES_FORA.includes(v.situacao) && !(v.situacao === 'VENDIDO' && v.data_venda && v.data_venda >= inicioAno)) {
      plano.foraDoExercicio++;
      continue;
    }
    const final = (normalizarPlaca(v.placa) || '').slice(-1);
    const ctx = { exercicio: ex, uf: v.uf_registro, tipo: v.tipo, final };
    const base = { exercicio: ex, veiculo_id: v.veiculo_id, placa: v.placa, uf: v.uf_registro, cnpj: v.cnpj_proprietario, origem: 'GERADO', status: 'PREVISTO' };
    const propostas = [];

    if (tributos.includes('IPVA')) {
      const regra = regraAliquota(aliquotas, ctx);
      if (v.isento_ipva === 'S') {
        propostas.push({ ...base, tributo: 'IPVA', forma: 'ISENTO', parcela: 'U', vencimento: null, status: 'ISENTO', valor_estimado: 0, base_estimativa: `Isento: ${v.motivo_isencao || 'sem motivo informado'}` });
      } else if (!regra) {
        pend(v, 'SEM_ALIQUOTA', `Sem regra de IPVA para ${v.tipo} em ${v.uf_registro} (${ex})`, 'IPVA');
      } else if (regra.tributado === 'N') {
        plano.naoTributados++;
      } else {
        const forma = v.forma_pgto_ipva_padrao || formaPadrao;
        const linhas = linhasCalendario(calendario, { ...ctx, tributo: 'IPVA' });
        const cota = linhas.find((l) => String(l.parcela) === 'U');
        const parcelasCal = linhas.filter((l) => String(l.parcela) !== 'U').sort((a, b) => Number(a.parcela) - Number(b.parcela));
        if (!linhas.length) pend(v, 'SEM_CALENDARIO', `Sem calendário de IPVA para ${v.uf_registro} final ${final} (${ex})`, 'IPVA');
        const venal = venalDe.get(v.veiculo_id);
        const est = estimarIpva({ venal: venal && venal.valor_venal, aliquotaPct: regra.aliquota_pct, descontoPct: cota && cota.desconto_pct });
        if (est.motivo) pend(v, est.motivo, est.motivo === 'SEM_VALOR_VENAL' ? 'Sem valor venal do exercício: estimativa vazia' : `Alíquota não definida para ${v.tipo} em ${v.uf_registro}`, 'IPVA');
        const obsProv = (l) => (l && l.provisorio === 'S' ? OBS_PROVISORIO : null);
        if (forma === 'PARCELADO' && parcelasCal.length) {
          const valores = est.total !== null ? dividirEmParcelas(est.total, parcelasCal.length) : parcelasCal.map(() => null);
          parcelasCal.forEach((l, i) => propostas.push({ ...base, tributo: 'IPVA', forma: 'PARCELADO', parcela: String(l.parcela), vencimento: l.vencimento,
            valor_estimado: valores[i], base_estimativa: est.texto ? `${est.texto} ÷ ${parcelasCal.length}` : null, observacoes: obsProv(l) }));
        } else {
          if (forma === 'PARCELADO') pend(v, 'SEM_PARCELAS', `Calendário sem parcelas para ${v.uf_registro}: gerado como cota única`, 'IPVA');
          propostas.push({ ...base, tributo: 'IPVA', forma: 'COTA_UNICA', parcela: 'U', vencimento: cota ? cota.vencimento : (parcelasCal[0] || {}).vencimento || null,
            valor_estimado: est.cotaUnica, base_estimativa: est.texto || null, observacoes: obsProv(cota || parcelasCal[0]) });
        }
      }
    }

    if (tributos.includes('LICENCIAMENTO')) {
      const linhas = linhasCalendario(calendario, { ...ctx, tributo: 'LICENCIAMENTO' });
      const l = linhas.find((x) => String(x.parcela) === 'U') || linhas[0];
      if (!l) pend(v, 'SEM_CALENDARIO', `Sem calendário de licenciamento para ${v.uf_registro} final ${final} (${ex})`, 'LICENCIAMENTO');
      const taxa = taxaLicenciamento(taxas, ctx);
      if (!taxa) pend(v, 'SEM_TAXA', `Sem taxa de licenciamento para ${v.uf_registro} (${ex})`, 'LICENCIAMENTO');
      propostas.push({ ...base, tributo: 'LICENCIAMENTO', forma: 'COTA_UNICA', parcela: 'U', vencimento: l ? l.vencimento : null,
        valor_estimado: taxa ? Number(taxa.valor) : null, base_estimativa: taxa ? `taxa ${v.uf_registro} ${formatarMoeda(taxa.valor)}` : null,
        crlv_emitido: 'N', observacoes: l && l.provisorio === 'S' ? OBS_PROVISORIO : null });
    }

    for (const pr of propostas) {
      pr.obrigacao_id = obrigacaoId(ex, pr.tributo, v.veiculo_id, pr.parcela);
      const vendaAntes = v.data_venda && pr.vencimento && v.data_venda < pr.vencimento;
      Object.assign(pr, responsavel(locacoes, v, pr.tributo, pr.vencimento || inicioAno));
      if (vendaAntes) { pr.status = 'NAO_APLICA'; pr.observacoes = `Veículo vendido em ${v.data_venda}`; }
      gerados.add(pr.obrigacao_id);
      const atual = existentesDoAno.get(pr.obrigacao_id);
      if (!atual) { plano.novas.push(pr); continue; }
      if (obrigacaoTravada(atual)) { plano.mantidas++; continue; }
      const patch = {};
      for (const campo of ['vencimento', 'valor_estimado', 'base_estimativa', 'forma', 'status', 'observacoes', 'responsavel_pgto', 'repasse_status']) {
        const novo = pr[campo] === undefined ? null : pr[campo];
        const velho = atual[campo] === undefined || atual[campo] === '' ? null : atual[campo];
        // Observação: o sistema só troca a própria marca de "provisório"; nunca apaga texto de alguém.
        if (campo === 'observacoes' && velho !== null && velho !== OBS_PROVISORIO) continue;
        if (novo !== velho) patch[campo] = novo;
      }
      if (Object.keys(patch).length) plano.atualizar.push({ obrigacao_id: pr.obrigacao_id, ...patch });
      else plano.mantidas++;
    }
  }

  // Parcelas que deixaram de existir (forma trocada, veículo vendido/baixado, não tributado).
  for (const [id, o] of existentesDoAno) {
    if (gerados.has(id) || o.origem !== 'GERADO') continue;
    if (obrigacaoTravada(o)) {
      plano.pendencias.push({ veiculo_id: o.veiculo_id, placa: o.placa, uf: o.uf, tributo: o.tributo, tipo: 'CONFLITO', detalhe: `${id} não seria mais gerada, mas já tem guia, lançamento ou pagamento: revisar manualmente` });
      continue;
    }
    plano.encerrar.push({ obrigacao_id: id, status: 'CANCELADO', observacoes: 'Cancelada na regeneração do exercício (forma de pagamento ou cadastro mudou)' });
  }
  plano.totais = totalizar(plano.novas.concat(plano.atualizar.map((u) => ({ ...existentesDoAno.get(u.obrigacao_id), ...u }))), veiculos);
  return plano;
}

/** Totais por mês de vencimento, tributo, UF, filial e tipo (contagem e valor estimado). */
export function totalizar(obrigacoes, veiculos = []) {
  const tipoDe = new Map(veiculos.map((v) => [v.veiculo_id, v.tipo]));
  const soma = {};
  const add = (dim, chave, o) => {
    soma[dim] = soma[dim] || {};
    const s = (soma[dim][chave] = soma[dim][chave] || { quantidade: 0, estimado: 0, semEstimativa: 0 });
    s.quantidade++;
    if (o.valor_estimado === null || o.valor_estimado === undefined || o.valor_estimado === '') s.semEstimativa++;
    else s.estimado = arredondar2(s.estimado + Number(o.valor_estimado));
  };
  for (const o of obrigacoes) {
    if (['CANCELADO', 'NAO_APLICA'].includes(o.status)) continue;
    add('mes', o.vencimento ? o.vencimento.slice(0, 7) : 'sem data', o);
    add('tributo', o.tributo, o);
    add('uf', o.uf || '—', o);
    add('filial', o.cnpj || '—', o);
    add('tipo', tipoDe.get(o.veiculo_id) || '—', o);
  }
  return soma;
}

/** Resumo em texto para a confirmação. */
export function resumoPlano(plano) {
  const porTipo = {};
  for (const p of plano.pendencias) porTipo[p.tipo] = (porTipo[p.tipo] || 0) + 1;
  const trib = plano.totais.tributo || {};
  const l = [
    `Exercício ${plano.exercicio}: ${plano.novas.length} obrigação(ões) nova(s), ${plano.atualizar.length} atualizada(s), ${plano.encerrar.length} cancelada(s), ${plano.mantidas} sem mudança.`,
    ...Object.entries(trib).map(([t, s]) => `${t}: ${s.quantidade} · estimado ${formatarMoeda(s.estimado)}${s.semEstimativa ? ` · ${s.semEstimativa} sem estimativa` : ''}`),
    `Veículos não tributados no IPVA (pela tabela de alíquotas): ${plano.naoTributados}. Fora do exercício (vendidos/baixados): ${plano.foraDoExercicio}.`,
  ];
  if (plano.pendencias.length) l.push('Pendências: ' + Object.entries(porTipo).map(([k, n]) => `${k} ${n}`).join(' · '));
  return l;
}

