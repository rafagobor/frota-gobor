import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matrizParaRegistros, prepararImportacao, resumoImportacao } from '../importacao.js';

const FILIAIS = [
  ['﻿cnpj', 'nome_curto', 'razao_social', 'uf', 'municipio', 'ativo', 'observacoes'],
  ['77.505.550/0001-97', 'Matriz', '', 'PR', '', 'S', ''],
  ['77.505.550/0003-59', 'Porto Velho', '', 'RO', '', 'S', ''],
];
const LOCATARIOS = [
  ['locatario_id', 'nome', 'cnpj_cpf', 'ativo', 'ref_painel'],
  ['LT0001', 'MND SERVICOS', '39.247.088/0001-86', 'S', 'mnd'],
];
const VEICULOS = [
  ['veiculo_id', 'renavam', 'placa', 'tipo', 'cnpj_proprietario', 'uf_registro', 'situacao', 'placa_norm', 'coluna_estranha'],
  ['V0001', '01251100403', 'BEU1D91', 'CAVALO', '77.505.550/0001-97', 'PR', 'OPERACAO_PROPRIA', 'XXX', 'x'],
  ['V0002', '00808688731', 'NCK4696', 'TOCO', '77.505.550/0003-59', 'RO', 'LOCADO_TERCEIRO', '', ''],
];
const LOCACOES = [
  ['locacao_id', 'veiculo_id', 'locatario_id', 'inicio', 'fim', 'contrato_ref', 'repassa_multas', 'repassa_licenciamento', 'repassa_ipva'],
  ['LC00001', 'V0002', 'LT0001', '2026-10-01', '', 'Contrato 050/2026', 'S', 'N', 'N'],
];

test('matriz → registros: cabeçalho por nome, BOM, colunas calculadas e desconhecidas', () => {
  const r = matrizParaRegistros('VEICULOS', VEICULOS);
  assert.deepEqual(r.erros, []);
  assert.equal(r.registros.length, 2);
  assert.equal(r.registros[0].placa_norm, undefined, 'calculada é ignorada no arquivo');
  assert.ok(r.avisos.some((a) => /coluna_estranha/.test(a)));
  assert.ok(r.avisos.some((a) => /calculadas ignoradas.*placa_norm/.test(a)));
  assert.equal(matrizParaRegistros('FILIAIS', FILIAIS).registros[0].cnpj, '77.505.550/0001-97');
  assert.ok(matrizParaRegistros('VEICULOS', [['placa'], ['ABC1234']]).erros[0].includes('coluna-chave veiculo_id'));
});

test('lote válido: completa veículos e conta novos/atualizados', () => {
  const a = prepararImportacao({ FILIAIS, LOCATARIOS, VEICULOS, LOCACOES }, { VEICULOS: [{ veiculo_id: 'V0001', placa: 'BEU1D91', renavam: '01251100403', situacao: 'OPERACAO_PROPRIA' }] });
  assert.deepEqual(a.erros, []);
  assert.equal(a.ok, true);
  const v = a.porTabela.VEICULOS.registros.find((x) => x.veiculo_id === 'V0001');
  assert.equal(v.placa_norm, 'BEU1391');
  assert.equal(v.categoria, 'TRACAO');
  assert.equal(a.porTabela.VEICULOS.novos, 1);
  assert.equal(a.porTabela.VEICULOS.atualizados, 1);
  assert.deepEqual(resumoImportacao(a), [
    'FILIAIS: 2 registro(s) · 2 novo(s) · 0 já existente(s)',
    'LOCATARIOS: 1 registro(s) · 1 novo(s) · 0 já existente(s)',
    'VEICULOS: 2 registro(s) · 1 novo(s) · 1 já existente(s)',
    'LOCACOES: 1 registro(s) · 1 novo(s) · 0 já existente(s)',
  ]);
});

test('erros bloqueiam: CNPJ fora de FILIAIS, RENAVAM inválido, chave repetida, FKs e sobreposição', () => {
  const veic = [VEICULOS[0], VEICULOS[1], ['V0001', '00127280801', 'RLI4H26', 'CARRETA', '77.505.550/0015-92', 'PR', 'OPERACAO_PROPRIA']];
  const locs = [LOCACOES[0], LOCACOES[1], ['LC00002', 'V0002', 'LT0009', '2026-10-15', '', '', 'S', 'N', 'N'], ['LC00003', 'V0099', 'LT0001', '2026-01-01', '2026-02-01', '', 'S', 'N', 'N']];
  const a = prepararImportacao({ FILIAIS, LOCATARIOS, VEICULOS: veic, LOCACOES: locs }, { VEICULOS: [{ veiculo_id: 'V0002', placa: 'NCK4696', renavam: '00808688731', situacao: 'LOCADO_TERCEIRO' }] });
  assert.equal(a.ok, false);
  const texto = a.erros.join('\n');
  assert.match(texto, /RENAVAM inválido/);
  assert.match(texto, /não está em FILIAIS/);
  assert.match(texto, /chave repetida no arquivo/);
  assert.match(texto, /locatário LT0009 não existe/);
  assert.match(texto, /veículo V0099 não existe/);
  assert.match(texto, /se sobrepõem/);
});

test('placa equivalente a veículo já ativo na base é erro (Mercosul)', () => {
  const veic = [VEICULOS[0], ['V0005', '01219574594', 'BEU1391', 'CAVALO', '77.505.550/0001-97', 'PR', 'OPERACAO_PROPRIA']];
  const a = prepararImportacao({ FILIAIS, VEICULOS: veic }, { VEICULOS: [{ veiculo_id: 'V0001', placa: 'BEU1D91', renavam: '01251100403', situacao: 'OPERACAO_PROPRIA' }] });
  assert.ok(a.erros.some((e) => /equivale a BEU1D91/.test(e)), a.erros.join('\n'));
});
