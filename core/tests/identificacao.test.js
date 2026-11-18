import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../placa.js';
import * as R from '../renavam.js';
import * as F from '../documentos-fiscais.js';

test('placa: formatos antigo e Mercosul', () => {
  assert.equal(P.formatoPlaca('QJM2797'), 'ANTIGO');
  assert.equal(P.formatoPlaca('QJP4B37'), 'MERCOSUL');
  assert.equal(P.formatoPlaca('qjp-4b37'), 'MERCOSUL');
  assert.equal(P.formatoPlaca(' EAL 8193 '), 'ANTIGO');
  assert.equal(P.formatoPlaca('AB1234'), null);
  assert.equal(P.formatoPlaca('ABCD123'), null);
  assert.equal(P.formatoPlaca(null), null);
});

test('placa: equivalência Mercosul (casos reais da planilha de multas)', () => {
  assert.equal(P.normalizarPlaca('CUC6H59'), 'CUC6759');
  assert.equal(P.normalizarPlaca('FTD2E29'), 'FTD2429');
  assert.ok(P.placasEquivalentes('CUC6H59', 'CUC6759'));
  assert.ok(P.placasEquivalentes('ftd-2429', 'FTD2E29'));
  assert.ok(!P.placasEquivalentes('CUC6759', 'CUC6766'));
  assert.ok(!P.placasEquivalentes('XXX', 'XXX'), 'placas inválidas nunca são equivalentes');
});

test('placa: mapeamento completo 0=A ... 9=J e ida e volta', () => {
  'ABCDEFGHIJ'.split('').forEach((letra, i) => {
    assert.equal(P.normalizarPlaca(`ABC1${letra}23`), `ABC1${i}23`);
    assert.equal(P.paraMercosul(`ABC1${i}23`), `ABC1${letra}23`);
  });
  assert.deepEqual(P.formasDaPlaca('QJQ1F48'), ['QJQ1548', 'QJQ1F48']);
});

test('placa: Mercosul nativa com letra K–Z fica como está', () => {
  assert.equal(P.normalizarPlaca('ABC1K23'), 'ABC1K23');
  assert.equal(P.finalDaPlaca('ABC1K23'), '3');
});

test('placa: final e exibição', () => {
  assert.equal(P.finalDaPlaca('BEU1D91'), '1');
  assert.equal(P.finalDaPlaca('RYH4I10'), '0');
  assert.equal(P.formatarPlaca('EAL8193'), 'EAL-8193');
  assert.equal(P.formatarPlaca('rhs1d66'), 'RHS1D66');
});

test('renavam: zeros à esquerda e DV (valores reais da previa 2027)', () => {
  // número como veio do Excel (float), 10 dígitos
  assert.equal(R.normalizarRenavam(1219574594.0), '01219574594');
  assert.ok(R.renavamValido(1219574594));
  // 9 dígitos (série antiga)
  assert.equal(R.normalizarRenavam(229498353), '00229498353');
  assert.ok(R.renavamValido(229498353));
  assert.ok(R.renavamValido('983106606'));
  assert.ok(R.renavamValido('808688731'));
  // texto vindo do Excel com ".0"
  assert.ok(R.renavamValido('1349786915.0'));
  // RDV8D31 / RDV8D51: os dois DVs são válidos (por isso só o CRLV resolve a troca)
  assert.ok(R.renavamValido('01227472029'));
  assert.ok(R.renavamValido('01227474323'));
});

test('renavam: RLI4H26 (127280801) é inválido', () => {
  assert.ok(!R.renavamValido(127280801));
  const a = R.analisarRenavam(127280801);
  assert.equal(a.normalizado, '00127280801');
  assert.equal(a.valido, false);
  assert.match(a.motivo, /verificador/);
});

test('renavam: casos de borda', () => {
  assert.equal(R.normalizarRenavam(''), null);
  assert.equal(R.normalizarRenavam('123456789012'), null);
  assert.ok(!R.renavamValido('00000000000'));
  assert.ok(!R.renavamValido(12.5));
  assert.equal(R.analisarRenavam(null).motivo, 'RENAVAM vazio');
});

test('cnpj: todos os CNPJs da Gobor são válidos', () => {
  for (const c of ['77.505.550/0001-97', '77.505.550/0002-78', '77.505.550/0003-59', '77.505.550/0008-63',
    '77.505.550/0009-44', '77.505.550/0012-40', '77.505.550/0014-01', '77.505.550/0015-92', '39.247.088/0001-86']) {
    assert.ok(F.cnpjValido(c), c);
  }
  assert.ok(F.cnpjValido('77505550000197'));
});

test('cnpj: alfanumérico (exemplo oficial da Receita)', () => {
  assert.ok(F.cnpjValido('12.ABC.345/01DE-35'));
  assert.ok(F.cnpjValido('12abc34501de35'));
  assert.ok(F.cnpjAlfanumerico('12.ABC.345/01DE-35'));
  assert.ok(!F.cnpjValido('12.ABC.345/01DE-36'));
  assert.ok(!F.cnpjValido('12.ABC.345/01DE-3A'), 'DV continua numérico');
});

test('cnpj: inválidos e formatação', () => {
  assert.ok(!F.cnpjValido('77.505.550/0001-98'));
  assert.ok(!F.cnpjValido('11111111111111'));
  assert.ok(!F.cnpjValido('123'));
  assert.equal(F.formatarCnpj('77505550000197'), '77.505.550/0001-97');
  assert.equal(F.formatarCnpj('12abc34501de35'), '12.ABC.345/01DE-35');
});

test('cpf e documento (CNPJ ou CPF)', () => {
  assert.ok(F.cpfValido('529.982.247-25'));
  assert.ok(!F.cpfValido('529.982.247-24'));
  assert.ok(!F.cpfValido('111.111.111-11'));
  assert.equal(F.formatarCpf('52998224725'), '529.982.247-25');
  assert.ok(F.documentoValido('529.982.247-25'));
  assert.ok(F.documentoValido('77.505.550/0001-97'));
  assert.ok(!F.documentoValido('123'));
});
