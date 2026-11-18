/**
 * Ponto de entrada do núcleo. O esbuild empacota este arquivo num IIFE que expõe o objeto
 * global `Core` no Apps Script (apps-script/server/00_core.js). Em Node, os módulos são
 * importados diretamente pelos testes.
 */

export * as placa from './placa.js';
export * as renavam from './renavam.js';
export * as fiscal from './documentos-fiscais.js';
export * as datas from './datas.js';
export * as moeda from './moeda.js';
export * as obrigacoes from './obrigacoes.js';
export * as locacao from './locacao.js';
export * as multas from './multas.js';
export * as ids from './ids.js';
export * as schema from './schema.js';
export * as tabela from './tabela.js';
export * as veiculos from './veiculos.js';
export * as config from './config-padrao.js';
export * as importacao from './importacao.js';
export * as exercicio from './exercicio.js';

export const VERSAO = '0.2.0';
