/**
 * Regras do cadastro de veículos (prompt §4.2 e §5.2).
 */

import { ENUMS } from './schema.js';
import { normalizarPlaca } from './placa.js';
import { renavamValido } from './renavam.js';

export const CATEGORIA_POR_TIPO = {
  CAVALO: 'TRACAO', TRUCK: 'TRACAO', TOCO: 'TRACAO',
  CARRETA: 'IMPLEMENTO', BITREM: 'IMPLEMENTO', CARRETINHA: 'IMPLEMENTO',
  AUTOMOVEL: 'LEVE', VAN: 'LEVE', UTILITARIO: 'LEVE',
};

/** Situações em que o veículo saiu da frota (não entra em novos exercícios). */
export const SITUACOES_INATIVAS = ['VENDIDO', 'BAIXADO', 'HISTORICO'];

/** Grafias encontradas na planilha antiga → tipo do cadastro. */
const SINONIMOS = {
  'BI TREM': 'BITREM', 'BI-TREM': 'BITREM', BITREM: 'BITREM',
  'CAVALO MECANICO': 'CAVALO', CAVALO: 'CAVALO',
  SEMIRREBOQUE: 'CARRETA', 'SEMI REBOQUE': 'CARRETA', CARRETA: 'CARRETA',
  CAMINHONETE: 'UTILITARIO', PICAPE: 'UTILITARIO', PICKUP: 'UTILITARIO',
};

/** Modelos que costumam aparecer no lugar do tipo (sugestão, sujeita a confirmação). */
const MODELOS_CONHECIDOS = { SAVEIRO: 'UTILITARIO', STRADA: 'UTILITARIO', MONTANA: 'UTILITARIO' };

export function categoriaDoTipo(tipo) {
  return CATEGORIA_POR_TIPO[tipo] || null;
}

/**
 * Interpreta o tipo vindo de planilha ou documento.
 * @returns {{tipo:string|null, confirmar:boolean, motivo:string|null}}
 *   `confirmar` = true quando é só uma sugestão (precisa de decisão humana).
 */
export function normalizarTipoVeiculo(valor) {
  if (valor === null || valor === undefined || valor instanceof Date || typeof valor === 'number') {
    return { tipo: null, confirmar: true, motivo: valor === null || valor === undefined || valor === '' ? 'Tipo vazio' : `Valor não é um tipo: ${valor}` };
  }
  const s = String(valor).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  if (!s) return { tipo: null, confirmar: true, motivo: 'Tipo vazio' };
  if (ENUMS.TIPO_VEICULO.includes(s)) return { tipo: s, confirmar: false, motivo: null };
  if (SINONIMOS[s]) return { tipo: SINONIMOS[s], confirmar: false, motivo: `Grafia "${valor}" padronizada` };
  if (MODELOS_CONHECIDOS[s]) return { tipo: MODELOS_CONHECIDOS[s], confirmar: true, motivo: `"${valor}" é modelo, não tipo; sugerido ${MODELOS_CONHECIDOS[s]}` };
  return { tipo: null, confirmar: true, motivo: `Tipo desconhecido: "${valor}"` };
}

export function veiculoAtivo(v) {
  return !SITUACOES_INATIVAS.includes(v.situacao);
}

/**
 * Regras de negócio além da validação genérica de tipos.
 * @param {object} v veículo
 * @param {object[]} outros demais veículos do cadastro (para unicidade)
 * @returns {{erros:string[], avisos:string[]}}
 */
export function validarVeiculo(v, outros = []) {
  const erros = [], avisos = [];
  const norm = normalizarPlaca(v.placa);
  const ativo = veiculoAtivo(v);
  if (ativo && !v.renavam) erros.push('RENAVAM é obrigatório para veículo ativo');
  if (v.renavam && !renavamValido(v.renavam)) erros.push(`RENAVAM inválido: ${v.renavam}`);
  if (ativo && !v.cnpj_proprietario) erros.push('CNPJ/filial é obrigatório para veículo ativo');
  if (v.situacao === 'VENDIDO' && !v.data_venda) erros.push('Informe a data da venda');
  if (v.isento_ipva === 'S' && !String(v.motivo_isencao || '').trim()) avisos.push('Isento de IPVA sem motivo informado');

  for (const o of outros) {
    if (o.veiculo_id && o.veiculo_id === v.veiculo_id) continue;
    if (v.renavam && o.renavam === v.renavam) {
      (veiculoAtivo(o) ? erros : avisos).push(`RENAVAM ${v.renavam} já pertence a ${o.veiculo_id} (${o.placa}, ${o.situacao})`);
    }
    if (norm && normalizarPlaca(o.placa) === norm) {
      if (ativo && veiculoAtivo(o)) erros.push(`Placa ${v.placa} equivale a ${o.placa} (${o.veiculo_id}), já ativa`);
      else avisos.push(`Placa ${v.placa} equivale a ${o.placa} (${o.veiculo_id}, ${o.situacao}). Reativar?`);
    }
  }
  return { erros, avisos };
}

/** Preenche os campos calculados do veículo. */
export function completarVeiculo(v) {
  return { ...v, placa_norm: normalizarPlaca(v.placa), categoria: categoriaDoTipo(v.tipo) };
}
