/**
 * Importação em lote por CSV (carga inicial da Fase 2 e importações futuras).
 *
 * Tudo é validado antes de gravar: tipos e listas (esquema), chaves repetidas, CNPJ em
 * FILIAIS, unicidade de RENAVAM e placa (inclusive contra o que já está na base),
 * locatário e veículo das locações, e sobreposição de locações. Com qualquer erro, nada
 * é gravado.
 */

import { tabela } from './schema.js';
import { chaveRegistro, coerirValor, validarRegistro } from './tabela.js';
import { completarVeiculo, validarVeiculo } from './veiculos.js';
import { validarLocacoes } from './locacao.js';
import { normalizarPlaca } from './placa.js';

/** Ordem de gravação: referências antes de quem as usa. */
export const ORDEM_IMPORTACAO = ['FILIAIS', 'LOCATARIOS', 'VEICULOS', 'LOCACOES',
  'CALENDARIO_VENCIMENTOS', 'ALIQUOTAS_IPVA', 'TAXAS_LICENCIAMENTO', 'VALORES_VENAIS'];

function vazio(v) {
  return v === null || v === undefined || String(v).trim() === '';
}

/**
 * Matriz (1ª linha = cabeçalho, mapeado pelo NOME) → registros. Colunas calculadas e
 * desconhecidas são ignoradas.
 */
export function matrizParaRegistros(nomeTabela, matriz) {
  const erros = [], avisos = [], registros = [];
  if (!matriz || !matriz.length) return { registros, erros, avisos };
  const def = tabela(nomeTabela);
  const cols = Object.fromEntries(def.colunas.map((c) => [c.nome, c]));
  const cab = matriz[0].map((h) => String(h === null || h === undefined ? '' : h).replace(/^﻿/, '').trim());
  const desconhecidas = cab.filter((h) => h && !cols[h]);
  if (desconhecidas.length) avisos.push(`${nomeTabela}: colunas ignoradas (não fazem parte da tabela): ${desconhecidas.join(', ')}`);
  const ignoradas = cab.filter((h) => cols[h] && cols[h].calculada);
  if (ignoradas.length) avisos.push(`${nomeTabela}: colunas calculadas ignoradas (o sistema recalcula): ${ignoradas.join(', ')}`);
  const semChave = def.chave.filter((k) => !cab.includes(k));
  if (semChave.length) {
    erros.push(`${nomeTabela}: o arquivo não tem a coluna-chave ${semChave.join(', ')}`);
    return { registros, erros, avisos };
  }
  matriz.slice(1).forEach((linha, i) => {
    if (linha.every(vazio)) return;
    const r = { _linhaArquivo: i + 2 };
    cab.forEach((h, j) => {
      const col = cols[h];
      if (col && !col.calculada) r[h] = coerirValor(linha[j], col);
    });
    registros.push(r);
  });
  return { registros, erros, avisos };
}

/**
 * VALORES_VENAIS pode vir com a coluna "placa" no lugar de "veiculo_id" (quem preenche
 * conhece a placa). A placa é resolvida pela equivalência Mercosul.
 */
function resolverPlacas(matriz, veiculos, erros) {
  const cab = matriz[0].map((h) => String(h || '').replace(/^\uFEFF/, '').trim());
  const iPlaca = cab.indexOf('placa');
  if (iPlaca < 0 || cab.includes('veiculo_id')) return matriz;
  const porPlaca = new Map(veiculos.map((v) => [normalizarPlaca(v.placa), v.veiculo_id]));
  const saida = [[...cab.slice(0, iPlaca), 'veiculo_id', ...cab.slice(iPlaca + 1)]];
  matriz.slice(1).forEach((linha, i) => {
    if (linha.every(vazio)) return;
    const id = porPlaca.get(normalizarPlaca(linha[iPlaca]));
    if (!id) erros.push(`VALORES_VENAIS linha ${i + 2}: placa ${linha[iPlaca]} não está cadastrada`);
    saida.push([...linha.slice(0, iPlaca), id || '', ...linha.slice(iPlaca + 1)]);
  });
  return saida;
}

function rotulo(t, r) {
  const k = chaveRegistro(r, t);
  return `${t} linha ${r._linhaArquivo}${k ? ` (${k})` : ''}`;
}

/**
 * @param {Object<string, any[][]>} arquivos matriz por tabela (só as que vieram)
 * @param {Object<string, object[]>} existentes registros atuais da base por tabela
 * @returns {{ok:boolean, porTabela:Object<string,{registros:object[], novos:number, atualizados:number}>,
 *            erros:string[], avisos:string[]}}
 */
export function prepararImportacao(arquivosEntrada, existentes = {}) {
  let arquivos = arquivosEntrada;
  const erros = [], avisos = [], porTabela = {};

  const veiculosParaPlaca = [...(existentes.VEICULOS || [])];
  for (const t of ORDEM_IMPORTACAO) {
    if (t === 'VALORES_VENAIS' && arquivos[t]) arquivos = { ...arquivos, [t]: resolverPlacas(arquivos[t], veiculosParaPlaca.concat(porTabela.VEICULOS ? porTabela.VEICULOS.registros : []), erros) };
    const atuais = new Set((existentes[t] || []).map((r) => chaveRegistro(r, t)).filter(Boolean));
    if (!arquivos[t]) { porTabela[t] = { registros: [], novos: 0, atualizados: 0 }; continue; }
    const lido = matrizParaRegistros(t, arquivos[t]);
    erros.push(...lido.erros);
    avisos.push(...lido.avisos);
    const registros = t === 'VEICULOS' ? lido.registros.map((v) => ({ ...completarVeiculo(v), _linhaArquivo: v._linhaArquivo })) : lido.registros;
    const vistos = new Set();
    for (const r of registros) {
      const k = chaveRegistro(r, t);
      if (!k) { erros.push(`${rotulo(t, r)}: sem chave (${tabela(t).chave.join(' + ')})`); continue; }
      if (vistos.has(k)) erros.push(`${rotulo(t, r)}: chave repetida no arquivo`);
      vistos.add(k);
      for (const e of validarRegistro(r, t)) erros.push(`${rotulo(t, r)}: ${e}`);
    }
    const novos = registros.filter((r) => !atuais.has(chaveRegistro(r, t))).length;
    porTabela[t] = { registros, novos, atualizados: registros.length - novos };
  }

  // Visão combinada: o que já existe, sobrescrito pelo que chega.
  const combinado = (t) => {
    const m = new Map((existentes[t] || []).map((r) => [chaveRegistro(r, t), r]));
    for (const r of porTabela[t].registros) {
      const k = chaveRegistro(r, t);
      if (k) m.set(k, { ...(m.get(k) || {}), ...r });
    }
    return [...m.values()];
  };

  const filiais = new Set(combinado('FILIAIS').map((f) => f.cnpj));
  const veiculos = combinado('VEICULOS');
  const idsVeiculos = new Set(veiculos.map((v) => v.veiculo_id));
  const idsLocatarios = new Set(combinado('LOCATARIOS').map((l) => l.locatario_id));

  for (const v of porTabela.VEICULOS.registros) {
    const rot = `VEICULOS ${v.veiculo_id} ${v.placa || ''}`.trim();
    if (v.cnpj_proprietario && !filiais.has(v.cnpj_proprietario)) erros.push(`${rot}: CNPJ ${v.cnpj_proprietario} não está em FILIAIS`);
    const r = validarVeiculo(v, veiculos);
    r.erros.forEach((e) => erros.push(`${rot}: ${e}`));
    r.avisos.forEach((a) => avisos.push(`${rot}: ${a}`));
  }
  for (const l of porTabela.LOCACOES.registros) {
    const rot = `LOCACOES ${l.locacao_id}`;
    if (l.veiculo_id && !idsVeiculos.has(l.veiculo_id)) erros.push(`${rot}: veículo ${l.veiculo_id} não existe`);
    if (l.locatario_id && !idsLocatarios.has(l.locatario_id)) erros.push(`${rot}: locatário ${l.locatario_id} não existe`);
  }
  for (const vv of porTabela.VALORES_VENAIS.registros) {
    if (vv.veiculo_id && !idsVeiculos.has(vv.veiculo_id)) erros.push(`VALORES_VENAIS ${vv.veiculo_id}: veículo não existe`);
  }
  if (porTabela.LOCACOES.registros.length) {
    try {
      validarLocacoes(combinado('LOCACOES')).forEach((e) => erros.push(`LOCACOES: ${e}`));
    } catch (e) {
      erros.push(`LOCACOES: ${e.message}`);
    }
  }
  return { ok: erros.length === 0, porTabela, erros, avisos };
}

/** Linhas de resumo para mostrar antes de confirmar. */
export function resumoImportacao(analise) {
  return ORDEM_IMPORTACAO.filter((t) => analise.porTabela[t] && analise.porTabela[t].registros.length).map((t) => {
    const p = analise.porTabela[t];
    return `${t}: ${p.registros.length} registro(s) · ${p.novos} novo(s) · ${p.atualizados} já existente(s)`;
  });
}
