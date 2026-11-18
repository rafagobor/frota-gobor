import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../datas.js';
import * as M from '../moeda.js';

test('datas: parse pt-BR', () => {
  assert.equal(D.parseDataBR('15/01/2027'), '2027-01-15');
  assert.equal(D.parseDataBR('5/1/27'), '2027-01-05');
  assert.equal(D.parseDataBR('31-12-2026'), '2026-12-31');
  assert.equal(D.parseDataBR('29/02/2027'), null, '2027 não é bissexto');
  assert.equal(D.parseDataBR('29/02/2028'), '2028-02-29');
  assert.equal(D.parseDataBR('32/01/2027'), null);
  assert.equal(D.parseDataBR('2027-01-15'), null);
});

test('datas: parse flexível (ISO, BR, Date)', () => {
  assert.equal(D.parseDataFlex('2027-01-15'), '2027-01-15');
  assert.equal(D.parseDataFlex('2027-01-15T10:30:00Z'), '2027-01-15');
  assert.equal(D.parseDataFlex('03/10/2025 14:22'), '2025-10-03');
  assert.equal(D.parseDataFlex(new Date(2026, 7, 14)), '2026-08-14');
  assert.equal(D.parseDataFlex(''), null);
  assert.equal(D.parseDataFlex('setembro'), null);
});

test('datas: data e hora', () => {
  assert.equal(D.parseDataHora('03/09/2025 08:05'), '2025-09-03 08:05');
  assert.equal(D.parseDataHora('2025-09-03T8:05:00'), '2025-09-03 08:05');
  assert.equal(D.parseDataHora('03/09/2025 25:00'), null);
});

test('datas: aritmética e exibição', () => {
  assert.equal(D.dataBR('2027-01-15'), '15/01/2027');
  assert.equal(D.diasEntre('2026-11-18', '2026-12-15'), 27);
  assert.equal(D.diasEntre('2026-12-15', '2026-11-18'), -27);
  assert.equal(D.diasEntre('2026-12-31', '2027-01-01'), 1);
  assert.equal(D.somarDias('2026-12-30', 3), '2027-01-02');
  assert.equal(D.somarMeses('2027-01-31', 1), '2027-02-28');
  assert.equal(D.somarMeses('2026-11-15', 14), '2028-01-15');
  assert.throws(() => D.diasEntre('2026-02-30', '2026-03-01'));
});

test('datas: mês por extenso (coluna VENCIMENTO de SP)', () => {
  assert.equal(D.mesPorExtenso('setembro'), 9);
  assert.equal(D.mesPorExtenso('Março'), 3);
  assert.equal(D.mesPorExtenso('MARCO'), 3);
  assert.equal(D.mesPorExtenso('dez.'), 12);
  assert.equal(D.mesPorExtenso('xyz'), null);
});

test('datas: competências e dias úteis', () => {
  assert.equal(D.competenciaDe('2026-12-05'), '2026-12');
  assert.equal(D.somarCompetencia('2026-12', 1), '2027-01');
  assert.equal(D.somarCompetencia('2027-01', -2), '2026-11');
  assert.ok(D.ehCompetencia('2027-03'));
  assert.ok(!D.ehCompetencia('2027-13'));
  assert.equal(D.diaDaSemana('2026-11-18'), 3); // quarta-feira
  assert.ok(!D.ehDiaUtil('2026-11-21'));
  assert.equal(D.proximoDiaUtil('2026-11-21'), '2026-11-23');
  assert.equal(D.proximoDiaUtil('2026-12-25', ['2026-12-25']), '2026-12-28');
});

test('moeda: parse pt-BR', () => {
  assert.equal(M.parseMoeda('R$ 130,16'), 130.16);
  assert.equal(M.parseMoeda('R$ 1.234,56'), 1234.56);
  assert.equal(M.parseMoeda('1.234.567,89'), 1234567.89);
  assert.equal(M.parseMoeda('1203,15'), 1203.15);
  assert.equal(M.parseMoeda('1.203'), 1203);
  assert.equal(M.parseMoeda('130.16'), 130.16);
  assert.equal(M.parseMoeda('1.234.567'), 1234567);
  assert.equal(M.parseMoeda('(R$ 10,00)'), -10);
  assert.equal(M.parseMoeda('-R$ 5,50'), -5.5);
  assert.equal(M.parseMoeda('R$ 1.000,00'), 1000);
  assert.equal(M.parseMoeda(130.16), 130.16);
  assert.equal(M.parseMoeda(''), null);
  assert.equal(M.parseMoeda('abc'), null);
  assert.equal(M.parseMoeda('1,2,3'), null);
});

test('moeda: soma em centavos e formatação', () => {
  assert.equal(M.somar([0.1, 0.2]), 0.3);
  assert.equal(M.somar([130.16, null, '', 130.16]), 260.32);
  assert.equal(M.arredondar2(1.005), 1.01);
  assert.equal(M.formatarMoeda(1234.5), 'R$ 1.234,50');
  assert.equal(M.formatarMoeda(-10), '-R$ 10,00');
  assert.equal(M.formatarMoeda(0), 'R$ 0,00');
  assert.equal(M.formatarNumeroBR(1234567.891, 2), '1.234.567,89');
  assert.equal(M.formatarMoeda(null), '');
});
