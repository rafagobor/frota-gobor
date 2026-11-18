import { test } from 'node:test';
import assert from 'node:assert/strict';
import { previaLote, lerLinhas, normalizarParcela, normalizarTributo } from '../lote.js';
import { classificar, historicoErp, csvLancamentoErp, valorAtual } from '../obrigacoes.js';
import { situacaoDocumental, obrigacoesAposVenda } from '../veiculos.js';

const HOJE = '2027-01-20';
const VEICULOS = [{ veiculo_id: 'V1', placa: 'BEU1D91' }, { veiculo_id: 'V2', placa: 'QJM2797' }];
const o = (id, extra) => ({ obrigacao_id: id, exercicio: 2027, status: 'PREVISTO', cnpj: '77.505.550/0001-97', ...extra });
const OBRIG = [
  o('2027-IPVA-V1-U', { veiculo_id: 'V1', placa: 'BEU1D91', tributo: 'IPVA', parcela: 'U', vencimento: '2027-01-11', valor_estimado: 1880 }),
  o('2027-LICENCIAMENTO-V1-U', { veiculo_id: 'V1', placa: 'BEU1D91', tributo: 'LICENCIAMENTO', parcela: 'U', vencimento: '2027-08-16', valor_estimado: 94.61 }),
  ...['1', '2'].map((p) => o(`2027-IPVA-V2-${p}`, { veiculo_id: 'V2', placa: 'QJM2797', tributo: 'IPVA', parcela: p, vencimento: `2027-0${p}-11` })),
];
const prev = (tipo, texto, obrigacoes = OBRIG) => previaLote({ tipo, texto, exercicio: 2027, obrigacoes, veiculos: VEICULOS, hoje: HOJE });

test('normalizações de tributo e parcela', () => {
  assert.equal(normalizarTributo('lic'), 'LICENCIAMENTO');
  assert.equal(normalizarTributo('IPVA 2027'), 'IPVA');
  assert.equal(normalizarTributo('multa'), null);
  assert.equal(normalizarParcela('Cota Única'), 'U');
  assert.equal(normalizarParcela('1ª'), '1');
  assert.equal(normalizarParcela('6'), null);
});

test('lerLinhas: tabulação (Excel), ";" e cabeçalho em qualquer ordem', () => {
  assert.deepEqual(lerLinhas('BEU1D91\tIPVA\tU\t1.880,00\t11/01/2027', 'GUIA')[0],
    { linha: 1, placa: 'BEU1D91', tributo: 'IPVA', parcela: 'U', valor: '1.880,00', vencimento: '11/01/2027', linha_digitavel: '' });
  const r = lerLinhas('valor;placa;tributo;parcela\n1880,00;BEU1D91;IPVA;U', 'GUIA');
  assert.equal(r.length, 1);
  assert.equal(r[0].placa, 'BEU1D91');
  assert.equal(r[0].valor, '1880,00');
});

test('lote de guias: valor, vencimento, status e alertas', () => {
  const p = prev('GUIA', 'BEU1D91;IPVA;U;R$ 1.950,00;12/01/2027;8569 0000\nbeu-1391;lic;;100,00\nXXX9999;IPVA;U;10\nQJM2797;IPVA;3;10');
  assert.equal(p.validos, 2);
  assert.equal(p.comErro, 2);
  const [a, b, c, d] = p.itens;
  assert.deepEqual(a.patch, { valor_guia: 1950, vencimento: '2027-01-12', linha_digitavel: '8569 0000', status: 'GUIA_DISPONIVEL' });
  assert.equal(b.obrigacao_id, '2027-LICENCIAMENTO-V1-U', 'placa Mercosul equivalente e parcela única deduzida');
  assert.match(c.erro, /não cadastrada/);
  assert.match(d.erro, /existentes: 1, 2/);
});

test('lote de MTO e de pagamentos', () => {
  const comGuia = OBRIG.map((x) => (x.obrigacao_id === '2027-IPVA-V1-U' ? { ...x, valor_guia: 1880 } : x));
  const m = prev('MTO', 'BEU1D91\tIPVA\tU\tmto 421779', comGuia).itens[0];
  assert.deepEqual(m.patch, { nr_lancamento_erp: 'MTO 421779', data_lancamento_erp: HOJE, status: 'LANCADO_ERP' });
  const pg = prev('PAGAMENTO', 'BEU1D91;IPVA;U;1.900,00;15/01/2027;MTO 421779', comGuia).itens[0];
  assert.equal(pg.patch.status, 'PAGO');
  assert.equal(pg.patch.encargos, 20, 'pago acima da guia = encargos');
  const sem = prev('PAGAMENTO', 'BEU1D91;IPVA;U;1.880,00;15/01/2027', comGuia).itens[0];
  assert.equal(sem.patch.status, 'PAGO_SEM_LANCAMENTO');
  assert.match(sem.aviso, /Pagos sem lançamento/);
  assert.match(prev('PAGAMENTO', 'BEU1D91;IPVA;U;1.880,00;15/02/2027').itens[0].erro, /futuro/);
  assert.match(prev('PAGAMENTO', 'BEU1D91;IPVA;U;;15/01/2027').itens[0].erro, /Valor pago inválido/);
  const paga = comGuia.map((x) => (x.obrigacao_id === '2027-IPVA-V1-U' ? { ...x, status: 'PAGO', valor_pago: 1880, data_pagamento: '2027-01-10', nr_lancamento_erp: 'MTO 1' } : x));
  assert.match(prev('GUIA', 'BEU1D91;IPVA;U;1.880,00', paga).itens[0].erro, /já está PAGO/);
  assert.match(prev('GUIA', 'BEU1D91;IPVA;U;1;\nBEU1D91;IPVA;U;2').itens[1].erro, /repetida/);
});

test('filas, histórico, CSV do ERP e camada de valor', () => {
  assert.deepEqual(classificar(OBRIG[0], HOJE), { situacao_prazo: 'VENCIDO', filas: ['VENCIDOS'] });
  assert.deepEqual(classificar({ ...OBRIG[0], valor_guia: 1880, vencimento: '2027-01-25' }, HOJE).filas, ['A_LANCAR_ERP']);
  assert.deepEqual(classificar({ ...OBRIG[0], status: 'PAGO_SEM_LANCAMENTO', valor_pago: 1, data_pagamento: '2027-01-10' }, HOJE).filas, ['PAGO_SEM_LANCAMENTO']);
  assert.deepEqual(classificar(OBRIG[2], HOJE).filas, ['VENCIDOS', 'SEM_ESTIMATIVA']);
  assert.equal(historicoErp(OBRIG[0]), 'IPVA 2027 – cota única – BEU1D91');
  assert.equal(historicoErp(OBRIG[2]), 'IPVA 2027 – 1ª parcela – QJM2797');
  assert.equal(historicoErp(OBRIG[1]), 'Licenciamento 2027 – BEU1D91');
  const csv = csvLancamentoErp([{ ...OBRIG[0], valor_guia: 1880.5, linha_digitavel: '8569;0' }]);
  assert.equal(csv.split('\n')[1], '77.505.550/0001-97;BEU1D91;IPVA;cota única;11/01/2027;1880,50;"8569;0";IPVA 2027 – cota única – BEU1D91;2027-IPVA-V1-U');
  assert.deepEqual(valorAtual({ valor_estimado: 10, valor_guia: 12 }), { camada: 'DEVIDO', valor: 12 });
});

test('situação documental e obrigações após a venda', () => {
  assert.deepEqual(situacaoDocumental(OBRIG.filter((x) => x.veiculo_id === 'V1'), 2027, HOJE), { ipva: 'VENCIDO', licenciamento: 'EM_DIA' });
  const quitado = [{ ...OBRIG[0], status: 'PAGO' }, { ...OBRIG[1], status: 'PAGO', crlv_emitido: 'S' }];
  assert.deepEqual(situacaoDocumental(quitado, 2027, HOJE), { ipva: 'QUITADO', licenciamento: 'LICENCIADO' });
  assert.deepEqual(situacaoDocumental([], 2027, HOJE), { ipva: 'NAO_GERADO', licenciamento: 'NAO_GERADO' });
  assert.deepEqual(obrigacoesAposVenda(OBRIG, '2027-03-01').map((x) => x.obrigacao_id), ['2027-LICENCIAMENTO-V1-U']);
});
