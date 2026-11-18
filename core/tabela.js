/**
 * Conversão genérica linha ↔ registro, guiada pelo esquema, mais validação e diff para
 * auditoria. Não depende de serviços Google: o adaptador do Apps Script converte as
 * datas da planilha (Date) para ISO antes de chamar estas funções, e de volta depois.
 */

import { ENUMS, tabela } from './schema.js';
import { ehIso, ehCompetencia } from './datas.js';
import { parseMoeda } from './moeda.js';
import { limparPlaca, placaValida } from './placa.js';
import { normalizarRenavam, renavamValido } from './renavam.js';
import { cnpjValido, cpfValido, documentoValido, formatarCnpj, formatarCpf, formatarDocumento, limparCnpj } from './documentos-fiscais.js';

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function vazio(v) {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
}

/** Mapa nome → índice (0-based) do cabeçalho. Lança erro se houver cabeçalho repetido. */
export function mapearCabecalho(cabecalho) {
  const mapa = {};
  cabecalho.forEach((h, i) => {
    const nome = String(h || '').trim();
    if (!nome) return;
    if (nome in mapa) throw new Error(`Cabeçalho repetido: ${nome}`);
    mapa[nome] = i;
  });
  return mapa;
}

/**
 * Compara o cabeçalho existente com o esperado. Colunas faltando são acrescentadas no
 * fim. Colunas extras (criadas à mão) são mantidas e apenas reportadas.
 */
export function planoCabecalho(existente, esperado) {
  const atual = existente.map((h) => String(h || '').trim()).filter(Boolean);
  return {
    faltando: esperado.filter((n) => !atual.includes(n)),
    extras: atual.filter((n) => !esperado.includes(n)),
  };
}

/** Normaliza um valor lido da planilha conforme o tipo da coluna. */
export function coerirValor(valor, coluna) {
  if (vazio(valor)) return null;
  switch (coluna.tipo) {
    case 'inteiro':
    case 'numero':
    case 'pct': {
      if (typeof valor === 'number') return valor;
      const n = Number(String(valor).replace(/\s/g, '').replace(',', '.'));
      return Number.isFinite(n) ? n : String(valor);
    }
    case 'moeda': {
      const n = parseMoeda(valor);
      return n === null ? String(valor) : n;
    }
    case 'enum':
    case 'sn':
      return String(valor).trim().toUpperCase();
    case 'renavam':
      return normalizarRenavam(valor) || String(valor);
    case 'placa':
      return limparPlaca(valor);
    case 'cnpj':
      return limparCnpj(valor).length === 14 ? formatarCnpj(valor) : String(valor).trim();
    case 'cpf':
      return formatarCpf(String(valor).replace(/\D/g, '').padStart(11, '0'));
    case 'documento':
      return formatarDocumento(valor);
    case 'email':
      return String(valor).trim().toLowerCase();
    case 'emails':
      return String(valor).split(/[;,\s]+/).map((e) => e.trim().toLowerCase()).filter(Boolean).join(', ');
    case 'lista':
      return Array.isArray(valor) ? valor : String(valor).split(',').map((s) => s.trim()).filter(Boolean);
    case 'id':
    case 'competencia':
      return String(valor).trim();
    default:
      return typeof valor === 'string' ? valor.trim() : valor;
  }
}

/** Linha (array) → registro (objeto), só com as colunas do esquema. */
export function linhaParaRegistro(linha, mapa, nomeTabela) {
  const reg = {};
  for (const col of tabela(nomeTabela).colunas) {
    const i = mapa[col.nome];
    reg[col.nome] = i === undefined ? null : coerirValor(linha[i], col);
  }
  return reg;
}

/** Valor do registro → valor de célula (antes da conversão de datas pelo adaptador). */
export function valorParaCelula(valor, coluna) {
  if (valor === null || valor === undefined) return '';
  if (coluna && coluna.tipo === 'lista' && Array.isArray(valor)) return valor.join(', ');
  if (coluna && coluna.tipo === 'json' && typeof valor === 'object') return JSON.stringify(valor);
  return valor;
}

/**
 * Registro → linha na ordem do cabeçalho da aba. Colunas do cabeçalho que o registro não
 * traz ficam com o valor de `linhaAtual` (para atualizações parciais) ou vazias.
 */
export function registroParaLinha(registro, cabecalho, nomeTabela, linhaAtual = null) {
  const cols = Object.fromEntries(tabela(nomeTabela).colunas.map((col) => [col.nome, col]));
  return cabecalho.map((h, i) => {
    const nome = String(h || '').trim();
    if (nome in registro) return valorParaCelula(registro[nome], cols[nome]);
    return linhaAtual ? linhaAtual[i] : '';
  });
}

/** Chave do registro (colunas-chave unidas por "|"). */
export function chaveRegistro(registro, nomeTabela) {
  const def = tabela(nomeTabela);
  if (!def.chave.length) return null;
  const partes = def.chave.map((k) => (vazio(registro[k]) ? '' : String(registro[k]).trim()));
  return partes.some((p) => p === '') ? null : partes.join('|');
}

/**
 * Validação genérica (tipos, listas, obrigatórios).
 * @returns {string[]} erros
 */
export function validarRegistro(registro, nomeTabela, opcoes = {}) {
  const def = tabela(nomeTabela);
  const erros = [];
  for (const col of def.colunas) {
    const v = registro[col.nome];
    const rotulo = `${col.nome}`;
    if (vazio(v)) {
      if (col.obrigatorio && !col.calculada && !opcoes.parcial) erros.push(`${rotulo}: obrigatório`);
      continue;
    }
    switch (col.tipo) {
      case 'enum':
        if (!ENUMS[col.enum].includes(String(v))) erros.push(`${rotulo}: "${v}" não está na lista (${ENUMS[col.enum].join(', ')})`);
        break;
      case 'sn':
        if (v !== 'S' && v !== 'N') erros.push(`${rotulo}: use S ou N`);
        break;
      case 'inteiro':
        if (!Number.isInteger(v)) erros.push(`${rotulo}: número inteiro esperado`);
        break;
      case 'numero':
        if (typeof v !== 'number' || !Number.isFinite(v)) erros.push(`${rotulo}: número esperado`);
        break;
      case 'moeda':
        if (typeof v !== 'number' || !Number.isFinite(v)) erros.push(`${rotulo}: valor em R$ esperado`);
        else if (v < 0) erros.push(`${rotulo}: não pode ser negativo`);
        break;
      case 'pct':
        if (typeof v !== 'number' || v < 0 || v > 100) erros.push(`${rotulo}: percentual entre 0 e 100 esperado`);
        break;
      case 'data':
        if (!ehIso(v)) erros.push(`${rotulo}: data inválida`);
        break;
      case 'datahora':
        if (!/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/.test(String(v)) || !ehIso(String(v).slice(0, 10))) erros.push(`${rotulo}: data/hora inválida`);
        break;
      case 'renavam':
        if (!renavamValido(v)) erros.push(`${rotulo}: RENAVAM inválido (${v})`);
        break;
      case 'placa':
        if (!placaValida(v)) erros.push(`${rotulo}: placa inválida (${v})`);
        break;
      case 'cnpj':
        if (!cnpjValido(v)) erros.push(`${rotulo}: CNPJ inválido (${v})`);
        break;
      case 'cpf':
        if (!cpfValido(v)) erros.push(`${rotulo}: CPF inválido`);
        break;
      case 'documento':
        if (!documentoValido(v)) erros.push(`${rotulo}: CNPJ/CPF inválido (${v})`);
        break;
      case 'email':
        if (!RE_EMAIL.test(String(v))) erros.push(`${rotulo}: e-mail inválido (${v})`);
        break;
      case 'emails':
        for (const e of String(v).split(/[;,\s]+/).filter(Boolean)) if (!RE_EMAIL.test(e)) erros.push(`${rotulo}: e-mail inválido (${e})`);
        break;
      case 'competencia':
        if (!ehCompetencia(v)) erros.push(`${rotulo}: use AAAA-MM`);
        break;
      case 'json':
        if (typeof v === 'string') { try { JSON.parse(v); } catch (e) { erros.push(`${rotulo}: JSON inválido`); } }
        break;
      default:
        break;
    }
  }
  return erros;
}

/** Campos alterados entre duas versões (ignora as colunas de controle). */
export function diffRegistros(antes, depois) {
  const ignorar = new Set(['criado_em', 'atualizado_em', 'atualizado_por']);
  const norm = (v) => (vazio(v) ? null : Array.isArray(v) ? v.join(', ') : v);
  const mudancas = {};
  const campos = new Set([...Object.keys(antes || {}), ...Object.keys(depois || {})]);
  for (const k of campos) {
    if (ignorar.has(k)) continue;
    const a = norm((antes || {})[k]), d = norm((depois || {})[k]);
    if (a !== d) mudancas[k] = { antes: a, depois: d };
  }
  return mudancas;
}

/** Aplica `coerirValor` às colunas conhecidas presentes no registro (entrada vinda de fora). */
export function normalizarRegistro(registro, nomeTabela) {
  const cols = Object.fromEntries(tabela(nomeTabela).colunas.map((col) => [col.nome, col]));
  const saida = {};
  for (const [k, v] of Object.entries(registro)) saida[k] = cols[k] ? coerirValor(v, cols[k]) : v;
  return saida;
}
