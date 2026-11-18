/**
 * Locações (veículo ↔ locatário). O responsável por uma multa é definido pela locação
 * vigente na DATA DA INFRAÇÃO, não pela situação atual (prompt §4.3).
 */

import { ehIso } from './datas.js';

function vigenteEm(l, dataIso) {
  return ehIso(l.inicio) && l.inicio <= dataIso && (!l.fim || dataIso <= l.fim);
}

/**
 * @returns {object|null} a locação vigente na data
 * @throws se houver mais de uma locação vigente na mesma data (cadastro inconsistente)
 */
export function locacaoNaData(locacoes, veiculoId, dataIso) {
  if (!ehIso(dataIso)) throw new Error(`Data inválida: ${dataIso}`);
  const vigentes = locacoes.filter((l) => l.veiculo_id === veiculoId && vigenteEm(l, dataIso));
  if (vigentes.length > 1) {
    const ids = vigentes.map((l) => l.locacao_id).join(', ');
    throw new Error(`Locações sobrepostas para ${veiculoId} em ${dataIso}: ${ids}`);
  }
  return vigentes[0] || null;
}

/**
 * @returns {{responsavel:'LOCATARIO'|'OPERACAO_PROPRIA', locatario_id:string|null,
 *            locacao_id:string|null, repassa_multas:boolean}}
 */
export function responsavelNaData(locacoes, veiculoId, dataIso) {
  const l = locacaoNaData(locacoes, veiculoId, dataIso);
  if (!l) return { responsavel: 'OPERACAO_PROPRIA', locatario_id: null, locacao_id: null, repassa_multas: false };
  return {
    responsavel: 'LOCATARIO',
    locatario_id: l.locatario_id || null,
    locacao_id: l.locacao_id || null,
    repassa_multas: l.repassa_multas !== 'N',
  };
}

/** Problemas de cadastro: fim antes do início, datas inválidas, sobreposição no mesmo veículo. */
export function validarLocacoes(locacoes) {
  const erros = [];
  const porVeiculo = {};
  for (const l of locacoes) {
    if (!ehIso(l.inicio)) erros.push(`${l.locacao_id}: data de início inválida`);
    if (l.fim && !ehIso(l.fim)) erros.push(`${l.locacao_id}: data de fim inválida`);
    if (ehIso(l.inicio) && ehIso(l.fim) && l.fim < l.inicio) erros.push(`${l.locacao_id}: fim antes do início`);
    (porVeiculo[l.veiculo_id] = porVeiculo[l.veiculo_id] || []).push(l);
  }
  for (const [veiculo, lista] of Object.entries(porVeiculo)) {
    const ord = lista.filter((l) => ehIso(l.inicio)).sort((a, b) => (a.inicio < b.inicio ? -1 : 1));
    for (let i = 1; i < ord.length; i++) {
      const ant = ord[i - 1];
      if (!ant.fim || ant.fim >= ord[i].inicio) {
        erros.push(`${veiculo}: locações ${ant.locacao_id} e ${ord[i].locacao_id} se sobrepõem`);
      }
    }
  }
  return erros;
}
