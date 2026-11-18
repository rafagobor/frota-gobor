/**
 * Subconjunto do núcleo usado no navegador (painel): validação de placa e RENAVAM,
 * formatação de valores e datas. Empacotado e minificado à parte para o painel ficar leve.
 */
export * as placa from './placa.js';
export * as renavam from './renavam.js';
export * as moeda from './moeda.js';
export { dataBR, parseDataFlex } from './datas.js';
export { rotuloParcela } from './obrigacoes.js';
