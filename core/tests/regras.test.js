import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as O from '../obrigacoes.js';
import * as L from '../locacao.js';
import * as MU from '../multas.js';
import * as I from '../ids.js';

test('obrigações: status calculado a partir dos campos', () => {
  assert.equal(O.statusCalculado({}), 'PREVISTO');
  assert.equal(O.statusCalculado({ valor_guia: 1500 }), 'GUIA_DISPONIVEL');
  assert.equal(O.statusCalculado({ valor_guia: 1500, nr_lancamento_erp: 'MTO 421779' }), 'LANCADO_ERP');
  assert.equal(O.statusCalculado({ nr_lancamento_erp: 'MTO 421779', valor_pago: 1500, data_pagamento: '2027-01-12' }), 'PAGO');
  assert.equal(O.statusCalculado({ valor_pago: 1500, data_pagamento: '2027-01-12' }), 'PAGO_SEM_LANCAMENTO');
  assert.equal(O.statusCalculado({ valor_pago: 1500 }), 'PREVISTO', 'sem data não conta como pago');
  assert.equal(O.statusCalculado({ status: 'ISENTO', valor_guia: 10 }), 'ISENTO');
  assert.equal(O.statusCalculado({ status: 'BLOQUEADO', bloqueio_motivo: 'multas' }), 'BLOQUEADO');
  assert.equal(O.statusCalculado({ status: 'BLOQUEADO', valor_pago: 90, data_pagamento: '2027-03-01' }), 'PAGO_SEM_LANCAMENTO');
});

test('obrigações: valor e data obrigatórios para pago', () => {
  assert.deepEqual(O.validarObrigacao({ status: 'PREVISTO' }), []);
  const e = O.validarObrigacao({ status: 'PAGO', nr_lancamento_erp: 'MTO 1234' });
  assert.ok(e.some((x) => /valor_pago/.test(x)));
  assert.ok(e.some((x) => /data_pagamento/.test(x)));
  assert.ok(O.validarObrigacao({ status: 'PAGO', valor_pago: 10, data_pagamento: '2027-01-10' }).some((x) => /MTO/.test(x)));
  assert.deepEqual(O.validarObrigacao({ status: 'PAGO_SEM_LANCAMENTO', valor_pago: 10, data_pagamento: '2027-01-10' }), []);
  assert.ok(O.validarObrigacao({ status: 'BLOQUEADO' }).some((x) => /bloqueio_motivo/.test(x)));
  assert.ok(O.validarObrigacao({ status: 'PREVISTO', valor_guia: -1 }).some((x) => /negativo/.test(x)));
});

test('obrigações: transições', () => {
  assert.ok(O.transicaoPermitida('PREVISTO', 'GUIA_DISPONIVEL'));
  assert.ok(O.transicaoPermitida('PAGO_SEM_LANCAMENTO', 'PAGO'));
  assert.ok(!O.transicaoPermitida('PAGO', 'PREVISTO'));
  assert.ok(!O.transicaoPermitida('LANCADO_ERP', 'PREVISTO'));
  assert.ok(O.transicaoPermitida('CANCELADO', 'PREVISTO'));
});

test('obrigações: nº MTO', () => {
  assert.equal(O.normalizarMto('MTO 413372'), 'MTO 413372');
  assert.equal(O.normalizarMto('mto413372'), 'MTO 413372');
  assert.equal(O.normalizarMto('MTO-413372'), 'MTO 413372');
  assert.equal(O.normalizarMto('413372'), 'MTO 413372');
  assert.equal(O.normalizarMto('pago 01/10'), null);
  assert.equal(O.normalizarMto(''), null);
});

test('obrigações: situação de prazo (sempre calculada)', () => {
  const hoje = '2026-12-10';
  assert.equal(O.situacaoPrazo('2026-12-09', hoje, false), 'VENCIDO');
  assert.equal(O.situacaoPrazo('2026-12-10', hoje, false), 'VENCE_HOJE');
  assert.equal(O.situacaoPrazo('2026-12-17', hoje, false), 'VENCE_EM_7_DIAS');
  assert.equal(O.situacaoPrazo('2026-12-18', hoje, false), 'EM_DIA');
  assert.equal(O.situacaoPrazo('2026-12-01', hoje, true), null);
  assert.equal(O.situacaoPrazo(null, hoje, false), null);
});

const LOCACOES = [
  { locacao_id: 'LC00001', veiculo_id: 'V0150', locatario_id: 'LT0001', inicio: '2025-06-01', fim: '2025-12-31' },
  { locacao_id: 'LC00002', veiculo_id: 'V0150', locatario_id: 'LT0002', inicio: '2026-02-01', fim: null, repassa_multas: 'S' },
  { locacao_id: 'LC00003', veiculo_id: 'V0160', locatario_id: 'LT0001', inicio: '2026-01-01', fim: null, repassa_multas: 'N' },
];

test('locação: responsável pela data da infração, não pela situação atual', () => {
  assert.equal(L.responsavelNaData(LOCACOES, 'V0150', '2025-09-03').locatario_id, 'LT0001');
  assert.equal(L.responsavelNaData(LOCACOES, 'V0150', '2025-12-31').locatario_id, 'LT0001', 'fim é inclusivo');
  assert.equal(L.responsavelNaData(LOCACOES, 'V0150', '2026-01-15').responsavel, 'OPERACAO_PROPRIA', 'entre locações');
  assert.equal(L.responsavelNaData(LOCACOES, 'V0150', '2026-11-18').locatario_id, 'LT0002', 'locação vigente sem fim');
  assert.equal(L.responsavelNaData(LOCACOES, 'V0999', '2026-11-18').responsavel, 'OPERACAO_PROPRIA');
  const r = L.responsavelNaData(LOCACOES, 'V0160', '2026-03-01');
  assert.equal(r.responsavel, 'LOCATARIO');
  assert.equal(r.repassa_multas, false);
});

test('locação: sobreposição é erro de cadastro', () => {
  const sobrepostas = [...LOCACOES, { locacao_id: 'LC00004', veiculo_id: 'V0150', locatario_id: 'LT0003', inicio: '2026-10-01', fim: null }];
  assert.throws(() => L.locacaoNaData(sobrepostas, 'V0150', '2026-11-01'), /sobrepostas/);
  assert.ok(L.validarLocacoes(sobrepostas).some((e) => /se sobrepõem/.test(e)));
  assert.deepEqual(L.validarLocacoes(LOCACOES), []);
  assert.ok(L.validarLocacoes([{ locacao_id: 'X', veiculo_id: 'V1', inicio: '2026-05-01', fim: '2026-04-01' }]).some((e) => /fim antes/.test(e)));
});

test('multas: AIT, órgão e chave de deduplicação', () => {
  assert.equal(MU.normalizarAit('1C 4260909'), '1C4260909');
  assert.equal(MU.normalizarAit('j-003.821.681'), 'J003821681');
  assert.equal(MU.normalizarOrgao('der sp'), 'DER-SP');
  assert.equal(MU.chaveMulta(' prf', 'J003821681'), 'PRF|J003821681');
  assert.equal(MU.chaveMulta('PRF', ''), null);
  assert.ok(MU.ehNic('500-2'));
  assert.ok(!MU.ehNic('745-5'));
});

test('multas: NA cria; NP do mesmo AIT atualiza (não duplica)', () => {
  const na = {
    orgao_sigla: 'PRF', nr_ait: 'J003821681', fase: 'AUTUACAO', placa_documento: 'FFK8022',
    data_hora_infracao: '2025-09-03 10:15', cod_infracao: '745-5', valor_original: 130.16,
    prazo_indicacao_condutor: '2025-10-20', data_expedicao: '2025-09-10',
  };
  const r1 = MU.mesclarNotificacao(null, na, 'doc-na');
  assert.equal(r1.acao, 'CRIAR');
  assert.deepEqual(r1.registro.doc_ids, ['doc-na']);

  const np = {
    orgao_sigla: 'PRF', nr_ait: 'J003821681', fase: 'PENALIDADE', placa_documento: 'FFK-8022',
    data_hora_infracao: '2025-09-03 10:15', cod_infracao: '7455', valor_original: 130.16,
    valor_com_desconto: 104.13, vencimento_pgto: '2026-01-15', data_expedicao: '2025-12-01',
    prazo_indicacao_condutor: '2099-01-01',
  };
  const r2 = MU.mesclarNotificacao(r1.registro, np, 'doc-np');
  assert.equal(r2.acao, 'ATUALIZAR');
  assert.equal(r2.registro.fase, 'PENALIDADE');
  assert.equal(r2.registro.valor_com_desconto, 104.13);
  assert.equal(r2.registro.vencimento_pgto, '2026-01-15');
  assert.equal(r2.registro.data_expedicao, '2025-09-10', 'expedição da autuação é preservada');
  assert.equal(r2.registro.data_expedicao_penalidade, '2025-12-01');
  assert.equal(r2.registro.prazo_indicacao_condutor, '2025-10-20', 'campo já preenchido não é sobrescrito');
  assert.deepEqual(r2.registro.doc_ids, ['doc-na', 'doc-np']);

  assert.equal(MU.mesclarNotificacao(r2.registro, np, 'doc-np').acao, 'DUPLICADO', 'mesmo arquivo de novo');

  // NA chegando depois da NP não rebaixa a fase
  const r3 = MU.mesclarNotificacao(r2.registro, { ...na, valor_original: 999 }, 'doc-na-copia');
  assert.equal(r3.registro.fase, 'PENALIDADE');
  assert.equal(r3.registro.valor_original, 130.16);
});

test('multas: divergência de identidade vai para revisão', () => {
  const base = { orgao_sigla: 'PRF', nr_ait: 'X1', fase: 'AUTUACAO', placa_documento: 'CUC6759', data_hora_infracao: '2025-09-03 10:00', cod_infracao: '745-5', doc_ids: ['a'] };
  assert.equal(MU.mesclarNotificacao(base, { fase: 'PENALIDADE', placa_documento: 'CUC6H59' }, 'b').acao, 'ATUALIZAR', 'equivalência Mercosul não é conflito');
  const r = MU.mesclarNotificacao(base, { fase: 'PENALIDADE', placa_documento: 'ABC1234' }, 'c');
  assert.equal(r.acao, 'CONFLITO');
  assert.match(r.conflitos[0], /placa_documento/);
  assert.equal(MU.mesclarNotificacao(base, { fase: 'NIC' }, 'd').acao, 'CONFLITO');
});

test('multas: sinalizações', () => {
  assert.deepEqual(MU.flagsMulta({ gravidade: 'GRAVISSIMA', fator_multiplicador: 3, data_hora_infracao: '2025-09-01 10:00', data_expedicao: '2025-10-15' }),
    ['GRAVISSIMA', 'FATOR_MULTIPLICADOR', 'EXPEDICAO_FORA_PRAZO']);
  assert.deepEqual(MU.flagsMulta({ data_hora_infracao: '2025-09-01 10:00', data_expedicao: '2025-10-01' }), [], '30 dias ainda está no prazo');
  const hist = [
    { multa_id: 'M1', placa_norm: 'FFK8022', locatario_id: 'LT1', data_hora_infracao: '2025-09-03 10:00' },
    { multa_id: 'M2', placa_norm: 'FFD6062', motorista_id: 'MT9', data_hora_infracao: '2025-07-01 10:00' },
  ];
  assert.deepEqual(MU.flagsReincidencia({ multa_id: 'M3', placa_norm: 'FFK8022', locatario_id: 'LT1', data_hora_infracao: '2025-09-18 10:00' }, hist).sort(),
    ['REINCIDENCIA_LOCATARIO', 'REINCIDENCIA_PLACA']);
  assert.deepEqual(MU.flagsReincidencia({ multa_id: 'M4', motorista_id: 'MT9', data_hora_infracao: '2025-09-18 10:00' }, hist), []);
});

test('ids estáveis', () => {
  assert.equal(I.proximoId('V', ['V0001', 'V0212', 'X9999', null]), 'V0213');
  assert.equal(I.proximoId('V', []), 'V0001');
  assert.equal(I.proximoId('M', ['M000041'], 6), 'M000042');
  assert.equal(I.obrigacaoId(2027, 'IPVA', 'V0001', 'U'), '2027-IPVA-V0001-U');
});
