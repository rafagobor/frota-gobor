import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planejarExercicio, dividirEmParcelas, estimarIpva, linhasCalendario, regraAliquota, resumoPlano } from '../exercicio.js';

const EX = 2027;
const cal = (uf, tributo, grupo, final, parcela, vencimento, extra = {}) => ({ exercicio: EX, uf, tributo, grupo_veiculo: grupo, final_placa: final, parcela, vencimento, ...extra });
const CALENDARIO = [
  cal('PR', 'IPVA', 'TODOS', '1', 'U', '2027-01-11', { desconto_pct: 6, provisorio: 'S' }),
  ...['1', '2', '3', '4', '5'].map((p, i) => cal('PR', 'IPVA', 'TODOS', '1', p, `2027-0${i + 1}-11`, { provisorio: 'S' })),
  cal('PR', 'IPVA', 'TODOS', '0', 'U', '2027-01-15', { desconto_pct: 6 }),
  cal('PR', 'LICENCIAMENTO', 'TODOS', '1', 'U', '2027-08-16'),
  cal('PR', 'LICENCIAMENTO', 'TODOS', '*', 'U', '2027-11-29'),
  cal('SC', 'LICENCIAMENTO', 'TODOS', '*', 'U', '2027-06-30'),
];
const ALIQUOTAS = [
  { exercicio: EX, uf: 'PR', tipo_ou_categoria: 'CAVALO', tributado: 'S', aliquota_pct: 1 },
  { exercicio: EX, uf: 'PR', tipo_ou_categoria: 'AUTOMOVEL', tributado: 'S', aliquota_pct: 1.9 },
  { exercicio: EX, uf: 'PR', tipo_ou_categoria: 'IMPLEMENTO', tributado: 'N' },
  { exercicio: EX, uf: 'SC', tipo_ou_categoria: 'CAMINHAO', tributado: 'S', aliquota_pct: 1 },
];
const TAXAS = [{ exercicio: EX, uf: 'PR', grupo_veiculo: 'TODOS', valor: 94.61 }, { exercicio: EX, uf: 'SC', grupo_veiculo: 'TODOS', valor: 149.37 }];
const VENAIS = [{ veiculo_id: 'V1', exercicio: EX, valor_venal: 200000, origem: 'MANUAL' }];
const v = (id, placa, tipo, uf, extra = {}) => ({ veiculo_id: id, placa, tipo, uf_registro: uf, cnpj_proprietario: '77.505.550/0001-97', situacao: 'OPERACAO_PROPRIA', ...extra });
const VEICULOS = [
  v('V1', 'BEU1D91', 'CAVALO', 'PR'),
  v('V2', 'UBP6C81', 'CARRETA', 'PR'),
  v('V3', 'RHD0D40', 'AUTOMOVEL', 'PR'),
  v('V4', 'AQH1861', 'CAVALO', 'PR', { situacao: 'VENDIDO', data_venda: '2026-10-01' }),
  v('V5', 'QJM2797', 'CAVALO', 'SC'),
  v('V6', 'AXS9771', 'AUTOMOVEL', 'PR', { isento_ipva: 'S', motivo_isencao: 'mais de 20 anos' }),
];
const tabelas = { calendario: CALENDARIO, aliquotas: ALIQUOTAS, taxas: TAXAS, venais: VENAIS };

function aplicar(existentes, plano) {
  const m = new Map(existentes.map((o) => [o.obrigacao_id, { ...o }]));
  for (const o of plano.novas) m.set(o.obrigacao_id, { ...o });
  for (const u of [...plano.atualizar, ...plano.encerrar]) m.set(u.obrigacao_id, { ...m.get(u.obrigacao_id), ...u });
  return [...m.values()];
}

test('auxiliares: parcelas, estimativa, calendário e alíquota', () => {
  assert.deepEqual(dividirEmParcelas(100, 3), [33.33, 33.33, 33.34]);
  assert.deepEqual(estimarIpva({ venal: 200000, aliquotaPct: 1, descontoPct: 6 }), { total: 2000, cotaUnica: 1880, texto: 'venal 200.000,00 × 1,00% − desc. 6,00%', motivo: null });
  assert.equal(estimarIpva({ venal: null, aliquotaPct: 1 }).motivo, 'SEM_VALOR_VENAL');
  assert.equal(estimarIpva({ venal: 1000, aliquotaPct: null }).motivo, 'SEM_ALIQUOTA');
  assert.equal(linhasCalendario(CALENDARIO, { exercicio: EX, uf: 'PR', tributo: 'LICENCIAMENTO', tipo: 'CARRETA', final: '7' })[0].vencimento, '2027-11-29', 'cai no final "*"');
  assert.equal(regraAliquota(ALIQUOTAS, { exercicio: EX, uf: 'PR', tipo: 'BITREM' }).tributado, 'N', 'pela categoria IMPLEMENTO');
  assert.equal(regraAliquota(ALIQUOTAS, { exercicio: EX, uf: 'SC', tipo: 'TRUCK' }).aliquota_pct, 1, 'pelo grupo CAMINHAO');
  assert.equal(regraAliquota(ALIQUOTAS, { exercicio: EX, uf: 'GO', tipo: 'CAVALO' }), null);
});

test('primeira geração: obrigações, estimativas e pendências', () => {
  const p = planejarExercicio({ exercicio: EX, veiculos: VEICULOS, tabelas });
  const por = Object.fromEntries(p.novas.map((o) => [o.obrigacao_id, o]));
  const u = por['2027-IPVA-V1-U'];
  assert.equal(u.vencimento, '2027-01-11');
  assert.equal(u.valor_estimado, 1880);
  assert.equal(u.base_estimativa, 'venal 200.000,00 × 1,00% − desc. 6,00%');
  assert.match(u.observacoes, /provisório/);
  assert.equal(por['2027-LICENCIAMENTO-V1-U'].valor_estimado, 94.61);
  assert.equal(por['2027-LICENCIAMENTO-V1-U'].vencimento, '2027-08-16');
  assert.ok(!por['2027-IPVA-V2-U'], 'carreta não tributada');
  assert.ok(por['2027-LICENCIAMENTO-V2-U'], 'mas licencia');
  assert.equal(por['2027-IPVA-V3-U'].valor_estimado, null, 'sem valor venal, sem estimativa');
  assert.ok(!Object.keys(por).some((k) => k.includes('-V4-')), 'vendido antes do exercício');
  assert.equal(por['2027-IPVA-V5-U'].vencimento, null);
  assert.equal(por['2027-IPVA-V6-U'].status, 'ISENTO');
  assert.equal(p.naoTributados, 1);
  assert.equal(p.foraDoExercicio, 1);
  const tipos = p.pendencias.map((x) => `${x.placa}:${x.tributo}:${x.tipo}`).sort();
  assert.deepEqual(tipos, ['QJM2797:IPVA:SEM_CALENDARIO', 'QJM2797:IPVA:SEM_VALOR_VENAL', 'RHD0D40:IPVA:SEM_VALOR_VENAL']);
  assert.equal(p.totais.tributo.LICENCIAMENTO.quantidade, 5);
  assert.equal(p.totais.tributo.LICENCIAMENTO.estimado, 94.61 * 4 + 149.37);
  assert.match(resumoPlano(p)[0], /Exercício 2027: 9 obrigação/);
});

test('idempotente: gerar de novo não muda nada', () => {
  const p1 = planejarExercicio({ exercicio: EX, veiculos: VEICULOS, tabelas });
  const base = aplicar([], p1);
  const p2 = planejarExercicio({ exercicio: EX, veiculos: VEICULOS, tabelas, existentes: base });
  assert.equal(p2.novas.length, 0);
  assert.equal(p2.atualizar.length, 0);
  assert.equal(p2.encerrar.length, 0);
  assert.equal(p2.mantidas, base.length);
});

test('calendário oficial substitui o provisório nas obrigações não pagas', () => {
  const base = aplicar([], planejarExercicio({ exercicio: EX, veiculos: VEICULOS, tabelas }));
  const oficial = CALENDARIO.map((c) => (c.uf === 'PR' && c.tributo === 'IPVA' && c.final_placa === '1' && c.parcela === 'U' ? { ...c, vencimento: '2027-01-12', provisorio: 'N' } : c));
  const p = planejarExercicio({ exercicio: EX, veiculos: VEICULOS, tabelas: { ...tabelas, calendario: oficial }, existentes: base });
  const up = p.atualizar.find((u) => u.obrigacao_id === '2027-IPVA-V1-U');
  assert.equal(up.vencimento, '2027-01-12');
  assert.equal(up.observacoes, null, 'sai a marca de provisório');
  // observação escrita por alguém é preservada
  const comNota = base.map((o) => (o.obrigacao_id === '2027-IPVA-V1-U' ? { ...o, observacoes: 'combinado com o financeiro' } : o));
  const p2 = planejarExercicio({ exercicio: EX, veiculos: VEICULOS, tabelas: { ...tabelas, calendario: oficial }, existentes: comNota });
  assert.equal(p2.atualizar.find((u) => u.obrigacao_id === '2027-IPVA-V1-U').observacoes, undefined);
});

test('troca para parcelado regenera parcelas e cancela a cota única não paga', () => {
  const base = aplicar([], planejarExercicio({ exercicio: EX, veiculos: VEICULOS, tabelas }));
  const veic = VEICULOS.map((x) => (x.veiculo_id === 'V1' ? { ...x, forma_pgto_ipva_padrao: 'PARCELADO' } : x));
  const p = planejarExercicio({ exercicio: EX, veiculos: veic, tabelas, existentes: base });
  const parcelas = p.novas.filter((o) => o.veiculo_id === 'V1' && o.tributo === 'IPVA');
  assert.deepEqual(parcelas.map((o) => o.parcela), ['1', '2', '3', '4', '5']);
  assert.equal(parcelas.reduce((s, o) => s + o.valor_estimado, 0), 2000, 'parcelado sem desconto');
  assert.deepEqual(p.encerrar.map((e) => e.obrigacao_id), ['2027-IPVA-V1-U']);
});

test('obrigação paga nunca é alterada; troca de forma vira conflito', () => {
  const base = aplicar([], planejarExercicio({ exercicio: EX, veiculos: VEICULOS, tabelas }))
    .map((o) => (o.obrigacao_id === '2027-IPVA-V1-U' ? { ...o, status: 'PAGO', valor_pago: 1880, data_pagamento: '2027-01-10', nr_lancamento_erp: 'MTO 1' } : o));
  const veic = VEICULOS.map((x) => (x.veiculo_id === 'V1' ? { ...x, forma_pgto_ipva_padrao: 'PARCELADO' } : x));
  const p = planejarExercicio({ exercicio: EX, veiculos: veic, tabelas: { ...tabelas, venais: [] }, existentes: base });
  assert.ok(!p.encerrar.some((e) => e.obrigacao_id === '2027-IPVA-V1-U'));
  assert.ok(!p.atualizar.some((e) => e.obrigacao_id === '2027-IPVA-V1-U'));
  assert.ok(p.pendencias.some((x) => x.tipo === 'CONFLITO' && /2027-IPVA-V1-U/.test(x.detalhe)));
});

test('vendido durante o exercício e repasse ao locatário', () => {
  const veic = [v('V1', 'BEU1D91', 'CAVALO', 'PR', { situacao: 'VENDIDO', data_venda: '2027-03-01' })];
  const locacoes = [{ veiculo_id: 'V1', inicio: '2026-01-01', fim: null, repassa_licenciamento: 'S', repassa_ipva: 'N' }];
  const p = planejarExercicio({ exercicio: EX, veiculos: veic, tabelas, locacoes });
  const por = Object.fromEntries(p.novas.map((o) => [o.obrigacao_id, o]));
  assert.equal(por['2027-IPVA-V1-U'].status, 'PREVISTO', 'IPVA de janeiro: ainda era da Gobor');
  assert.equal(por['2027-IPVA-V1-U'].responsavel_pgto, 'GOBOR');
  assert.equal(por['2027-LICENCIAMENTO-V1-U'].status, 'NAO_APLICA', 'licenciamento de agosto: já vendido');
  const p2 = planejarExercicio({ exercicio: EX, veiculos: [v('V9', 'BEU1D91', 'CAVALO', 'PR')], tabelas, locacoes: [{ ...locacoes[0], veiculo_id: 'V9' }] });
  const lic = p2.novas.find((o) => o.tributo === 'LICENCIAMENTO');
  assert.deepEqual([lic.responsavel_pgto, lic.repasse_status], ['LOCATARIO', 'A_COBRAR']);
});
