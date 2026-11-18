/**
 * Identificadores estáveis. Nunca usar a posição da linha como identificador.
 */

export function formatarId(prefixo, numero, largura) {
  return prefixo + String(numero).padStart(largura, '0');
}

/** Próximo ID livre: maior sufixo numérico existente + 1 (ex.: V0212 → V0213). */
export function proximoId(prefixo, idsExistentes, largura = 4) {
  let maior = 0;
  const re = new RegExp('^' + prefixo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)$');
  for (const id of idsExistentes) {
    const m = re.exec(String(id || ''));
    if (m) maior = Math.max(maior, Number(m[1]));
  }
  return formatarId(prefixo, maior + 1, largura);
}

/** "2027-IPVA-V0001-U" */
export function obrigacaoId(exercicio, tributo, veiculoId, parcela) {
  return `${exercicio}-${tributo}-${veiculoId}-${parcela}`;
}

/** Prefixos e larguras por entidade. */
export const PREFIXOS = {
  VEICULOS: { prefixo: 'V', largura: 4 },
  LOCATARIOS: { prefixo: 'LT', largura: 4 },
  LOCACOES: { prefixo: 'LC', largura: 5 },
  MULTAS: { prefixo: 'M', largura: 6 },
  MOTORISTAS: { prefixo: 'MT', largura: 4 },
  DESCONTOS_FOLHA: { prefixo: 'DF', largura: 6 },
};
