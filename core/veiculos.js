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

/**
 * Situação documental do veículo num exercício (prompt §5.6), para os selos da lista.
 * IPVA: NAO_TRIBUTADO | ISENTO | QUITADO | EM_DIA | VENCIDO | NAO_GERADO
 * Licenciamento: LICENCIADO | QUITADO_SEM_CRLV | EM_DIA | VENCIDO | NAO_GERADO
 */
export function situacaoDocumental(obrigacoesDoVeiculo, exercicio, hoje) {
  const doAno = obrigacoesDoVeiculo.filter((o) => Number(o.exercicio) === Number(exercicio) && !['CANCELADO'].includes(o.status));
  const quitada = (o) => ['PAGO', 'PAGO_SEM_LANCAMENTO', 'ISENTO', 'NAO_APLICA'].includes(o.status);
  const vencida = (o) => !quitada(o) && o.vencimento && o.vencimento < hoje;
  const ipva = doAno.filter((o) => o.tributo === 'IPVA');
  const lic = doAno.filter((o) => o.tributo === 'LICENCIAMENTO');
  let sIpva = 'NAO_GERADO';
  if (ipva.length) {
    if (ipva.every((o) => o.status === 'ISENTO')) sIpva = 'ISENTO';
    else if (ipva.every(quitada)) sIpva = 'QUITADO';
    else if (ipva.some(vencida)) sIpva = 'VENCIDO';
    else sIpva = 'EM_DIA';
  }
  let sLic = 'NAO_GERADO';
  if (lic.length) {
    const l = lic[0];
    if (quitada(l)) sLic = l.crlv_emitido === 'S' || l.status === 'NAO_APLICA' ? 'LICENCIADO' : 'QUITADO_SEM_CRLV';
    else sLic = vencida(l) ? 'VENCIDO' : 'EM_DIA';
  }
  return { ipva: sIpva, licenciamento: sLic };
}

/** Obrigações que viram NAO_APLICA quando o veículo é vendido/baixado em `data`. */
export function obrigacoesAposVenda(obrigacoesDoVeiculo, data) {
  return obrigacoesDoVeiculo.filter((o) => o.vencimento && o.vencimento > data
    && !['PAGO', 'PAGO_SEM_LANCAMENTO', 'LANCADO_ERP', 'CANCELADO', 'NAO_APLICA', 'ISENTO'].includes(o.status)
    && !(Number(o.valor_pago) > 0));
}
