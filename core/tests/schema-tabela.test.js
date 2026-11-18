import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../schema.js';
import * as T from '../tabela.js';
import * as V from '../veiculos.js';
import { CONFIG_PADRAO } from '../config-padrao.js';

test('esquema: consistente (chaves, enums, fks, controle, snake_case)', () => {
  assert.deepEqual(S.validarEsquema(), []);
});

test('esquema: dados pessoais só na planilha restrita (D-15)', () => {
  const restritas = S.tabelasDaPlanilha('MOTORISTAS').map((t) => t.nome);
  assert.deepEqual(restritas, ['MOTORISTAS', 'DESCONTOS_FOLHA', 'AUDITORIA_RESTRITA']);
  for (const def of S.tabelasDaPlanilha('BASE')) {
    for (const col of def.colunas) assert.ok(!['cpf', 'cnh_numero'].includes(col.nome), `${def.nome}.${col.nome} não pode ficar na base`);
  }
  assert.equal(S.tabelaDeAuditoria('MOTORISTAS'), 'AUDITORIA_RESTRITA');
  assert.equal(S.tabelaDeAuditoria('VEICULOS'), 'AUDITORIA');
});

test('esquema: tabelas exigidas pelo prompt §4 existem', () => {
  for (const n of ['FILIAIS', 'VEICULOS', 'LOCATARIOS', 'LOCACOES', 'MOTORISTAS', 'CALENDARIO_VENCIMENTOS', 'ALIQUOTAS_IPVA',
    'TAXAS_LICENCIAMENTO', 'VALORES_VENAIS', 'OBRIGACOES', 'MULTAS', 'DESCONTOS_FOLHA', 'DOCUMENTOS', 'AUDITORIA',
    'LOG_EXECUCAO', 'CONFIG', 'USUARIOS', 'SNAPSHOT_KPI']) {
    assert.ok(S.tabela(n), n);
  }
  assert.throws(() => S.tabela('NAO_EXISTE'));
});

test('config padrão: chaves únicas e tipos válidos', () => {
  const chaves = CONFIG_PADRAO.map((c) => c[0]);
  assert.equal(new Set(chaves).size, chaves.length);
  for (const [, , tipo] of CONFIG_PADRAO) assert.ok(S.ENUMS.TIPO_CONFIG.includes(tipo), tipo);
  assert.ok(!chaves.some((k) => /KEY|SECRET|TOKEN/.test(k)), 'segredos não ficam na CONFIG');
});

test('tabela: cabeçalho por nome (ordem não importa)', () => {
  const mapa = T.mapearCabecalho(['placa', 'veiculo_id', '', 'renavam']);
  assert.deepEqual(mapa, { placa: 0, veiculo_id: 1, renavam: 3 });
  assert.throws(() => T.mapearCabecalho(['a', 'a']), /repetido/);
  assert.deepEqual(T.planoCabecalho(['veiculo_id', 'placa', 'minha_coluna'], ['veiculo_id', 'renavam', 'placa']),
    { faltando: ['renavam'], extras: ['minha_coluna'] });
});

test('tabela: linha → registro preserva zeros do RENAVAM e normaliza tipos', () => {
  const cab = ['veiculo_id', 'renavam', 'placa', 'tipo', 'cnpj_proprietario', 'ano_modelo', 'isento_ipva'];
  const reg = T.linhaParaRegistro(['V0010', 229498353, 'asx-8d02', 'TOCO', '77505550000197', '2019', 'n'], T.mapearCabecalho(cab), 'VEICULOS');
  assert.equal(reg.renavam, '00229498353');
  assert.equal(reg.placa, 'ASX8D02');
  assert.equal(reg.cnpj_proprietario, '77.505.550/0001-97');
  assert.equal(reg.ano_modelo, 2019);
  assert.equal(reg.isento_ipva, 'N');
  assert.equal(reg.chassi, null, 'coluna ausente na aba vira null');
});

test('tabela: registro → linha respeita a ordem da aba e mantém o que não foi alterado', () => {
  const cab = ['multa_id', 'observacoes', 'doc_ids', 'valor_pago'];
  const linha = T.registroParaLinha({ multa_id: 'M000001', doc_ids: ['a', 'b'], valor_pago: null }, cab, 'MULTAS', ['M000001', 'nota antiga', '', 50]);
  assert.deepEqual(linha, ['M000001', 'nota antiga', 'a, b', '']);
});

test('tabela: validação genérica', () => {
  const ok = { veiculo_id: 'V0001', placa: 'BEU1D91', renavam: '01251100403', tipo: 'CAVALO', uf_registro: 'PR', situacao: 'OPERACAO_PROPRIA', cnpj_proprietario: '77.505.550/0001-97' };
  assert.deepEqual(T.validarRegistro(ok, 'VEICULOS'), []);
  const ruim = { veiculo_id: 'V0002', placa: 'XX', renavam: '00127280801', tipo: 'BI TREM', uf_registro: 'PR', situacao: 'ALUGADA', isento_ipva: 'talvez', data_venda: '31/12/2026' };
  const erros = T.validarRegistro(ruim, 'VEICULOS');
  for (const campo of ['placa', 'renavam', 'tipo', 'situacao', 'isento_ipva', 'data_venda']) {
    assert.ok(erros.some((e) => e.startsWith(campo)), `esperava erro em ${campo}: ${erros.join(' | ')}`);
  }
  assert.ok(T.validarRegistro({}, 'VEICULOS').some((e) => /placa: obrigatório/.test(e)));
  assert.deepEqual(T.validarRegistro({ observacoes: 'x' }, 'VEICULOS', { parcial: true }), []);
  assert.ok(T.validarRegistro({ aliquota_pct: 150 }, 'ALIQUOTAS_IPVA', { parcial: true }).length === 1);
});

test('tabela: chave composta e diff para auditoria', () => {
  assert.equal(T.chaveRegistro({ veiculo_id: 'V0001', exercicio: 2027 }, 'VALORES_VENAIS'), 'V0001|2027');
  assert.equal(T.chaveRegistro({ veiculo_id: 'V0001' }, 'VALORES_VENAIS'), null);
  assert.deepEqual(T.diffRegistros({ a: 1, b: 'x', atualizado_em: '1' }, { a: 1, b: 'y', atualizado_em: '2', c: '' }), { b: { antes: 'x', depois: 'y' } });
});

test('veículos: tipo da planilha antiga', () => {
  assert.deepEqual(V.normalizarTipoVeiculo('BI TREM'), { tipo: 'BITREM', confirmar: false, motivo: 'Grafia "BI TREM" padronizada' });
  assert.equal(V.normalizarTipoVeiculo('CAVALO ').tipo, 'CAVALO');
  const sav = V.normalizarTipoVeiculo('SAVEIRO');
  assert.equal(sav.tipo, 'UTILITARIO');
  assert.equal(sav.confirmar, true);
  assert.equal(V.normalizarTipoVeiculo(new Date(2023, 3, 3)).tipo, null, 'data no lugar do tipo (EAL8193, BEK3H54)');
  assert.equal(V.normalizarTipoVeiculo(null).motivo, 'Tipo vazio');
  assert.equal(V.categoriaDoTipo('CARRETA'), 'IMPLEMENTO');
});

test('veículos: unicidade por RENAVAM e placa equivalente, inclusive vendidos', () => {
  const cadastro = [
    { veiculo_id: 'V0001', placa: 'FTD2429', renavam: '01219574594', situacao: 'VENDIDO' },
    { veiculo_id: 'V0002', placa: 'BEU1D91', renavam: '01251100403', situacao: 'OPERACAO_PROPRIA', cnpj_proprietario: 'x' },
  ];
  const novo = { veiculo_id: 'V0003', placa: 'FTD2E29', renavam: '01219574594', situacao: 'OPERACAO_PROPRIA', cnpj_proprietario: 'x' };
  const r = V.validarVeiculo(novo, cadastro);
  assert.deepEqual(r.erros, []);
  assert.equal(r.avisos.length, 2, 'avisa que equivale a um vendido (reativar?)');
  const dup = V.validarVeiculo({ ...novo, placa: 'BEU1391', renavam: '01251100403' }, cadastro);
  assert.equal(dup.erros.length, 2);
  assert.ok(V.validarVeiculo({ veiculo_id: 'V9', placa: 'ABC1234', situacao: 'OPERACAO_PROPRIA' }).erros.some((e) => /RENAVAM é obrigatório/.test(e)));
  assert.deepEqual(V.validarVeiculo({ veiculo_id: 'V9', placa: 'ABC1234', situacao: 'HISTORICO' }).erros, [], 'histórico dispensa RENAVAM');
  assert.equal(V.completarVeiculo({ placa: 'QJP4B37', tipo: 'CAVALO' }).placa_norm, 'QJP4137');
});
