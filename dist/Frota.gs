/**
 * PAINEL DE FROTA GOBOR - versao 0.2.0 - gerado em 2026-11-18
 *
 * COMO INSTALAR (sem terminal):
 *   1. Abra a planilha "Frota Gobor - Base" > Extensoes > Apps Script.
 *   2. Apague todo o conteudo do arquivo Codigo.gs e cole ESTE texto inteiro no lugar.
 *   3. Salve (Ctrl+S ou o icone de disquete). Volte para a planilha e recarregue a pagina.
 *   4. Use o menu Frota > Admin > Criar/validar base (autorize quando o Google pedir).
 * Para atualizar: repita os passos 1 a 3 com o texto da versao nova.
 *
 * Gerado por "npm run build" a partir do repositorio frota-gobor. Nao edite aqui.
 */

// ===== 00_core.js =====
// GERADO por `npm run build` a partir de core/. N\u00c3O EDITAR ESTE ARQUIVO.
var Core = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // core/index.js
  var index_exports = {};
  __export(index_exports, {
    VERSAO: () => VERSAO,
    config: () => config_padrao_exports,
    datas: () => datas_exports,
    exercicio: () => exercicio_exports,
    fiscal: () => documentos_fiscais_exports,
    ids: () => ids_exports,
    importacao: () => importacao_exports,
    locacao: () => locacao_exports,
    moeda: () => moeda_exports,
    multas: () => multas_exports,
    obrigacoes: () => obrigacoes_exports,
    placa: () => placa_exports,
    renavam: () => renavam_exports,
    schema: () => schema_exports,
    tabela: () => tabela_exports,
    veiculos: () => veiculos_exports
  });

  // core/placa.js
  var placa_exports = {};
  __export(placa_exports, {
    finalDaPlaca: () => finalDaPlaca,
    formasDaPlaca: () => formasDaPlaca,
    formatarPlaca: () => formatarPlaca,
    formatoPlaca: () => formatoPlaca,
    limparPlaca: () => limparPlaca,
    normalizarPlaca: () => normalizarPlaca,
    paraMercosul: () => paraMercosul,
    placaValida: () => placaValida,
    placasEquivalentes: () => placasEquivalentes
  });
  var LETRAS_MERCOSUL = "ABCDEFGHIJ";
  function limparPlaca(valor) {
    if (valor === null || valor === void 0) return "";
    return String(valor).toUpperCase().replace(/[^A-Z0-9]/g, "");
  }
  function formatoPlaca(valor) {
    const p = limparPlaca(valor);
    if (/^[A-Z]{3}[0-9]{4}$/.test(p)) return "ANTIGO";
    if (/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(p)) return "MERCOSUL";
    return null;
  }
  function placaValida(valor) {
    return formatoPlaca(valor) !== null;
  }
  function normalizarPlaca(valor) {
    const p = limparPlaca(valor);
    const formato = formatoPlaca(p);
    if (!formato) return null;
    if (formato === "ANTIGO") return p;
    const idx = LETRAS_MERCOSUL.indexOf(p[4]);
    if (idx < 0) return p;
    return p.slice(0, 4) + String(idx) + p.slice(5);
  }
  function paraMercosul(valor) {
    const p = limparPlaca(valor);
    const formato = formatoPlaca(p);
    if (!formato) return null;
    if (formato === "MERCOSUL") return p;
    return p.slice(0, 4) + LETRAS_MERCOSUL[Number(p[4])] + p.slice(5);
  }
  function placasEquivalentes(a, b) {
    const na = normalizarPlaca(a);
    return na !== null && na === normalizarPlaca(b);
  }
  function formasDaPlaca(valor) {
    const norm = normalizarPlaca(valor);
    if (!norm) return [];
    const merc = paraMercosul(norm);
    return merc && merc !== norm ? [norm, merc] : [norm];
  }
  function formatarPlaca(valor) {
    const p = limparPlaca(valor);
    const formato = formatoPlaca(p);
    if (formato === "ANTIGO") return p.slice(0, 3) + "-" + p.slice(3);
    return p;
  }
  function finalDaPlaca(valor) {
    const norm = normalizarPlaca(valor);
    return norm ? norm[6] : null;
  }

  // core/renavam.js
  var renavam_exports = {};
  __export(renavam_exports, {
    analisarRenavam: () => analisarRenavam,
    dvRenavam: () => dvRenavam,
    limparRenavam: () => limparRenavam,
    normalizarRenavam: () => normalizarRenavam,
    renavamValido: () => renavamValido
  });
  var PESOS = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3];
  function limparRenavam(valor) {
    if (valor === null || valor === void 0 || valor === "") return "";
    let s;
    if (typeof valor === "number") {
      if (!Number.isFinite(valor) || !Number.isInteger(valor) || valor < 0) return "";
      s = String(valor);
    } else {
      s = String(valor).trim().replace(/\.0+$/, "");
    }
    return s.replace(/\D/g, "");
  }
  function normalizarRenavam(valor) {
    const s = limparRenavam(valor);
    if (!s || s.length > 11) return null;
    return s.padStart(11, "0");
  }
  function dvRenavam(base10) {
    if (!/^\d{10}$/.test(base10)) throw new Error("Base do RENAVAM deve ter 10 d\u00edgitos");
    const invertida = base10.split("").reverse();
    let soma = 0;
    for (let i = 0; i < 10; i++) soma += Number(invertida[i]) * PESOS[i];
    const dv = soma * 10 % 11;
    return dv === 10 ? 0 : dv;
  }
  function renavamValido(valor) {
    const r = normalizarRenavam(valor);
    if (!r || /^0+$/.test(r)) return false;
    return dvRenavam(r.slice(0, 10)) === Number(r[10]);
  }
  function analisarRenavam(valor) {
    const digitos = limparRenavam(valor);
    const normalizado = normalizarRenavam(valor);
    let motivo = null;
    if (!digitos) motivo = "RENAVAM vazio";
    else if (digitos.length > 11) motivo = `RENAVAM com ${digitos.length} d\u00edgitos (m\u00e1ximo 11)`;
    else if (!renavamValido(valor)) motivo = "D\u00edgito verificador inv\u00e1lido";
    return { original: valor, normalizado, valido: motivo === null, motivo };
  }

  // core/documentos-fiscais.js
  var documentos_fiscais_exports = {};
  __export(documentos_fiscais_exports, {
    cnpjAlfanumerico: () => cnpjAlfanumerico,
    cnpjValido: () => cnpjValido,
    cpfValido: () => cpfValido,
    documentoValido: () => documentoValido,
    formatarCnpj: () => formatarCnpj,
    formatarCpf: () => formatarCpf,
    formatarDocumento: () => formatarDocumento,
    limparCnpj: () => limparCnpj,
    limparCpf: () => limparCpf
  });
  var PESOS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  var PESOS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  function limparCnpj(valor) {
    if (valor === null || valor === void 0) return "";
    return String(valor).toUpperCase().replace(/[^0-9A-Z]/g, "");
  }
  function dvCnpj(base, pesos) {
    let soma = 0;
    for (let i = 0; i < pesos.length; i++) soma += (base.charCodeAt(i) - 48) * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }
  function cnpjValido(valor) {
    const c2 = limparCnpj(valor);
    if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(c2)) return false;
    if (/^(\d)\1{13}$/.test(c2)) return false;
    const dv1 = dvCnpj(c2.slice(0, 12), PESOS_DV1);
    const dv2 = dvCnpj(c2.slice(0, 12) + dv1, PESOS_DV2);
    return c2[12] === String(dv1) && c2[13] === String(dv2);
  }
  function cnpjAlfanumerico(valor) {
    return /[A-Z]/.test(limparCnpj(valor).slice(0, 12));
  }
  function formatarCnpj(valor) {
    const c2 = limparCnpj(valor);
    if (c2.length !== 14) return valor === null || valor === void 0 ? "" : String(valor);
    return `${c2.slice(0, 2)}.${c2.slice(2, 5)}.${c2.slice(5, 8)}/${c2.slice(8, 12)}-${c2.slice(12)}`;
  }
  function limparCpf(valor) {
    if (valor === null || valor === void 0) return "";
    return String(valor).replace(/\D/g, "");
  }
  function cpfValido(valor) {
    const c2 = limparCpf(valor).padStart(11, "0");
    if (!/^\d{11}$/.test(c2) || /^(\d)\1{10}$/.test(c2)) return false;
    const calc2 = (n) => {
      let soma = 0;
      for (let i = 0; i < n; i++) soma += Number(c2[i]) * (n + 1 - i);
      const r = soma * 10 % 11;
      return r === 10 ? 0 : r;
    };
    return calc2(9) === Number(c2[9]) && calc2(10) === Number(c2[10]);
  }
  function formatarCpf(valor) {
    const c2 = limparCpf(valor);
    if (c2.length !== 11) return valor === null || valor === void 0 ? "" : String(valor);
    return `${c2.slice(0, 3)}.${c2.slice(3, 6)}.${c2.slice(6, 9)}-${c2.slice(9)}`;
  }
  function documentoValido(valor) {
    const c2 = limparCnpj(valor);
    if (c2.length === 14) return cnpjValido(c2);
    if (/^\d{11}$/.test(c2)) return cpfValido(c2);
    return false;
  }
  function formatarDocumento(valor) {
    const c2 = limparCnpj(valor);
    if (c2.length === 14) return formatarCnpj(c2);
    if (/^\d{11}$/.test(c2)) return formatarCpf(c2);
    return valor === null || valor === void 0 ? "" : String(valor);
  }

  // core/datas.js
  var datas_exports = {};
  __export(datas_exports, {
    compararIso: () => compararIso,
    competenciaDe: () => competenciaDe,
    dataBR: () => dataBR,
    diaDaSemana: () => diaDaSemana,
    diasEntre: () => diasEntre,
    ehCompetencia: () => ehCompetencia,
    ehDiaUtil: () => ehDiaUtil,
    ehIso: () => ehIso,
    isoDeYMD: () => isoDeYMD,
    mesPorExtenso: () => mesPorExtenso,
    parseDataBR: () => parseDataBR,
    parseDataFlex: () => parseDataFlex,
    parseDataHora: () => parseDataHora,
    proximoDiaUtil: () => proximoDiaUtil,
    somarCompetencia: () => somarCompetencia,
    somarDias: () => somarDias,
    somarMeses: () => somarMeses
  });
  var DIA_MS = 864e5;
  var MESES = {
    janeiro: 1,
    jan: 1,
    fevereiro: 2,
    fev: 2,
    marco: 3,
    mar: 3,
    abril: 4,
    abr: 4,
    maio: 5,
    mai: 5,
    junho: 6,
    jun: 6,
    julho: 7,
    jul: 7,
    agosto: 8,
    ago: 8,
    setembro: 9,
    set: 9,
    outubro: 10,
    out: 10,
    novembro: 11,
    nov: 11,
    dezembro: 12,
    dez: 12
  };
  function pad2(n) {
    return String(n).padStart(2, "0");
  }
  function isoDeYMD(ano, mes, dia) {
    const y = Number(ano), m = Number(mes), d = Number(dia);
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
    if (y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1 || d > 31) return null;
    const t2 = new Date(Date.UTC(y, m - 1, d));
    if (t2.getUTCFullYear() !== y || t2.getUTCMonth() !== m - 1 || t2.getUTCDate() !== d) return null;
    return `${y}-${pad2(m)}-${pad2(d)}`;
  }
  function ehIso(valor) {
    if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    const [y, m, d] = valor.split("-");
    return isoDeYMD(y, m, d) === valor;
  }
  function parseDataBR(texto) {
    if (texto === null || texto === void 0) return null;
    const m = String(texto).trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
    if (!m) return null;
    const ano = m[3].length === 2 ? 2e3 + Number(m[3]) : Number(m[3]);
    return isoDeYMD(ano, m[2], m[1]);
  }
  function parseDataFlex(valor) {
    if (valor === null || valor === void 0 || valor === "") return null;
    if (valor instanceof Date) {
      if (Number.isNaN(valor.getTime())) return null;
      return isoDeYMD(valor.getFullYear(), valor.getMonth() + 1, valor.getDate());
    }
    const s = String(valor).trim();
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
    if (iso) return isoDeYMD(iso[1], iso[2], iso[3]);
    const semHora = s.replace(/\s+\d{1,2}:\d{2}(:\d{2})?$/, "");
    return parseDataBR(semHora);
  }
  function parseDataHora(valor) {
    if (valor === null || valor === void 0 || valor === "") return null;
    const s = String(valor).trim();
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})/);
    if (m) {
      const d = isoDeYMD(m[1], m[2], m[3]);
      return d && Number(m[4]) < 24 && Number(m[5]) < 60 ? `${d} ${pad2(m[4])}:${m[5]}` : null;
    }
    m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})\s+(\d{1,2})[:h](\d{2})/);
    if (m) {
      const d = parseDataBR(`${m[1]}/${m[2]}/${m[3]}`);
      return d && Number(m[4]) < 24 && Number(m[5]) < 60 ? `${d} ${pad2(m[4])}:${m[5]}` : null;
    }
    return null;
  }
  function dataBR(iso) {
    if (!ehIso(iso)) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }
  function paraUTC(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  }
  function deUTC(ms) {
    const t2 = new Date(ms);
    return `${t2.getUTCFullYear()}-${pad2(t2.getUTCMonth() + 1)}-${pad2(t2.getUTCDate())}`;
  }
  function diasEntre(de, ate) {
    if (!ehIso(de) || !ehIso(ate)) throw new Error(`Data inv\u00e1lida: ${!ehIso(de) ? de : ate}`);
    return Math.round((paraUTC(ate) - paraUTC(de)) / DIA_MS);
  }
  function somarDias(iso, dias) {
    if (!ehIso(iso)) throw new Error(`Data inv\u00e1lida: ${iso}`);
    return deUTC(paraUTC(iso) + dias * DIA_MS);
  }
  function somarMeses(iso, meses) {
    if (!ehIso(iso)) throw new Error(`Data inv\u00e1lida: ${iso}`);
    const [y, m, d] = iso.split("-").map(Number);
    const total = y * 12 + (m - 1) + meses;
    const ny = Math.floor(total / 12), nm = total % 12 + 1;
    const ultimo = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
    return isoDeYMD(ny, nm, Math.min(d, ultimo));
  }
  function mesPorExtenso(texto) {
    if (texto === null || texto === void 0) return null;
    const chave = String(texto).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\.$/, "");
    return MESES[chave] || null;
  }
  function competenciaDe(iso) {
    if (!ehIso(iso)) throw new Error(`Data inv\u00e1lida: ${iso}`);
    return iso.slice(0, 7);
  }
  function ehCompetencia(valor) {
    return typeof valor === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);
  }
  function somarCompetencia(comp, meses) {
    if (!ehCompetencia(comp)) throw new Error(`Compet\u00eancia inv\u00e1lida: ${comp}`);
    return somarMeses(`${comp}-01`, meses).slice(0, 7);
  }
  function diaDaSemana(iso) {
    return new Date(paraUTC(iso)).getUTCDay();
  }
  function ehDiaUtil(iso, feriados = []) {
    const dow = diaDaSemana(iso);
    return dow !== 0 && dow !== 6 && !feriados.includes(iso);
  }
  function proximoDiaUtil(iso, feriados = []) {
    let d = iso;
    while (!ehDiaUtil(d, feriados)) d = somarDias(d, 1);
    return d;
  }
  function compararIso(a, b) {
    if (a === b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a < b ? -1 : 1;
  }

  // core/moeda.js
  var moeda_exports = {};
  __export(moeda_exports, {
    arredondar2: () => arredondar2,
    formatarMoeda: () => formatarMoeda,
    formatarNumeroBR: () => formatarNumeroBR,
    paraCentavos: () => paraCentavos,
    parseMoeda: () => parseMoeda,
    somar: () => somar
  });
  function parseMoeda(valor) {
    if (valor === null || valor === void 0 || valor === "") return null;
    if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
    let s = String(valor).replace(/\u00a0/g, " ").trim();
    if (!s) return null;
    let negativo = false;
    if (/^\(.*\)$/.test(s)) {
      negativo = true;
      s = s.slice(1, -1);
    }
    s = s.replace(/R\$/gi, "").replace(/\s+/g, "");
    if (s.startsWith("-")) {
      negativo = !negativo;
      s = s.slice(1);
    }
    if (!/^[\d.,]+$/.test(s)) return null;
    if (s.includes(",")) {
      if (s.indexOf(",") !== s.lastIndexOf(",")) return null;
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      const pontos = (s.match(/\./g) || []).length;
      if (pontos > 1) s = s.replace(/\./g, "");
      else if (pontos === 1 && /^\d{1,3}\.\d{3}$/.test(s)) s = s.replace(".", "");
    }
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    const n = Number(s);
    return negativo ? -n : n;
  }
  function paraCentavos(n) {
    const x = Number(n);
    return Math.sign(x) * Math.round(Number((Math.abs(x) * 100).toPrecision(15)));
  }
  function arredondar2(n) {
    if (n === null || n === void 0 || !Number.isFinite(Number(n))) return null;
    return paraCentavos(n) / 100;
  }
  function somar(valores) {
    let c2 = 0;
    for (const v of valores) {
      if (v === null || v === void 0 || v === "") continue;
      c2 += paraCentavos(v);
    }
    return c2 / 100;
  }
  function formatarNumeroBR(n, casas = 2) {
    if (n === null || n === void 0 || !Number.isFinite(Number(n))) return "";
    const negativo = Number(n) < 0;
    const fixo = Math.abs(Number(n)).toFixed(casas);
    const [inteiro, dec] = fixo.split(".");
    const milhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (negativo ? "-" : "") + milhar + (casas > 0 ? "," + dec : "");
  }
  function formatarMoeda(n) {
    if (n === null || n === void 0 || !Number.isFinite(Number(n))) return "";
    const s = formatarNumeroBR(Math.abs(Number(n)), 2);
    return (Number(n) < 0 ? "-" : "") + "R$ " + s;
  }

  // core/obrigacoes.js
  var obrigacoes_exports = {};
  __export(obrigacoes_exports, {
    STATUS_OBRIGACAO: () => STATUS_OBRIGACAO,
    normalizarMto: () => normalizarMto,
    obrigacaoQuitada: () => obrigacaoQuitada,
    situacaoPrazo: () => situacaoPrazo,
    statusCalculado: () => statusCalculado,
    temPagamento: () => temPagamento,
    transicaoPermitida: () => transicaoPermitida,
    validarObrigacao: () => validarObrigacao
  });
  var STATUS_OBRIGACAO = [
    "PREVISTO",
    "GUIA_DISPONIVEL",
    "LANCADO_ERP",
    "PAGO",
    "PAGO_SEM_LANCAMENTO",
    "ISENTO",
    "NAO_APLICA",
    "CANCELADO",
    "BLOQUEADO"
  ];
  var STATUS_MANUAIS = ["ISENTO", "NAO_APLICA", "CANCELADO", "BLOQUEADO"];
  var STATUS_QUITADOS = ["PAGO", "PAGO_SEM_LANCAMENTO", "ISENTO", "NAO_APLICA", "CANCELADO"];
  var TRANSICOES = {
    PREVISTO: ["GUIA_DISPONIVEL", "LANCADO_ERP", "PAGO", "PAGO_SEM_LANCAMENTO", "ISENTO", "NAO_APLICA", "CANCELADO", "BLOQUEADO"],
    GUIA_DISPONIVEL: ["PREVISTO", "LANCADO_ERP", "PAGO", "PAGO_SEM_LANCAMENTO", "ISENTO", "NAO_APLICA", "CANCELADO", "BLOQUEADO"],
    LANCADO_ERP: ["GUIA_DISPONIVEL", "PAGO", "CANCELADO", "BLOQUEADO"],
    PAGO_SEM_LANCAMENTO: ["PAGO"],
    PAGO: [],
    BLOQUEADO: ["PREVISTO", "GUIA_DISPONIVEL", "LANCADO_ERP", "PAGO", "PAGO_SEM_LANCAMENTO", "CANCELADO"],
    ISENTO: ["PREVISTO"],
    NAO_APLICA: ["PREVISTO"],
    CANCELADO: ["PREVISTO"]
  };
  function transicaoPermitida(de, para) {
    if (de === para) return true;
    return (TRANSICOES[de] || []).includes(para);
  }
  function normalizarMto(valor) {
    if (valor === null || valor === void 0) return null;
    const s = String(valor).toUpperCase().trim();
    if (!s) return null;
    const m = s.match(/^(?:MTO)?[\s:#.-]*(\d{3,})$/);
    return m ? `MTO ${m[1]}` : null;
  }
  function temPagamento(o) {
    return Number(o.valor_pago) > 0 && ehIso(o.data_pagamento);
  }
  function statusCalculado(o) {
    const atual = o.status || "PREVISTO";
    if (STATUS_MANUAIS.includes(atual) && !(atual === "BLOQUEADO" && temPagamento(o))) return atual;
    const mto = normalizarMto(o.nr_lancamento_erp);
    if (temPagamento(o)) return mto ? "PAGO" : "PAGO_SEM_LANCAMENTO";
    if (mto) return "LANCADO_ERP";
    if (Number(o.valor_guia) > 0) return "GUIA_DISPONIVEL";
    return "PREVISTO";
  }
  function validarObrigacao(o) {
    const erros = [];
    const status = o.status || "PREVISTO";
    if (!STATUS_OBRIGACAO.includes(status)) erros.push(`Status desconhecido: ${status}`);
    if (status === "PAGO" || status === "PAGO_SEM_LANCAMENTO") {
      if (!(Number(o.valor_pago) > 0)) erros.push("valor_pago \u00e9 obrigat\u00f3rio (e maior que zero) para marcar como pago");
      if (!ehIso(o.data_pagamento)) erros.push("data_pagamento \u00e9 obrigat\u00f3ria para marcar como pago");
    }
    if (status === "PAGO" && !normalizarMto(o.nr_lancamento_erp)) erros.push("PAGO exige n\u00ba de lan\u00e7amento no ERP (MTO); sem ele, use PAGO_SEM_LANCAMENTO");
    if (status === "LANCADO_ERP" && !normalizarMto(o.nr_lancamento_erp)) erros.push("LANCADO_ERP exige n\u00ba de lan\u00e7amento no ERP (MTO)");
    if (status === "BLOQUEADO" && !String(o.bloqueio_motivo || "").trim()) erros.push("BLOQUEADO exige bloqueio_motivo");
    if (o.nr_lancamento_erp && !normalizarMto(o.nr_lancamento_erp)) erros.push(`N\u00ba MTO em formato inv\u00e1lido: ${o.nr_lancamento_erp}`);
    for (const campo of ["valor_estimado", "valor_guia", "valor_pago", "encargos", "desconto_obtido"]) {
      if (o[campo] !== null && o[campo] !== void 0 && o[campo] !== "" && Number(o[campo]) < 0) erros.push(`${campo} n\u00e3o pode ser negativo`);
    }
    return erros;
  }
  function obrigacaoQuitada(o) {
    return STATUS_QUITADOS.includes(o.status);
  }
  function situacaoPrazo(vencimento, hoje, quitada, diasAlerta = 7) {
    if (quitada || !ehIso(vencimento)) return null;
    const d = diasEntre(hoje, vencimento);
    if (d < 0) return "VENCIDO";
    if (d === 0) return "VENCE_HOJE";
    if (d <= diasAlerta) return "VENCE_EM_7_DIAS";
    return "EM_DIA";
  }

  // core/locacao.js
  var locacao_exports = {};
  __export(locacao_exports, {
    locacaoNaData: () => locacaoNaData,
    responsavelNaData: () => responsavelNaData,
    validarLocacoes: () => validarLocacoes
  });
  function vigenteEm(l, dataIso) {
    return ehIso(l.inicio) && l.inicio <= dataIso && (!l.fim || dataIso <= l.fim);
  }
  function locacaoNaData(locacoes, veiculoId, dataIso) {
    if (!ehIso(dataIso)) throw new Error(`Data inv\u00e1lida: ${dataIso}`);
    const vigentes = locacoes.filter((l) => l.veiculo_id === veiculoId && vigenteEm(l, dataIso));
    if (vigentes.length > 1) {
      const ids = vigentes.map((l) => l.locacao_id).join(", ");
      throw new Error(`Loca\u00e7\u00f5es sobrepostas para ${veiculoId} em ${dataIso}: ${ids}`);
    }
    return vigentes[0] || null;
  }
  function responsavelNaData(locacoes, veiculoId, dataIso) {
    const l = locacaoNaData(locacoes, veiculoId, dataIso);
    if (!l) return { responsavel: "OPERACAO_PROPRIA", locatario_id: null, locacao_id: null, repassa_multas: false };
    return {
      responsavel: "LOCATARIO",
      locatario_id: l.locatario_id || null,
      locacao_id: l.locacao_id || null,
      repassa_multas: l.repassa_multas !== "N"
    };
  }
  function validarLocacoes(locacoes) {
    const erros = [];
    const porVeiculo = {};
    for (const l of locacoes) {
      if (!ehIso(l.inicio)) erros.push(`${l.locacao_id}: data de in\u00edcio inv\u00e1lida`);
      if (l.fim && !ehIso(l.fim)) erros.push(`${l.locacao_id}: data de fim inv\u00e1lida`);
      if (ehIso(l.inicio) && ehIso(l.fim) && l.fim < l.inicio) erros.push(`${l.locacao_id}: fim antes do in\u00edcio`);
      (porVeiculo[l.veiculo_id] = porVeiculo[l.veiculo_id] || []).push(l);
    }
    for (const [veiculo, lista] of Object.entries(porVeiculo)) {
      const ord = lista.filter((l) => ehIso(l.inicio)).sort((a, b) => a.inicio < b.inicio ? -1 : 1);
      for (let i = 1; i < ord.length; i++) {
        const ant = ord[i - 1];
        if (!ant.fim || ant.fim >= ord[i].inicio) {
          erros.push(`${veiculo}: loca\u00e7\u00f5es ${ant.locacao_id} e ${ord[i].locacao_id} se sobrep\u00f5em`);
        }
      }
    }
    return erros;
  }

  // core/multas.js
  var multas_exports = {};
  __export(multas_exports, {
    chaveMulta: () => chaveMulta,
    ehNic: () => ehNic,
    flagsMulta: () => flagsMulta,
    flagsReincidencia: () => flagsReincidencia,
    mesclarNotificacao: () => mesclarNotificacao,
    normalizarAit: () => normalizarAit,
    normalizarOrgao: () => normalizarOrgao
  });
  var ORDEM_FASE = { AUTUACAO: 1, PENALIDADE: 2 };
  var CAMPOS_IDENTIDADE = ["placa_documento", "data_hora_infracao", "cod_infracao"];
  var CAMPOS_DA_FASE = [
    "valor_original",
    "valor_com_desconto",
    "valor_desconto_sne",
    "vencimento_pgto",
    "linha_digitavel",
    "prazo_recurso",
    "nr_notificacao"
  ];
  function normalizarAit(valor) {
    if (valor === null || valor === void 0) return "";
    return String(valor).toUpperCase().replace(/[^0-9A-Z]/g, "");
  }
  function normalizarOrgao(valor) {
    if (valor === null || valor === void 0) return "";
    return String(valor).toUpperCase().trim().replace(/[\s_/]+/g, "-").replace(/-+/g, "-");
  }
  function chaveMulta(orgaoSigla, nrAit) {
    const o = normalizarOrgao(orgaoSigla), a = normalizarAit(nrAit);
    if (!o || !a) return null;
    return `${o}|${a}`;
  }
  function ehNic(codInfracao) {
    return /^500/.test(String(codInfracao || "").replace(/\D/g, ""));
  }
  function vazio(v) {
    return v === null || v === void 0 || v === "";
  }
  function comparavel(campo, valor) {
    if (campo === "placa_documento") return normalizarPlaca(valor);
    if (campo === "data_hora_infracao") return String(valor).slice(0, 10);
    if (campo === "cod_infracao") return String(valor).replace(/\D/g, "");
    return valor;
  }
  function mesclarNotificacao(existente, nova, docId) {
    if (!existente) {
      return { acao: "CRIAR", registro: { ...nova, doc_ids: docId ? [docId] : [] }, alterados: Object.keys(nova), conflitos: [] };
    }
    const docs = Array.isArray(existente.doc_ids) ? existente.doc_ids : [];
    if (docId && docs.includes(docId)) {
      return { acao: "DUPLICADO", registro: existente, alterados: [], conflitos: [] };
    }
    const conflitos = [];
    for (const campo of CAMPOS_IDENTIDADE) {
      if (!vazio(existente[campo]) && !vazio(nova[campo]) && comparavel(campo, existente[campo]) !== comparavel(campo, nova[campo])) {
        conflitos.push(`${campo}: "${existente[campo]}" \u00d7 "${nova[campo]}"`);
      }
    }
    const rankAtual = ORDEM_FASE[existente.fase], rankNovo = ORDEM_FASE[nova.fase];
    if ((existente.fase || nova.fase) && (!rankAtual || !rankNovo) && existente.fase !== nova.fase) {
      conflitos.push(`fase incompat\u00edvel: ${existente.fase} \u00d7 ${nova.fase}`);
    }
    if (conflitos.length) return { acao: "CONFLITO", registro: existente, alterados: [], conflitos };
    const avanca = rankNovo > rankAtual;
    const registro = { ...existente, doc_ids: docId ? [...docs, docId] : docs };
    const alterados = [];
    const definir = (campo, valor) => {
      if (registro[campo] !== valor) {
        registro[campo] = valor;
        alterados.push(campo);
      }
    };
    for (const [campo, valor] of Object.entries(nova)) {
      if (vazio(valor) || campo === "doc_ids") continue;
      if (campo === "data_expedicao") {
        const alvo = nova.fase === "PENALIDADE" ? "data_expedicao_penalidade" : "data_expedicao";
        if (vazio(registro[alvo]) || nova.fase === "PENALIDADE") definir(alvo, valor);
        continue;
      }
      if (avanca && (campo === "fase" || CAMPOS_DA_FASE.includes(campo))) definir(campo, valor);
      else if (vazio(registro[campo])) definir(campo, valor);
    }
    return { acao: "ATUALIZAR", registro, alterados, conflitos: [] };
  }
  function flagsMulta(m) {
    const flags = [];
    if (m.gravidade === "GRAVISSIMA") flags.push("GRAVISSIMA");
    if (Number(m.fator_multiplicador) > 1) flags.push("FATOR_MULTIPLICADOR");
    if (m.suspensao_cnh === "S" || m.suspensao_cnh === true) flags.push("SUSPENSAO_CNH");
    const dataInfracao = vazio(m.data_hora_infracao) ? null : String(m.data_hora_infracao).slice(0, 10);
    if (ehIso(dataInfracao) && ehIso(m.data_expedicao) && diasEntre(dataInfracao, m.data_expedicao) > 30) {
      flags.push("EXPEDICAO_FORA_PRAZO");
    }
    return flags;
  }
  function flagsReincidencia(m, historico, janelaDias = 30) {
    const flags = /* @__PURE__ */ new Set();
    const data = String(m.data_hora_infracao || "").slice(0, 10);
    if (!ehIso(data)) return [];
    for (const h of historico) {
      if (h.multa_id && h.multa_id === m.multa_id) continue;
      const dh = String(h.data_hora_infracao || "").slice(0, 10);
      if (!ehIso(dh)) continue;
      const d = diasEntre(dh, data);
      if (d < 0 || d > janelaDias) continue;
      if (m.placa_norm && h.placa_norm === m.placa_norm) flags.add("REINCIDENCIA_PLACA");
      if (m.motorista_id && h.motorista_id === m.motorista_id) flags.add("REINCIDENCIA_MOTORISTA");
      if (m.locatario_id && h.locatario_id === m.locatario_id) flags.add("REINCIDENCIA_LOCATARIO");
    }
    return [...flags];
  }

  // core/ids.js
  var ids_exports = {};
  __export(ids_exports, {
    PREFIXOS: () => PREFIXOS,
    formatarId: () => formatarId,
    obrigacaoId: () => obrigacaoId,
    proximoId: () => proximoId
  });
  function formatarId(prefixo, numero, largura) {
    return prefixo + String(numero).padStart(largura, "0");
  }
  function proximoId(prefixo, idsExistentes, largura = 4) {
    let maior = 0;
    const re = new RegExp("^" + prefixo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\d+)$");
    for (const id of idsExistentes) {
      const m = re.exec(String(id || ""));
      if (m) maior = Math.max(maior, Number(m[1]));
    }
    return formatarId(prefixo, maior + 1, largura);
  }
  function obrigacaoId(exercicio, tributo, veiculoId, parcela) {
    return `${exercicio}-${tributo}-${veiculoId}-${parcela}`;
  }
  var PREFIXOS = {
    VEICULOS: { prefixo: "V", largura: 4 },
    LOCATARIOS: { prefixo: "LT", largura: 4 },
    LOCACOES: { prefixo: "LC", largura: 5 },
    MULTAS: { prefixo: "M", largura: 6 },
    MOTORISTAS: { prefixo: "MT", largura: 4 },
    DESCONTOS_FOLHA: { prefixo: "DF", largura: 6 }
  };

  // core/schema.js
  var schema_exports = {};
  __export(schema_exports, {
    COLUNAS_CONTROLE: () => COLUNAS_CONTROLE,
    ENUMS: () => ENUMS,
    TABELAS: () => TABELAS,
    TIPOS: () => TIPOS,
    TIPOS_TEXTO_PURO: () => TIPOS_TEXTO_PURO,
    UFS: () => UFS,
    assinaturaTabela: () => assinaturaTabela,
    hashTexto: () => hashTexto,
    nomesColunas: () => nomesColunas,
    tabela: () => tabela,
    tabelaDeAuditoria: () => tabelaDeAuditoria,
    tabelasDaPlanilha: () => tabelasDaPlanilha,
    validarEsquema: () => validarEsquema
  });
  var UFS = [
    "AC",
    "AL",
    "AM",
    "AP",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MG",
    "MS",
    "MT",
    "PA",
    "PB",
    "PE",
    "PI",
    "PR",
    "RJ",
    "RN",
    "RO",
    "RR",
    "RS",
    "SC",
    "SE",
    "SP",
    "TO"
  ];
  var ENUMS = {
    SN: ["S", "N"],
    UF: UFS,
    PERFIL: ["ADMIN", "FINANCEIRO", "DP", "CONSULTA"],
    TIPO_CONFIG: ["TEXTO", "NUMERO", "SN", "EMAILS", "ID_DRIVE", "URL", "JSON"],
    TIPO_VEICULO: ["CAVALO", "CARRETA", "BITREM", "TRUCK", "TOCO", "AUTOMOVEL", "VAN", "UTILITARIO", "CARRETINHA"],
    CATEGORIA_VEICULO: ["TRACAO", "IMPLEMENTO", "LEVE"],
    SITUACAO_VEICULO: ["OPERACAO_PROPRIA", "LOCADO_TERCEIRO", "PARADO", "A_VENDA", "VENDIDO", "BAIXADO", "EM_TRANSFERENCIA", "HISTORICO"],
    FORMA_PGTO_IPVA: ["COTA_UNICA", "PARCELADO"],
    TRIBUTO: ["IPVA", "LICENCIAMENTO", "OUTRO"],
    GRUPO_VEICULO: ["TODOS", "CAMINHAO", "IMPLEMENTO", "AUTOMOVEL", "UTILITARIO"],
    FINAL_PLACA: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "*"],
    PARCELA: ["U", "1", "2", "3", "4", "5"],
    ORIGEM_VENAL: ["GUIA", "CSV_SEFAZ", "MANUAL", "PROJECAO"],
    FORMA_OBRIGACAO: ["COTA_UNICA", "PARCELADO", "ISENTO", "NAO_APLICA"],
    STATUS_OBRIGACAO: ["PREVISTO", "GUIA_DISPONIVEL", "LANCADO_ERP", "PAGO", "PAGO_SEM_LANCAMENTO", "ISENTO", "NAO_APLICA", "CANCELADO", "BLOQUEADO"],
    SITUACAO_PRAZO: ["EM_DIA", "VENCE_EM_7_DIAS", "VENCE_HOJE", "VENCIDO"],
    RESPONSAVEL_PGTO: ["GOBOR", "LOCATARIO"],
    REPASSE_STATUS: ["NAO_APLICA", "A_COBRAR", "COBRADO", "RECEBIDO"],
    ORIGEM_REGISTRO: ["CARGA_INICIAL", "GERADO", "PDF", "CSV", "MANUAL", "MIGRACAO"],
    GRAVIDADE: ["LEVE", "MEDIA", "GRAVE", "GRAVISSIMA"],
    RESPONSAVEL_INFRACAO: ["CONDUTOR", "PROPRIETARIO", "EMBARCADOR", "TRANSPORTADOR"],
    FASE_MULTA: ["AUTUACAO", "PENALIDADE", "NIC"],
    RESPONSAVEL_MULTA: ["OPERACAO_PROPRIA", "LOCATARIO"],
    COMO_IDENTIFICADO: ["ESCALA", "RASTREADOR", "TACOGRAFO", "DECLARACAO", "OUTRO"],
    DECISAO_CONDUTOR: ["PENDENTE", "INDICAR", "NAO_INDICAR_PAGAR_NIC", "LOCATARIO_INDICA", "NAO_APLICA"],
    INDICACAO_STATUS: ["NAO_APLICA", "AGUARDANDO_ASSINATURA", "ENVIADA", "CONFIRMADA", "RECUSADA"],
    CUSTO_ASSUMIDO_POR: ["MOTORISTA", "EMPRESA", "LOCATARIO", "DIVIDIDO"],
    FORMA_RESSARCIMENTO: ["DESCONTO_FOLHA_A_VISTA", "DESCONTO_FOLHA_PARCELADO", "PAGAMENTO_DIRETO", "EMPRESA_ASSUME", "LOCATARIO_REEMBOLSA"],
    DEFESA_STATUS: ["NAO", "DEFESA_PREVIA", "RECURSO_JARI", "RECURSO_CETRAN"],
    RESULTADO_DEFESA: ["PENDENTE", "DEFERIDO", "INDEFERIDO"],
    PGTO_STATUS: ["PENDENTE", "PAGO", "NAO_PAGAR"],
    PAGO_VIA: ["BOLETO", "LICENCIAMENTO"],
    REEMBOLSO_STATUS: ["NAO_APLICA", "A_COBRAR", "COBRADO", "RECEBIDO", "PERDIDO"],
    STATUS_GERAL_MULTA: ["NOVA", "IDENTIFICAR_MOTORISTA", "DECIDIR_INDICACAO", "AGUARDANDO_PAGAMENTO", "EM_DEFESA", "PAGA", "A_RESSARCIR", "ENCERRADA", "CANCELADA", "DEFERIDA"],
    PRAZO_MULTA: ["EM_DIA", "URGENTE", "VENCIDA"],
    SITUACAO_MOTORISTA: ["ATIVO", "AFASTADO", "DESLIGADO"],
    CNH_CATEGORIA: ["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"],
    STATUS_DESCONTO: ["PROGRAMADO", "ENVIADO_DP", "DESCONTADO", "NAO_DESCONTADO", "CANCELADO", "A_DESCONTAR_NA_RESCISAO"],
    TIPO_DOCUMENTO: ["MULTA_NA", "MULTA_NP", "NIC", "GUIA_IPVA", "GUIA_LICENCIAMENTO", "COMPROVANTE_PAGAMENTO", "CRLV", "EXTRATO_DEBITOS", "OUTRO"],
    ENTIDADE_DOC: ["MULTA", "OBRIGACAO", "VEICULO", "MOTORISTA"],
    STATUS_DOCUMENTO: ["PROCESSADO", "REVISAO", "ERRO", "DUPLICADO", "IGNORADO"],
    ORIGEM_ACAO: ["WEBAPP", "MENU", "GATILHO", "SCRIPT", "IMPORTACAO"],
    STATUS_EXECUCAO: ["EM_ANDAMENTO", "OK", "PARCIAL", "ERRO"]
  };
  var TIPOS = [
    "id",
    "texto",
    "texto_longo",
    "inteiro",
    "numero",
    "moeda",
    "pct",
    "data",
    "datahora",
    "enum",
    "sn",
    "json",
    "email",
    "emails",
    "placa",
    "renavam",
    "cnpj",
    "cpf",
    "documento",
    "competencia",
    "lista"
  ];
  var TIPOS_TEXTO_PURO = ["id", "renavam", "cnpj", "cpf", "documento", "placa", "competencia", "texto", "lista", "enum"];
  var COLUNAS_CONTROLE = ["criado_em", "atualizado_em", "atualizado_por"];
  function c(nome, tipo, opts = {}) {
    return { nome, tipo, ...opts };
  }
  var ob = { obrigatorio: true };
  var calc = { calculada: true };
  function controle() {
    return [
      c("criado_em", "datahora", { calculada: true, descricao: "Preenchido pelo sistema" }),
      c("atualizado_em", "datahora", { calculada: true, descricao: "Preenchido pelo sistema" }),
      c("atualizado_por", "email", { calculada: true, descricao: "E-mail de quem fez a \u00faltima altera\u00e7\u00e3o" })
    ];
  }
  function t(def) {
    const colunas = def.transacional === false ? def.colunas : [...def.colunas, ...controle()];
    return { planilha: "BASE", sistema: false, transacional: true, ...def, colunas, chave: [].concat(def.chave || []) };
  }
  var AUDITORIA_COLUNAS = [
    c("quando", "datahora", ob),
    c("quem", "email", ob),
    c("origem", "enum", { enum: "ORIGEM_ACAO" }),
    c("acao", "texto", ob),
    c("entidade", "texto", ob),
    c("entidade_id", "texto"),
    c("antes_json", "json"),
    c("depois_json", "json"),
    c("detalhe", "texto_longo")
  ];
  var TABELAS = [
    t({
      nome: "VEICULOS",
      chave: "veiculo_id",
      descricao: "Cadastro mestre de ve\u00edculos (fonte \u00fanica da verdade)",
      colunas: [
        c("veiculo_id", "id", { ...ob, descricao: "Chave interna (V0001). Nunca muda" }),
        c("renavam", "renavam", { descricao: "11 d\u00edgitos com zeros \u00e0 esquerda. \u00danico e obrigat\u00f3rio para ve\u00edculos ativos" }),
        c("placa", "placa", { ...ob, descricao: "Como est\u00e1 no CRLV atual" }),
        c("placa_norm", "placa", { ...calc, descricao: "Forma can\u00f4nica (Mercosul convertido para d\u00edgito). \u00danica entre os ativos" }),
        c("chassi", "texto"),
        c("tipo", "enum", { ...ob, enum: "TIPO_VEICULO" }),
        c("categoria", "enum", { ...calc, enum: "CATEGORIA_VEICULO", descricao: "Derivada do tipo" }),
        c("marca_modelo", "texto"),
        c("ano_fabricacao", "inteiro"),
        c("ano_modelo", "inteiro"),
        c("cnpj_proprietario", "cnpj", { fk: "FILIAIS.cnpj" }),
        c("uf_registro", "enum", { ...ob, enum: "UF" }),
        c("municipio_registro", "texto"),
        c("situacao", "enum", { ...ob, enum: "SITUACAO_VEICULO" }),
        c("data_aquisicao", "data"),
        c("data_venda", "data"),
        c("isento_ipva", "sn"),
        c("motivo_isencao", "texto"),
        c("forma_pgto_ipva_padrao", "enum", { enum: "FORMA_PGTO_IPVA" }),
        c("pasta_drive_id", "id"),
        c("observacoes", "texto_longo")
      ]
    }),
    t({
      nome: "OBRIGACOES",
      chave: "obrigacao_id",
      descricao: "Uma linha por ve\u00edculo \u00d7 exerc\u00edcio \u00d7 tributo \u00d7 parcela",
      colunas: [
        c("obrigacao_id", "id", { ...ob, descricao: "Ex.: 2027-IPVA-V0001-U" }),
        c("exercicio", "inteiro", ob),
        c("tributo", "enum", { ...ob, enum: "TRIBUTO" }),
        c("descricao_outro", "texto", { descricao: "Para tributo = OUTRO (tac\u00f3grafo, RNTRC, seguro, AET\u2026)" }),
        c("veiculo_id", "id", { ...ob, fk: "VEICULOS.veiculo_id" }),
        c("placa", "placa", { descricao: "Retrato no momento da gera\u00e7\u00e3o" }),
        c("uf", "enum", { enum: "UF", descricao: "Retrato no momento da gera\u00e7\u00e3o" }),
        c("cnpj", "cnpj", { descricao: "Retrato no momento da gera\u00e7\u00e3o" }),
        c("forma", "enum", { enum: "FORMA_OBRIGACAO" }),
        c("parcela", "enum", { ...ob, enum: "PARCELA" }),
        c("vencimento", "data"),
        c("valor_estimado", "moeda", { descricao: "Camada 1: or\u00e7amento" }),
        c("base_estimativa", "texto", { descricao: "Ex.: venal 180.000 \u00d7 1% \u2212 desc. 3%" }),
        c("valor_guia", "moeda", { descricao: "Camada 2: devido" }),
        c("linha_digitavel", "texto"),
        c("valor_pago", "moeda", { descricao: "Camada 3: realizado. Obrigat\u00f3rio para marcar como pago" }),
        c("data_pagamento", "data"),
        c("encargos", "moeda", { descricao: "Juros + multa por atraso" }),
        c("desconto_obtido", "moeda"),
        c("base_calculo", "moeda", { descricao: "Valor venal informado na guia" }),
        c("aliquota_aplicada", "pct"),
        c("nr_lancamento_erp", "texto", { descricao: 'Formato "MTO 421779"' }),
        c("data_lancamento_erp", "data"),
        c("status", "enum", { ...ob, enum: "STATUS_OBRIGACAO" }),
        c("situacao_prazo", "enum", { ...calc, enum: "SITUACAO_PRAZO" }),
        c("responsavel_pgto", "enum", { enum: "RESPONSAVEL_PGTO" }),
        c("repasse_status", "enum", { enum: "REPASSE_STATUS" }),
        c("repasse_valor", "moeda"),
        c("repasse_data", "data"),
        c("crlv_emitido", "sn"),
        c("data_crlv", "data"),
        c("multas_quitadas_junto", "moeda"),
        c("bloqueio_motivo", "texto"),
        c("doc_guia_id", "id"),
        c("doc_comprovante_id", "id"),
        c("origem", "enum", { enum: "ORIGEM_REGISTRO" }),
        c("observacoes", "texto_longo")
      ]
    }),
    t({
      nome: "MULTAS",
      chave: "multa_id",
      descricao: "Multas da frota inteira (opera\u00e7\u00e3o pr\u00f3pria e locados)",
      colunas: [
        c("multa_id", "id", ob),
        c("chave_dedupe", "texto", { ...calc, descricao: "\u00d3RG\u00c3O|AIT normalizados" }),
        c("orgao_sigla", "texto", ob),
        c("orgao_nome", "texto"),
        c("orgao_codigo", "texto"),
        c("nr_ait", "texto", ob),
        c("nr_notificacao", "texto"),
        c("veiculo_id", "id", { fk: "VEICULOS.veiculo_id" }),
        c("placa_documento", "texto", { descricao: "Como veio no documento" }),
        c("placa_norm", "placa", calc),
        c("data_hora_infracao", "datahora"),
        c("uf_infracao", "enum", { enum: "UF" }),
        c("municipio", "texto"),
        c("local", "texto"),
        c("cod_infracao", "texto", { descricao: "Ex.: 745-5" }),
        c("desdobramento", "texto"),
        c("descricao", "texto_longo"),
        c("amparo_legal", "texto"),
        c("gravidade", "enum", { enum: "GRAVIDADE" }),
        c("fator_multiplicador", "numero"),
        c("pontos", "inteiro"),
        c("vel_permitida", "numero"),
        c("vel_medida", "numero"),
        c("vel_considerada", "numero"),
        c("responsavel_infracao", "enum", { enum: "RESPONSAVEL_INFRACAO" }),
        c("suspensao_cnh", "sn", { descricao: "Quando o documento indicar" }),
        c("fase", "enum", { ...ob, enum: "FASE_MULTA" }),
        c("data_expedicao", "data", { descricao: "Expedi\u00e7\u00e3o da notifica\u00e7\u00e3o de autua\u00e7\u00e3o" }),
        c("data_expedicao_penalidade", "data", { descricao: "Expedi\u00e7\u00e3o da notifica\u00e7\u00e3o de penalidade" }),
        c("ait_origem", "texto", { descricao: "Para NIC: AIT da infra\u00e7\u00e3o original" }),
        c("condutor_no_documento", "texto"),
        c("valor_original", "moeda"),
        c("valor_com_desconto", "moeda", { descricao: "Como informado no documento" }),
        c("valor_desconto_sne", "moeda", { descricao: "Como informado no documento" }),
        c("vencimento_pgto", "data"),
        c("linha_digitavel", "texto"),
        c("prazo_defesa_previa", "data"),
        c("prazo_indicacao_condutor", "data"),
        c("prazo_recurso", "data"),
        c("responsavel", "enum", { ...calc, enum: "RESPONSAVEL_MULTA", descricao: "Pela loca\u00e7\u00e3o vigente na data da infra\u00e7\u00e3o" }),
        c("locatario_id", "id", { fk: "LOCATARIOS.locatario_id" }),
        c("motorista_id", "id", { descricao: "Infrator (dados pessoais s\u00f3 na planilha restrita)" }),
        c("como_identificado", "enum", { enum: "COMO_IDENTIFICADO" }),
        c("decisao_condutor", "enum", { enum: "DECISAO_CONDUTOR" }),
        c("decidido_por", "email"),
        c("data_decisao", "data"),
        c("motivo_decisao", "texto_longo"),
        c("indicacao_status", "enum", { enum: "INDICACAO_STATUS" }),
        c("data_indicacao", "data"),
        c("protocolo_indicacao", "texto"),
        c("pontos_no_motorista", "sn"),
        c("custo_nic_estimado", "moeda"),
        c("custo_assumido_por", "enum", { enum: "CUSTO_ASSUMIDO_POR" }),
        c("pct_motorista", "pct"),
        c("inclui_nic_no_desconto", "sn"),
        c("forma_ressarcimento", "enum", { enum: "FORMA_RESSARCIMENTO" }),
        c("n_parcelas", "inteiro"),
        c("valor_a_ressarcir", "moeda"),
        c("valor_ressarcido", "moeda", calc),
        c("doc_autorizacao_id", "id"),
        c("defesa_status", "enum", { enum: "DEFESA_STATUS" }),
        c("protocolo", "texto"),
        c("resultado", "enum", { enum: "RESULTADO_DEFESA" }),
        c("pgto_status", "enum", { enum: "PGTO_STATUS" }),
        c("data_pgto", "data"),
        c("valor_pago", "moeda"),
        c("desconto_aproveitado", "moeda"),
        c("pago_via", "enum", { enum: "PAGO_VIA" }),
        c("obrigacao_licenciamento_id", "id", { fk: "OBRIGACOES.obrigacao_id", descricao: "Quando paga junto com o licenciamento" }),
        c("nr_lancamento_erp", "texto"),
        c("reembolso_status", "enum", { enum: "REEMBOLSO_STATUS" }),
        c("reembolso_valor", "moeda"),
        c("data_cobranca", "data"),
        c("data_recebimento", "data"),
        c("status_geral", "enum", { ...calc, enum: "STATUS_GERAL_MULTA" }),
        c("prazo_situacao", "enum", { ...calc, enum: "PRAZO_MULTA" }),
        c("flags", "lista", calc),
        c("doc_ids", "lista"),
        c("confianca_extracao", "numero"),
        c("origem", "enum", { enum: "ORIGEM_REGISTRO" }),
        c("observacoes", "texto_longo")
      ]
    }),
    t({
      nome: "FILIAIS",
      chave: "cnpj",
      descricao: "CNPJs da Gobor (matriz e filiais)",
      colunas: [
        c("cnpj", "cnpj", ob),
        c("nome_curto", "texto", ob),
        c("razao_social", "texto"),
        c("uf", "enum", { ...ob, enum: "UF" }),
        c("municipio", "texto"),
        c("ativo", "sn", ob),
        c("observacoes", "texto_longo")
      ]
    }),
    t({
      nome: "LOCATARIOS",
      chave: "locatario_id",
      descricao: "Clientes que alugam ve\u00edculos da Gobor",
      colunas: [
        c("locatario_id", "id", ob),
        c("nome", "texto", ob),
        c("cnpj_cpf", "documento"),
        c("contato", "texto"),
        c("email", "emails"),
        c("telefone", "texto"),
        c("ativo", "sn"),
        c("observacoes", "texto_longo"),
        c("ref_painel", "texto", { descricao: 'Id do locat\u00e1rio no painel "Loca\u00e7\u00e3o de Carretas Gobor" (decis\u00e3o N9)' })
      ]
    }),
    t({
      nome: "LOCACOES",
      chave: "locacao_id",
      descricao: "Vig\u00eancia ve\u00edculo \u2194 locat\u00e1rio (fim vazio = vigente)",
      colunas: [
        c("locacao_id", "id", ob),
        c("veiculo_id", "id", { ...ob, fk: "VEICULOS.veiculo_id" }),
        c("locatario_id", "id", { ...ob, fk: "LOCATARIOS.locatario_id" }),
        c("inicio", "data", ob),
        c("fim", "data"),
        c("contrato_ref", "texto"),
        c("repassa_multas", "sn", { descricao: "Padr\u00e3o S" }),
        c("repassa_licenciamento", "sn"),
        c("repassa_ipva", "sn"),
        c("observacoes", "texto_longo"),
        c("ref_painel", "texto", { descricao: 'Contrato#item no painel "Loca\u00e7\u00e3o de Carretas Gobor" (decis\u00e3o N9)' })
      ]
    }),
    t({
      nome: "CALENDARIO_VENCIMENTOS",
      chave: ["exercicio", "uf", "tributo", "grupo_veiculo", "final_placa", "parcela"],
      descricao: "Vencimentos oficiais por exerc\u00edcio, UF, grupo e final de placa (sempre com fonte)",
      colunas: [
        c("exercicio", "inteiro", ob),
        c("uf", "enum", { ...ob, enum: "UF" }),
        c("tributo", "enum", { ...ob, enum: "TRIBUTO" }),
        c("grupo_veiculo", "enum", { ...ob, enum: "GRUPO_VEICULO" }),
        c("final_placa", "enum", { ...ob, enum: "FINAL_PLACA" }),
        c("parcela", "enum", { ...ob, enum: "PARCELA" }),
        c("vencimento", "data", ob),
        c("desconto_pct", "pct"),
        c("provisorio", "sn", { descricao: "S = projetado do calend\u00e1rio oficial do ano anterior (decis\u00e3o D-10)" }),
        c("fonte", "texto", { ...ob, descricao: "Norma ou p\u00e1gina oficial (link)" }),
        c("observacoes", "texto_longo")
      ]
    }),
    t({
      nome: "ALIQUOTAS_IPVA",
      chave: ["exercicio", "uf", "tipo_ou_categoria"],
      descricao: "Se o tipo paga IPVA na UF e com qual al\u00edquota (sempre com fonte)",
      colunas: [
        c("exercicio", "inteiro", ob),
        c("uf", "enum", { ...ob, enum: "UF" }),
        c("tipo_ou_categoria", "texto", { ...ob, descricao: "Um TIPO_VEICULO, uma CATEGORIA_VEICULO ou um GRUPO_VEICULO" }),
        c("tributado", "sn", ob),
        c("aliquota_pct", "pct", { descricao: "Em pontos percentuais: 1,9 = 1,9%" }),
        c("fonte", "texto", ob),
        c("observacoes", "texto_longo")
      ]
    }),
    t({
      nome: "TAXAS_LICENCIAMENTO",
      chave: ["exercicio", "uf", "grupo_veiculo"],
      descricao: "Taxa anual de licenciamento do DETRAN de cada UF (sempre com fonte)",
      colunas: [
        c("exercicio", "inteiro", ob),
        c("uf", "enum", { ...ob, enum: "UF" }),
        c("grupo_veiculo", "enum", { ...ob, enum: "GRUPO_VEICULO" }),
        c("valor", "moeda", ob),
        c("fonte", "texto", ob),
        c("observacoes", "texto_longo")
      ]
    }),
    t({
      nome: "VALORES_VENAIS",
      chave: ["veiculo_id", "exercicio"],
      descricao: "Valor venal por ve\u00edculo e exerc\u00edcio, com a origem do dado",
      colunas: [
        c("veiculo_id", "id", { ...ob, fk: "VEICULOS.veiculo_id" }),
        c("exercicio", "inteiro", ob),
        c("valor_venal", "moeda", ob),
        c("origem", "enum", { ...ob, enum: "ORIGEM_VENAL" }),
        c("fonte", "texto"),
        c("observacoes", "texto_longo")
      ]
    }),
    t({
      nome: "DOCUMENTOS",
      chave: "doc_id",
      sistema: true,
      descricao: "Todo arquivo que entrou pela pasta de Entrada",
      colunas: [
        c("doc_id", "id", { ...ob, descricao: "fileId do Drive" }),
        c("nome_original", "texto"),
        c("nome_padronizado", "texto"),
        c("md5", "texto"),
        c("mime", "texto"),
        c("paginas", "inteiro"),
        c("tipo_documento", "enum", { enum: "TIPO_DOCUMENTO" }),
        c("placa_extraida", "texto"),
        c("renavam_extraido", "texto"),
        c("entidade", "enum", { enum: "ENTIDADE_DOC" }),
        c("entidade_id", "texto"),
        c("confianca", "numero"),
        c("status", "enum", { enum: "STATUS_DOCUMENTO" }),
        c("motivo_revisao", "texto_longo"),
        c("json_extraido_id", "id"),
        c("modelo", "texto"),
        c("tokens_entrada", "inteiro"),
        c("tokens_saida", "inteiro"),
        c("custo_estimado_usd", "numero"),
        c("processado_em", "datahora"),
        c("erro", "texto_longo")
      ]
    }),
    t({
      nome: "USUARIOS",
      chave: "email",
      descricao: "Quem acessa o painel e com qual perfil",
      colunas: [
        c("email", "email", ob),
        c("nome", "texto"),
        c("perfil", "enum", { ...ob, enum: "PERFIL" }),
        c("ativo", "sn", ob),
        c("observacoes", "texto_longo")
      ]
    }),
    t({
      nome: "CONFIG",
      chave: "chave",
      descricao: "Par\u00e2metros do sistema (chave/valor)",
      colunas: [
        c("chave", "texto", ob),
        c("valor", "texto"),
        c("tipo", "enum", { enum: "TIPO_CONFIG" }),
        c("descricao", "texto_longo")
      ]
    }),
    t({
      nome: "AUDITORIA",
      transacional: false,
      sistema: true,
      descricao: "Quem, quando e o que mudou (antes/depois)",
      colunas: AUDITORIA_COLUNAS
    }),
    t({
      nome: "LOG_EXECUCAO",
      chave: "execucao_id",
      transacional: false,
      sistema: true,
      descricao: "Execu\u00e7\u00f5es de rotinas e gatilhos",
      colunas: [
        c("execucao_id", "id", ob),
        c("rotina", "texto", ob),
        c("inicio", "datahora", ob),
        c("fim", "datahora"),
        c("duracao_seg", "numero"),
        c("status", "enum", { enum: "STATUS_EXECUCAO" }),
        c("contagens_json", "json"),
        c("erro", "texto_longo"),
        c("usuario", "email")
      ]
    }),
    t({
      nome: "SNAPSHOT_KPI",
      chave: ["data", "kpi", "dimensao"],
      transacional: false,
      sistema: true,
      descricao: "Foto di\u00e1ria dos indicadores (para gr\u00e1ficos de tend\u00eancia)",
      colunas: [
        c("data", "data", ob),
        c("kpi", "texto", ob),
        c("dimensao", "texto", { descricao: "Ex.: TOTAL, UF=PR, FILIAL=Matriz" }),
        c("valor", "numero"),
        c("observacao", "texto")
      ]
    }),
    // ---- Planilha restrita (D-15) ----
    t({
      nome: "MOTORISTAS",
      planilha: "MOTORISTAS",
      chave: "motorista_id",
      descricao: "Dados pessoais dos motoristas (acesso restrito)",
      colunas: [
        c("motorista_id", "id", ob),
        c("nome", "texto", ob),
        c("cpf", "cpf"),
        c("matricula", "texto"),
        c("filial", "cnpj", { fk: "FILIAIS.cnpj" }),
        c("cnh_numero", "texto"),
        c("cnh_categoria", "enum", { enum: "CNH_CATEGORIA" }),
        c("cnh_validade", "data"),
        c("exerce_atividade_remunerada", "sn", { descricao: "EAR na CNH" }),
        c("situacao", "enum", { ...ob, enum: "SITUACAO_MOTORISTA" }),
        c("data_admissao", "data"),
        c("data_desligamento", "data"),
        c("termo_desconto_assinado", "sn"),
        c("doc_termo_id", "id"),
        c("observacoes", "texto_longo")
      ]
    }),
    t({
      nome: "DESCONTOS_FOLHA",
      planilha: "MOTORISTAS",
      chave: "desconto_id",
      descricao: "Uma linha por parcela de desconto em folha",
      colunas: [
        c("desconto_id", "id", ob),
        c("multa_id", "id", { ...ob, fk: "MULTAS.multa_id" }),
        c("motorista_id", "id", { ...ob, fk: "MOTORISTAS.motorista_id" }),
        c("parcela", "inteiro", ob),
        c("total_parcelas", "inteiro", ob),
        c("competencia", "competencia", ob),
        c("valor", "moeda", ob),
        c("status", "enum", { ...ob, enum: "STATUS_DESCONTO" }),
        c("data_envio_dp", "data"),
        c("data_confirmacao", "data"),
        c("observacoes", "texto_longo")
      ]
    }),
    t({
      nome: "AUDITORIA_RESTRITA",
      planilha: "MOTORISTAS",
      transacional: false,
      sistema: true,
      descricao: "Auditoria das tabelas restritas (os dados pessoais n\u00e3o v\u00e3o para a AUDITORIA da base)",
      colunas: AUDITORIA_COLUNAS
    })
  ];
  var POR_NOME = Object.fromEntries(TABELAS.map((d) => [d.nome, d]));
  function tabela(nome) {
    const def = POR_NOME[nome];
    if (!def) throw new Error(`Tabela desconhecida: ${nome}`);
    return def;
  }
  function nomesColunas(nome) {
    return tabela(nome).colunas.map((col) => col.nome);
  }
  function tabelasDaPlanilha(planilha) {
    return TABELAS.filter((d) => d.planilha === planilha);
  }
  function tabelaDeAuditoria(nome) {
    return tabela(nome).planilha === "MOTORISTAS" ? "AUDITORIA_RESTRITA" : "AUDITORIA";
  }
  function validarEsquema() {
    const erros = [];
    for (const def of TABELAS) {
      const nomes = def.colunas.map((col) => col.nome);
      const dup = nomes.filter((n, i) => nomes.indexOf(n) !== i);
      if (dup.length) erros.push(`${def.nome}: colunas duplicadas ${dup.join(", ")}`);
      for (const k of def.chave) if (!nomes.includes(k)) erros.push(`${def.nome}: chave ${k} n\u00e3o \u00e9 coluna`);
      if (def.transacional) {
        for (const k of COLUNAS_CONTROLE) if (!nomes.includes(k)) erros.push(`${def.nome}: falta ${k}`);
      }
      for (const col of def.colunas) {
        if (!TIPOS.includes(col.tipo)) erros.push(`${def.nome}.${col.nome}: tipo ${col.tipo} desconhecido`);
        if (col.tipo === "enum" && !ENUMS[col.enum]) erros.push(`${def.nome}.${col.nome}: enum ${col.enum} n\u00e3o existe`);
        if (col.tipo !== "enum" && col.enum) erros.push(`${def.nome}.${col.nome}: enum em coluna n\u00e3o-enum`);
        if (col.fk) {
          const [tab, coluna] = col.fk.split(".");
          if (!POR_NOME[tab] || !POR_NOME[tab].colunas.some((x) => x.nome === coluna)) erros.push(`${def.nome}.${col.nome}: fk ${col.fk} inv\u00e1lida`);
        }
        if (!/^[a-z][a-z0-9_]*$/.test(col.nome)) erros.push(`${def.nome}.${col.nome}: nome fora do padr\u00e3o snake_case`);
      }
    }
    return erros;
  }
  function hashTexto(texto) {
    let h = 2166136261;
    const s = String(texto);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h.toString(16).padStart(8, "0");
  }
  function assinaturaTabela(nome, cabecalho = []) {
    const def = tabela(nome);
    return hashTexto(JSON.stringify({
      c: def.colunas.map((x) => [x.nome, x.tipo, x.enum || "", x.enum ? ENUMS[x.enum] : "", !!x.calculada]),
      s: def.sistema,
      h: cabecalho
    }));
  }

  // core/tabela.js
  var tabela_exports = {};
  __export(tabela_exports, {
    chaveRegistro: () => chaveRegistro,
    coerirValor: () => coerirValor,
    diffRegistros: () => diffRegistros,
    linhaParaRegistro: () => linhaParaRegistro,
    mapearCabecalho: () => mapearCabecalho,
    normalizarRegistro: () => normalizarRegistro,
    planoCabecalho: () => planoCabecalho,
    registroParaLinha: () => registroParaLinha,
    validarRegistro: () => validarRegistro,
    valorParaCelula: () => valorParaCelula
  });
  var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function vazio2(v) {
    return v === null || v === void 0 || typeof v === "string" && v.trim() === "";
  }
  function mapearCabecalho(cabecalho) {
    const mapa = {};
    cabecalho.forEach((h, i) => {
      const nome = String(h || "").trim();
      if (!nome) return;
      if (nome in mapa) throw new Error(`Cabe\u00e7alho repetido: ${nome}`);
      mapa[nome] = i;
    });
    return mapa;
  }
  function planoCabecalho(existente, esperado) {
    const atual = existente.map((h) => String(h || "").trim()).filter(Boolean);
    return {
      faltando: esperado.filter((n) => !atual.includes(n)),
      extras: atual.filter((n) => !esperado.includes(n))
    };
  }
  function coerirValor(valor, coluna) {
    if (vazio2(valor)) return null;
    switch (coluna.tipo) {
      case "inteiro":
      case "numero":
      case "pct": {
        if (typeof valor === "number") return valor;
        const n = Number(String(valor).replace(/\s/g, "").replace(",", "."));
        return Number.isFinite(n) ? n : String(valor);
      }
      case "moeda": {
        const n = parseMoeda(valor);
        return n === null ? String(valor) : n;
      }
      case "enum":
      case "sn":
        return String(valor).trim().toUpperCase();
      case "renavam":
        return normalizarRenavam(valor) || String(valor);
      case "placa":
        return limparPlaca(valor);
      case "cnpj":
        return limparCnpj(valor).length === 14 ? formatarCnpj(valor) : String(valor).trim();
      case "cpf":
        return formatarCpf(String(valor).replace(/\D/g, "").padStart(11, "0"));
      case "documento":
        return formatarDocumento(valor);
      case "email":
        return String(valor).trim().toLowerCase();
      case "emails":
        return String(valor).split(/[;,\s]+/).map((e) => e.trim().toLowerCase()).filter(Boolean).join(", ");
      case "lista":
        return Array.isArray(valor) ? valor : String(valor).split(",").map((s) => s.trim()).filter(Boolean);
      case "id":
      case "competencia":
        return String(valor).trim();
      default:
        return typeof valor === "string" ? valor.trim() : valor;
    }
  }
  function linhaParaRegistro(linha, mapa, nomeTabela) {
    const reg = {};
    for (const col of tabela(nomeTabela).colunas) {
      const i = mapa[col.nome];
      reg[col.nome] = i === void 0 ? null : coerirValor(linha[i], col);
    }
    return reg;
  }
  function valorParaCelula(valor, coluna) {
    if (valor === null || valor === void 0) return "";
    if (coluna && coluna.tipo === "lista" && Array.isArray(valor)) return valor.join(", ");
    if (coluna && coluna.tipo === "json" && typeof valor === "object") return JSON.stringify(valor);
    return valor;
  }
  function registroParaLinha(registro, cabecalho, nomeTabela, linhaAtual = null) {
    const cols = Object.fromEntries(tabela(nomeTabela).colunas.map((col) => [col.nome, col]));
    return cabecalho.map((h, i) => {
      const nome = String(h || "").trim();
      if (nome in registro) return valorParaCelula(registro[nome], cols[nome]);
      return linhaAtual ? linhaAtual[i] : "";
    });
  }
  function chaveRegistro(registro, nomeTabela) {
    const def = tabela(nomeTabela);
    if (!def.chave.length) return null;
    const partes = def.chave.map((k) => vazio2(registro[k]) ? "" : String(registro[k]).trim());
    return partes.some((p) => p === "") ? null : partes.join("|");
  }
  function validarRegistro(registro, nomeTabela, opcoes = {}) {
    const def = tabela(nomeTabela);
    const erros = [];
    for (const col of def.colunas) {
      const v = registro[col.nome];
      const rotulo2 = `${col.nome}`;
      if (vazio2(v)) {
        if (col.obrigatorio && !col.calculada && !opcoes.parcial) erros.push(`${rotulo2}: obrigat\u00f3rio`);
        continue;
      }
      switch (col.tipo) {
        case "enum":
          if (!ENUMS[col.enum].includes(String(v))) erros.push(`${rotulo2}: "${v}" n\u00e3o est\u00e1 na lista (${ENUMS[col.enum].join(", ")})`);
          break;
        case "sn":
          if (v !== "S" && v !== "N") erros.push(`${rotulo2}: use S ou N`);
          break;
        case "inteiro":
          if (!Number.isInteger(v)) erros.push(`${rotulo2}: n\u00famero inteiro esperado`);
          break;
        case "numero":
          if (typeof v !== "number" || !Number.isFinite(v)) erros.push(`${rotulo2}: n\u00famero esperado`);
          break;
        case "moeda":
          if (typeof v !== "number" || !Number.isFinite(v)) erros.push(`${rotulo2}: valor em R$ esperado`);
          else if (v < 0) erros.push(`${rotulo2}: n\u00e3o pode ser negativo`);
          break;
        case "pct":
          if (typeof v !== "number" || v < 0 || v > 100) erros.push(`${rotulo2}: percentual entre 0 e 100 esperado`);
          break;
        case "data":
          if (!ehIso(v)) erros.push(`${rotulo2}: data inv\u00e1lida`);
          break;
        case "datahora":
          if (!/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/.test(String(v)) || !ehIso(String(v).slice(0, 10))) erros.push(`${rotulo2}: data/hora inv\u00e1lida`);
          break;
        case "renavam":
          if (!renavamValido(v)) erros.push(`${rotulo2}: RENAVAM inv\u00e1lido (${v})`);
          break;
        case "placa":
          if (!placaValida(v)) erros.push(`${rotulo2}: placa inv\u00e1lida (${v})`);
          break;
        case "cnpj":
          if (!cnpjValido(v)) erros.push(`${rotulo2}: CNPJ inv\u00e1lido (${v})`);
          break;
        case "cpf":
          if (!cpfValido(v)) erros.push(`${rotulo2}: CPF inv\u00e1lido`);
          break;
        case "documento":
          if (!documentoValido(v)) erros.push(`${rotulo2}: CNPJ/CPF inv\u00e1lido (${v})`);
          break;
        case "email":
          if (!RE_EMAIL.test(String(v))) erros.push(`${rotulo2}: e-mail inv\u00e1lido (${v})`);
          break;
        case "emails":
          for (const e of String(v).split(/[;,\s]+/).filter(Boolean)) if (!RE_EMAIL.test(e)) erros.push(`${rotulo2}: e-mail inv\u00e1lido (${e})`);
          break;
        case "competencia":
          if (!ehCompetencia(v)) erros.push(`${rotulo2}: use AAAA-MM`);
          break;
        case "json":
          if (typeof v === "string") {
            try {
              JSON.parse(v);
            } catch (e) {
              erros.push(`${rotulo2}: JSON inv\u00e1lido`);
            }
          }
          break;
        default:
          break;
      }
    }
    return erros;
  }
  function diffRegistros(antes, depois) {
    const ignorar = /* @__PURE__ */ new Set(["criado_em", "atualizado_em", "atualizado_por"]);
    const norm = (v) => vazio2(v) ? null : Array.isArray(v) ? v.join(", ") : v;
    const mudancas = {};
    const campos = /* @__PURE__ */ new Set([...Object.keys(antes || {}), ...Object.keys(depois || {})]);
    for (const k of campos) {
      if (ignorar.has(k)) continue;
      const a = norm((antes || {})[k]), d = norm((depois || {})[k]);
      if (a !== d) mudancas[k] = { antes: a, depois: d };
    }
    return mudancas;
  }
  function normalizarRegistro(registro, nomeTabela) {
    const cols = Object.fromEntries(tabela(nomeTabela).colunas.map((col) => [col.nome, col]));
    const saida = {};
    for (const [k, v] of Object.entries(registro)) saida[k] = cols[k] ? coerirValor(v, cols[k]) : v;
    return saida;
  }

  // core/veiculos.js
  var veiculos_exports = {};
  __export(veiculos_exports, {
    CATEGORIA_POR_TIPO: () => CATEGORIA_POR_TIPO,
    SITUACOES_INATIVAS: () => SITUACOES_INATIVAS,
    categoriaDoTipo: () => categoriaDoTipo,
    completarVeiculo: () => completarVeiculo,
    normalizarTipoVeiculo: () => normalizarTipoVeiculo,
    validarVeiculo: () => validarVeiculo,
    veiculoAtivo: () => veiculoAtivo
  });
  var CATEGORIA_POR_TIPO = {
    CAVALO: "TRACAO",
    TRUCK: "TRACAO",
    TOCO: "TRACAO",
    CARRETA: "IMPLEMENTO",
    BITREM: "IMPLEMENTO",
    CARRETINHA: "IMPLEMENTO",
    AUTOMOVEL: "LEVE",
    VAN: "LEVE",
    UTILITARIO: "LEVE"
  };
  var SITUACOES_INATIVAS = ["VENDIDO", "BAIXADO", "HISTORICO"];
  var SINONIMOS = {
    "BI TREM": "BITREM",
    "BI-TREM": "BITREM",
    BITREM: "BITREM",
    "CAVALO MECANICO": "CAVALO",
    CAVALO: "CAVALO",
    SEMIRREBOQUE: "CARRETA",
    "SEMI REBOQUE": "CARRETA",
    CARRETA: "CARRETA",
    CAMINHONETE: "UTILITARIO",
    PICAPE: "UTILITARIO",
    PICKUP: "UTILITARIO"
  };
  var MODELOS_CONHECIDOS = { SAVEIRO: "UTILITARIO", STRADA: "UTILITARIO", MONTANA: "UTILITARIO" };
  function categoriaDoTipo(tipo) {
    return CATEGORIA_POR_TIPO[tipo] || null;
  }
  function normalizarTipoVeiculo(valor) {
    if (valor === null || valor === void 0 || valor instanceof Date || typeof valor === "number") {
      return { tipo: null, confirmar: true, motivo: valor === null || valor === void 0 || valor === "" ? "Tipo vazio" : `Valor n\u00e3o \u00e9 um tipo: ${valor}` };
    }
    const s = String(valor).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
    if (!s) return { tipo: null, confirmar: true, motivo: "Tipo vazio" };
    if (ENUMS.TIPO_VEICULO.includes(s)) return { tipo: s, confirmar: false, motivo: null };
    if (SINONIMOS[s]) return { tipo: SINONIMOS[s], confirmar: false, motivo: `Grafia "${valor}" padronizada` };
    if (MODELOS_CONHECIDOS[s]) return { tipo: MODELOS_CONHECIDOS[s], confirmar: true, motivo: `"${valor}" \u00e9 modelo, n\u00e3o tipo; sugerido ${MODELOS_CONHECIDOS[s]}` };
    return { tipo: null, confirmar: true, motivo: `Tipo desconhecido: "${valor}"` };
  }
  function veiculoAtivo(v) {
    return !SITUACOES_INATIVAS.includes(v.situacao);
  }
  function validarVeiculo(v, outros = []) {
    const erros = [], avisos = [];
    const norm = normalizarPlaca(v.placa);
    const ativo = veiculoAtivo(v);
    if (ativo && !v.renavam) erros.push("RENAVAM \u00e9 obrigat\u00f3rio para ve\u00edculo ativo");
    if (v.renavam && !renavamValido(v.renavam)) erros.push(`RENAVAM inv\u00e1lido: ${v.renavam}`);
    if (ativo && !v.cnpj_proprietario) erros.push("CNPJ/filial \u00e9 obrigat\u00f3rio para ve\u00edculo ativo");
    if (v.situacao === "VENDIDO" && !v.data_venda) erros.push("Informe a data da venda");
    if (v.isento_ipva === "S" && !String(v.motivo_isencao || "").trim()) avisos.push("Isento de IPVA sem motivo informado");
    for (const o of outros) {
      if (o.veiculo_id && o.veiculo_id === v.veiculo_id) continue;
      if (v.renavam && o.renavam === v.renavam) {
        (veiculoAtivo(o) ? erros : avisos).push(`RENAVAM ${v.renavam} j\u00e1 pertence a ${o.veiculo_id} (${o.placa}, ${o.situacao})`);
      }
      if (norm && normalizarPlaca(o.placa) === norm) {
        if (ativo && veiculoAtivo(o)) erros.push(`Placa ${v.placa} equivale a ${o.placa} (${o.veiculo_id}), j\u00e1 ativa`);
        else avisos.push(`Placa ${v.placa} equivale a ${o.placa} (${o.veiculo_id}, ${o.situacao}). Reativar?`);
      }
    }
    return { erros, avisos };
  }
  function completarVeiculo(v) {
    return { ...v, placa_norm: normalizarPlaca(v.placa), categoria: categoriaDoTipo(v.tipo) };
  }

  // core/config-padrao.js
  var config_padrao_exports = {};
  __export(config_padrao_exports, {
    CONFIG_PADRAO: () => CONFIG_PADRAO,
    configPadraoComoObjeto: () => configPadraoComoObjeto
  });
  var CONFIG_PADRAO = [
    // Geral
    ["NOME_EMPRESA", "Transportadora Gobor", "TEXTO", "Nome exibido no painel e nos e-mails"],
    ["URL_WEBAPP", "", "URL", "Endere\u00e7o do painel (preencher depois de implantar o Web App)"],
    ["PLANILHA_MOTORISTAS_ID", "", "ID_DRIVE", "Planilha restrita de motoristas (criada pelo setup)"],
    ["PASTA_RESTRITA_ID", "", "ID_DRIVE", "Pasta de acesso restrito (ADMIN/DP) para a planilha de motoristas e a pasta Motoristas/. Vazio = Meu Drive de quem roda o setup"],
    // Pastas do Drive (criadas pelo setup)
    ["PASTA_RAIZ_ID", "", "ID_DRIVE", "\ud83d\ude9b Frota Gobor \u2014 Documentos"],
    ["PASTA_ENTRADA_ID", "", "ID_DRIVE", "\ud83d\udce5 Entrada"],
    ["PASTA_REVISAO_ID", "", "ID_DRIVE", "\u26a0\ufe0f Revis\u00e3o"],
    ["PASTA_ERROS_ID", "", "ID_DRIVE", "\u274c Erros"],
    ["PASTA_DUPLICADOS_ID", "", "ID_DRIVE", "\ud83d\udd01 Duplicados"],
    ["PASTA_MULTAS_ID", "", "ID_DRIVE", "Multas/{AAAA}/{PLACA}/"],
    ["PASTA_IPVA_ID", "", "ID_DRIVE", "IPVA/{AAAA}/"],
    ["PASTA_LICENCIAMENTO_ID", "", "ID_DRIVE", "Licenciamento/{AAAA}/"],
    ["PASTA_CRLV_ID", "", "ID_DRIVE", "CRLV/{AAAA}/"],
    ["PASTA_COMPROVANTES_ID", "", "ID_DRIVE", "Comprovantes/{AAAA}/{MM}/"],
    ["PASTA_IMPORTACAO_ID", "", "ID_DRIVE", "\ud83d\udce4 Importa\u00e7\u00e3o: CSVs da carga inicial e de importa\u00e7\u00f5es em lote"],
    ["PASTA_MOTORISTAS_ID", "", "ID_DRIVE", "Motoristas/{NOME}/ (acesso restrito)"],
    // Prazos e alertas
    ["DIAS_ALERTA_VENCIMENTO", "7", "NUMERO", 'Janela do "vence em breve" das obriga\u00e7\u00f5es'],
    ["DIAS_ALERTA_INDICACAO", "10", "NUMERO", "Multas novas com prazo de indica\u00e7\u00e3o em at\u00e9 N dias entram no e-mail de resultado"],
    ["DIAS_ALERTA_DIARIO", "5", "NUMERO", "Prazos de indica\u00e7\u00e3o e defesa em at\u00e9 N dias entram no alerta di\u00e1rio"],
    ["EMAILS_ALERTA_DIARIO", "", "EMAILS", "Destinat\u00e1rios do alerta di\u00e1rio (vazio = ADMINs)"],
    ["EMAILS_RESUMO_SEMANAL", "", "EMAILS", "Destinat\u00e1rios do resumo semanal (vazio = ADMINs)"],
    ["EMAILS_FECHAMENTO_MENSAL", "", "EMAILS", "Destinat\u00e1rios do fechamento mensal (vazio = ADMINs)"],
    ["EMAILS_INGESTAO", "", "EMAILS", "Destinat\u00e1rios do e-mail de resultado da ingest\u00e3o (vazio = ADMINs)"],
    // Folha / motoristas
    ["EMAIL_DP", "", "EMAILS", "E-mail do DP para o relat\u00f3rio mensal de descontos"],
    ["DIA_FECHAMENTO_FOLHA", "", "NUMERO", "Dia do m\u00eas em que a folha fecha (a definir com o DP)"],
    ["LIMITE_DESCONTO_MENSAL_MOTORISTA", "", "NUMERO", "Teto mensal de desconto por motorista em R$ (a confirmar com o DP e a conven\u00e7\u00e3o coletiva)"],
    ["PONTOS_LIMITE_SEM_GRAVISSIMA", "40", "NUMERO", "Limite de pontos em 12 meses sem grav\u00edssima (CTB art. 261; conferir regra vigente)"],
    ["PONTOS_LIMITE_1_GRAVISSIMA", "30", "NUMERO", "Limite de pontos em 12 meses com 1 grav\u00edssima (conferir regra vigente)"],
    ["PONTOS_LIMITE_2_GRAVISSIMAS", "20", "NUMERO", "Limite de pontos em 12 meses com 2 ou mais grav\u00edssimas (conferir regra vigente)"],
    ["PONTOS_LIMITE_EAR", "40", "NUMERO", "Limite para quem exerce atividade remunerada (EAR) (conferir regra vigente)"],
    // Custos
    ["FORMA_PGTO_IPVA_PADRAO", "COTA_UNICA", "TEXTO", "Forma usada na gera\u00e7\u00e3o quando o ve\u00edculo n\u00e3o tem forma pr\u00f3pria (COTA_UNICA ou PARCELADO). Provis\u00f3ria at\u00e9 a decis\u00e3o de janeiro/2027"],
    ["FATOR_DEPRECIACAO_VENAL", "", "NUMERO", "Fator para projetar o valor venal do ano seguinte (ex.: 0,92). Vazio = sem proje\u00e7\u00e3o"],
    // API do Claude (Fase 5). A chave fica em Propriedades do Script, nunca aqui.
    ["API_MODELO", "claude-sonnet-5-5", "TEXTO", "Modelo usado na leitura de documentos"],
    ["API_ESFORCO", "low", "TEXTO", "output_config.effort: low, medium ou high"],
    ["API_FALLBACK", "default", "TEXTO", 'Fallback do lado do servidor em caso de recusa ("default" ou vazio para desligar)'],
    ["LIMIAR_CONFIANCA", "0.85", "NUMERO", "Abaixo disso o documento vai para a Fila de Revis\u00e3o"],
    ["TAMANHO_MAX_ARQUIVO_MB", "20", "NUMERO", "Arquivos maiores v\u00e3o para Revis\u00e3o (limite pr\u00e1tico do UrlFetch)"],
    ["INGESTAO_MAX_ARQUIVOS", "20", "NUMERO", "M\u00e1ximo de arquivos por execu\u00e7\u00e3o"],
    ["INGESTAO_ORCAMENTO_SEG", "270", "NUMERO", "Tempo m\u00e1ximo por execu\u00e7\u00e3o antes de parar e retomar na pr\u00f3xima"],
    ["INGESTAO_HORARIO", "07-19", "TEXTO", "Janela do gatilho de ingest\u00e3o (horas, dias \u00fateis)"]
  ];
  function configPadraoComoObjeto() {
    return Object.fromEntries(CONFIG_PADRAO.map(([k, v]) => [k, v]));
  }

  // core/importacao.js
  var importacao_exports = {};
  __export(importacao_exports, {
    ORDEM_IMPORTACAO: () => ORDEM_IMPORTACAO,
    matrizParaRegistros: () => matrizParaRegistros,
    prepararImportacao: () => prepararImportacao,
    resumoImportacao: () => resumoImportacao
  });
  var ORDEM_IMPORTACAO = [
    "FILIAIS",
    "LOCATARIOS",
    "VEICULOS",
    "LOCACOES",
    "CALENDARIO_VENCIMENTOS",
    "ALIQUOTAS_IPVA",
    "TAXAS_LICENCIAMENTO",
    "VALORES_VENAIS"
  ];
  function vazio3(v) {
    return v === null || v === void 0 || String(v).trim() === "";
  }
  function matrizParaRegistros(nomeTabela, matriz) {
    const erros = [], avisos = [], registros = [];
    if (!matriz || !matriz.length) return { registros, erros, avisos };
    const def = tabela(nomeTabela);
    const cols = Object.fromEntries(def.colunas.map((c2) => [c2.nome, c2]));
    const cab = matriz[0].map((h) => String(h === null || h === void 0 ? "" : h).replace(/^\ufeff/, "").trim());
    const desconhecidas = cab.filter((h) => h && !cols[h]);
    if (desconhecidas.length) avisos.push(`${nomeTabela}: colunas ignoradas (n\u00e3o fazem parte da tabela): ${desconhecidas.join(", ")}`);
    const ignoradas = cab.filter((h) => cols[h] && cols[h].calculada);
    if (ignoradas.length) avisos.push(`${nomeTabela}: colunas calculadas ignoradas (o sistema recalcula): ${ignoradas.join(", ")}`);
    const semChave = def.chave.filter((k) => !cab.includes(k));
    if (semChave.length) {
      erros.push(`${nomeTabela}: o arquivo n\u00e3o tem a coluna-chave ${semChave.join(", ")}`);
      return { registros, erros, avisos };
    }
    matriz.slice(1).forEach((linha, i) => {
      if (linha.every(vazio3)) return;
      const r = { _linhaArquivo: i + 2 };
      cab.forEach((h, j) => {
        const col = cols[h];
        if (col && !col.calculada) r[h] = coerirValor(linha[j], col);
      });
      registros.push(r);
    });
    return { registros, erros, avisos };
  }
  function resolverPlacas(matriz, veiculos, erros) {
    const cab = matriz[0].map((h) => String(h || "").replace(/^\uFEFF/, "").trim());
    const iPlaca = cab.indexOf("placa");
    if (iPlaca < 0 || cab.includes("veiculo_id")) return matriz;
    const porPlaca = new Map(veiculos.map((v) => [normalizarPlaca(v.placa), v.veiculo_id]));
    const saida = [[...cab.slice(0, iPlaca), "veiculo_id", ...cab.slice(iPlaca + 1)]];
    matriz.slice(1).forEach((linha, i) => {
      if (linha.every(vazio3)) return;
      const id = porPlaca.get(normalizarPlaca(linha[iPlaca]));
      if (!id) erros.push(`VALORES_VENAIS linha ${i + 2}: placa ${linha[iPlaca]} n\u00e3o est\u00e1 cadastrada`);
      saida.push([...linha.slice(0, iPlaca), id || "", ...linha.slice(iPlaca + 1)]);
    });
    return saida;
  }
  function rotulo(t2, r) {
    const k = chaveRegistro(r, t2);
    return `${t2} linha ${r._linhaArquivo}${k ? ` (${k})` : ""}`;
  }
  function prepararImportacao(arquivosEntrada, existentes = {}) {
    let arquivos = arquivosEntrada;
    const erros = [], avisos = [], porTabela = {};
    const veiculosParaPlaca = [...existentes.VEICULOS || []];
    for (const t2 of ORDEM_IMPORTACAO) {
      if (t2 === "VALORES_VENAIS" && arquivos[t2]) arquivos = { ...arquivos, [t2]: resolverPlacas(arquivos[t2], veiculosParaPlaca.concat(porTabela.VEICULOS ? porTabela.VEICULOS.registros : []), erros) };
      const atuais = new Set((existentes[t2] || []).map((r) => chaveRegistro(r, t2)).filter(Boolean));
      if (!arquivos[t2]) {
        porTabela[t2] = { registros: [], novos: 0, atualizados: 0 };
        continue;
      }
      const lido = matrizParaRegistros(t2, arquivos[t2]);
      erros.push(...lido.erros);
      avisos.push(...lido.avisos);
      const registros = t2 === "VEICULOS" ? lido.registros.map((v) => ({ ...completarVeiculo(v), _linhaArquivo: v._linhaArquivo })) : lido.registros;
      const vistos = /* @__PURE__ */ new Set();
      for (const r of registros) {
        const k = chaveRegistro(r, t2);
        if (!k) {
          erros.push(`${rotulo(t2, r)}: sem chave (${tabela(t2).chave.join(" + ")})`);
          continue;
        }
        if (vistos.has(k)) erros.push(`${rotulo(t2, r)}: chave repetida no arquivo`);
        vistos.add(k);
        for (const e of validarRegistro(r, t2)) erros.push(`${rotulo(t2, r)}: ${e}`);
      }
      const novos = registros.filter((r) => !atuais.has(chaveRegistro(r, t2))).length;
      porTabela[t2] = { registros, novos, atualizados: registros.length - novos };
    }
    const combinado = (t2) => {
      const m = new Map((existentes[t2] || []).map((r) => [chaveRegistro(r, t2), r]));
      for (const r of porTabela[t2].registros) {
        const k = chaveRegistro(r, t2);
        if (k) m.set(k, { ...m.get(k) || {}, ...r });
      }
      return [...m.values()];
    };
    const filiais = new Set(combinado("FILIAIS").map((f) => f.cnpj));
    const veiculos = combinado("VEICULOS");
    const idsVeiculos = new Set(veiculos.map((v) => v.veiculo_id));
    const idsLocatarios = new Set(combinado("LOCATARIOS").map((l) => l.locatario_id));
    for (const v of porTabela.VEICULOS.registros) {
      const rot = `VEICULOS ${v.veiculo_id} ${v.placa || ""}`.trim();
      if (v.cnpj_proprietario && !filiais.has(v.cnpj_proprietario)) erros.push(`${rot}: CNPJ ${v.cnpj_proprietario} n\u00e3o est\u00e1 em FILIAIS`);
      const r = validarVeiculo(v, veiculos);
      r.erros.forEach((e) => erros.push(`${rot}: ${e}`));
      r.avisos.forEach((a) => avisos.push(`${rot}: ${a}`));
    }
    for (const l of porTabela.LOCACOES.registros) {
      const rot = `LOCACOES ${l.locacao_id}`;
      if (l.veiculo_id && !idsVeiculos.has(l.veiculo_id)) erros.push(`${rot}: ve\u00edculo ${l.veiculo_id} n\u00e3o existe`);
      if (l.locatario_id && !idsLocatarios.has(l.locatario_id)) erros.push(`${rot}: locat\u00e1rio ${l.locatario_id} n\u00e3o existe`);
    }
    for (const vv of porTabela.VALORES_VENAIS.registros) {
      if (vv.veiculo_id && !idsVeiculos.has(vv.veiculo_id)) erros.push(`VALORES_VENAIS ${vv.veiculo_id}: ve\u00edculo n\u00e3o existe`);
    }
    if (porTabela.LOCACOES.registros.length) {
      try {
        validarLocacoes(combinado("LOCACOES")).forEach((e) => erros.push(`LOCACOES: ${e}`));
      } catch (e) {
        erros.push(`LOCACOES: ${e.message}`);
      }
    }
    return { ok: erros.length === 0, porTabela, erros, avisos };
  }
  function resumoImportacao(analise) {
    return ORDEM_IMPORTACAO.filter((t2) => analise.porTabela[t2] && analise.porTabela[t2].registros.length).map((t2) => {
      const p = analise.porTabela[t2];
      return `${t2}: ${p.registros.length} registro(s) \u00b7 ${p.novos} novo(s) \u00b7 ${p.atualizados} j\u00e1 existente(s)`;
    });
  }

  // core/exercicio.js
  var exercicio_exports = {};
  __export(exercicio_exports, {
    GRUPO_POR_TIPO: () => GRUPO_POR_TIPO,
    OBS_PROVISORIO: () => OBS_PROVISORIO,
    dividirEmParcelas: () => dividirEmParcelas,
    estimarIpva: () => estimarIpva,
    linhasCalendario: () => linhasCalendario,
    obrigacaoTravada: () => obrigacaoTravada,
    planejarExercicio: () => planejarExercicio,
    regraAliquota: () => regraAliquota,
    resumoPlano: () => resumoPlano,
    taxaLicenciamento: () => taxaLicenciamento,
    totalizar: () => totalizar
  });
  var GRUPO_POR_TIPO = {
    CAVALO: "CAMINHAO",
    TRUCK: "CAMINHAO",
    TOCO: "CAMINHAO",
    CARRETA: "IMPLEMENTO",
    BITREM: "IMPLEMENTO",
    CARRETINHA: "IMPLEMENTO",
    AUTOMOVEL: "AUTOMOVEL",
    VAN: "UTILITARIO",
    UTILITARIO: "UTILITARIO"
  };
  var OBS_PROVISORIO = "Vencimento provis\u00f3rio (calend\u00e1rio do ano anterior projetado)";
  var SITUACOES_FORA = ["VENDIDO", "BAIXADO", "HISTORICO"];
  function obrigacaoTravada(o) {
    return ["PAGO", "PAGO_SEM_LANCAMENTO", "LANCADO_ERP", "ISENTO", "CANCELADO", "NAO_APLICA", "BLOQUEADO"].includes(o.status) || Number(o.valor_pago) > 0 || Number(o.valor_guia) > 0 || !!o.nr_lancamento_erp;
  }
  function grupoDe(tipo) {
    return GRUPO_POR_TIPO[tipo] || "TODOS";
  }
  function linhasCalendario(calendario, { exercicio, uf, tributo, tipo, final }) {
    const grupos = [grupoDe(tipo), "TODOS"];
    for (const g of grupos) {
      for (const f of [final, "*"]) {
        const linhas = calendario.filter((c2) => Number(c2.exercicio) === Number(exercicio) && c2.uf === uf && c2.tributo === tributo && c2.grupo_veiculo === g && String(c2.final_placa) === String(f));
        if (linhas.length) return linhas;
      }
    }
    return [];
  }
  function regraAliquota(aliquotas, { exercicio, uf, tipo }) {
    const chaves = [tipo, categoriaDoTipo(tipo), grupoDe(tipo), "TODOS"].filter(Boolean);
    for (const k of chaves) {
      const r = aliquotas.find((a) => Number(a.exercicio) === Number(exercicio) && a.uf === uf && String(a.tipo_ou_categoria).toUpperCase() === k);
      if (r) return r;
    }
    return null;
  }
  function taxaLicenciamento(taxas, { exercicio, uf, tipo }) {
    for (const g of [grupoDe(tipo), "TODOS"]) {
      const t2 = taxas.find((x) => Number(x.exercicio) === Number(exercicio) && x.uf === uf && x.grupo_veiculo === g);
      if (t2) return t2;
    }
    return null;
  }
  function dividirEmParcelas(total, n) {
    const c2 = paraCentavos(total);
    const base = Math.floor(c2 / n);
    return Array.from({ length: n }, (_, i) => (i === n - 1 ? c2 - base * (n - 1) : base) / 100);
  }
  function estimarIpva({ venal, aliquotaPct, descontoPct }) {
    if (!(Number(venal) > 0)) return { total: null, cotaUnica: null, texto: "", motivo: "SEM_VALOR_VENAL" };
    if (aliquotaPct === null || aliquotaPct === void 0 || aliquotaPct === "") return { total: null, cotaUnica: null, texto: "", motivo: "SEM_ALIQUOTA" };
    const total = arredondar2(Number(venal) * Number(aliquotaPct) / 100);
    const desc = Number(descontoPct) > 0 ? Number(descontoPct) : 0;
    const cotaUnica = arredondar2(total * (1 - desc / 100));
    const texto = `venal ${formatarNumeroBR(venal, 2)} \u00d7 ${formatarNumeroBR(aliquotaPct, 2)}%` + (desc ? ` \u2212 desc. ${formatarNumeroBR(desc, 2)}%` : "");
    return { total, cotaUnica, texto, motivo: null };
  }
  function locacaoVigente(locacoes, veiculoId, data) {
    if (!ehIso(data)) return null;
    return locacoes.find((l) => l.veiculo_id === veiculoId && ehIso(l.inicio) && l.inicio <= data && (!l.fim || data <= l.fim)) || null;
  }
  function responsavel(locacoes, v, tributo, vencimento) {
    const l = locacaoVigente(locacoes, v.veiculo_id, vencimento);
    const repassa = l && (tributo === "IPVA" ? l.repassa_ipva : l.repassa_licenciamento) === "S";
    return repassa ? { responsavel_pgto: "LOCATARIO", repasse_status: "A_COBRAR" } : { responsavel_pgto: "GOBOR", repasse_status: "NAO_APLICA" };
  }
  function planejarExercicio({ exercicio, veiculos, tabelas, locacoes = [], existentes = [], opcoes = {} }) {
    const ex = Number(exercicio);
    const inicioAno = `${ex}-01-01`;
    const tributos = opcoes.tributos || ["IPVA", "LICENCIAMENTO"];
    const formaPadrao = opcoes.formaPadrao || "COTA_UNICA";
    const { calendario = [], aliquotas = [], taxas = [], venais = [] } = tabelas;
    const venalDe = new Map(venais.filter((x) => Number(x.exercicio) === ex).map((x) => [x.veiculo_id, x]));
    const existentesDoAno = new Map(existentes.filter((o) => Number(o.exercicio) === ex && tributos.includes(o.tributo)).map((o) => [o.obrigacao_id, o]));
    const plano = { exercicio: ex, novas: [], atualizar: [], encerrar: [], mantidas: 0, naoTributados: 0, foraDoExercicio: 0, pendencias: [] };
    const gerados = /* @__PURE__ */ new Set();
    const pend = (v, tipo, detalhe, tributo) => plano.pendencias.push({ veiculo_id: v.veiculo_id, placa: v.placa, uf: v.uf_registro, tributo, tipo, detalhe });
    for (const v of veiculos) {
      if (SITUACOES_FORA.includes(v.situacao) && !(v.situacao === "VENDIDO" && v.data_venda && v.data_venda >= inicioAno)) {
        plano.foraDoExercicio++;
        continue;
      }
      const final = (normalizarPlaca(v.placa) || "").slice(-1);
      const ctx = { exercicio: ex, uf: v.uf_registro, tipo: v.tipo, final };
      const base = { exercicio: ex, veiculo_id: v.veiculo_id, placa: v.placa, uf: v.uf_registro, cnpj: v.cnpj_proprietario, origem: "GERADO", status: "PREVISTO" };
      const propostas = [];
      if (tributos.includes("IPVA")) {
        const regra = regraAliquota(aliquotas, ctx);
        if (v.isento_ipva === "S") {
          propostas.push({ ...base, tributo: "IPVA", forma: "ISENTO", parcela: "U", vencimento: null, status: "ISENTO", valor_estimado: 0, base_estimativa: `Isento: ${v.motivo_isencao || "sem motivo informado"}` });
        } else if (!regra) {
          pend(v, "SEM_ALIQUOTA", `Sem regra de IPVA para ${v.tipo} em ${v.uf_registro} (${ex})`, "IPVA");
        } else if (regra.tributado === "N") {
          plano.naoTributados++;
        } else {
          const forma = v.forma_pgto_ipva_padrao || formaPadrao;
          const linhas = linhasCalendario(calendario, { ...ctx, tributo: "IPVA" });
          const cota = linhas.find((l) => String(l.parcela) === "U");
          const parcelasCal = linhas.filter((l) => String(l.parcela) !== "U").sort((a, b) => Number(a.parcela) - Number(b.parcela));
          if (!linhas.length) pend(v, "SEM_CALENDARIO", `Sem calend\u00e1rio de IPVA para ${v.uf_registro} final ${final} (${ex})`, "IPVA");
          const venal = venalDe.get(v.veiculo_id);
          const est = estimarIpva({ venal: venal && venal.valor_venal, aliquotaPct: regra.aliquota_pct, descontoPct: cota && cota.desconto_pct });
          if (est.motivo) pend(v, est.motivo, est.motivo === "SEM_VALOR_VENAL" ? "Sem valor venal do exerc\u00edcio: estimativa vazia" : `Al\u00edquota n\u00e3o definida para ${v.tipo} em ${v.uf_registro}`, "IPVA");
          const obsProv = (l) => l && l.provisorio === "S" ? OBS_PROVISORIO : null;
          if (forma === "PARCELADO" && parcelasCal.length) {
            const valores = est.total !== null ? dividirEmParcelas(est.total, parcelasCal.length) : parcelasCal.map(() => null);
            parcelasCal.forEach((l, i) => propostas.push({
              ...base,
              tributo: "IPVA",
              forma: "PARCELADO",
              parcela: String(l.parcela),
              vencimento: l.vencimento,
              valor_estimado: valores[i],
              base_estimativa: est.texto ? `${est.texto} \u00f7 ${parcelasCal.length}` : null,
              observacoes: obsProv(l)
            }));
          } else {
            if (forma === "PARCELADO") pend(v, "SEM_PARCELAS", `Calend\u00e1rio sem parcelas para ${v.uf_registro}: gerado como cota \u00fanica`, "IPVA");
            propostas.push({
              ...base,
              tributo: "IPVA",
              forma: "COTA_UNICA",
              parcela: "U",
              vencimento: cota ? cota.vencimento : (parcelasCal[0] || {}).vencimento || null,
              valor_estimado: est.cotaUnica,
              base_estimativa: est.texto || null,
              observacoes: obsProv(cota || parcelasCal[0])
            });
          }
        }
      }
      if (tributos.includes("LICENCIAMENTO")) {
        const linhas = linhasCalendario(calendario, { ...ctx, tributo: "LICENCIAMENTO" });
        const l = linhas.find((x) => String(x.parcela) === "U") || linhas[0];
        if (!l) pend(v, "SEM_CALENDARIO", `Sem calend\u00e1rio de licenciamento para ${v.uf_registro} final ${final} (${ex})`, "LICENCIAMENTO");
        const taxa = taxaLicenciamento(taxas, ctx);
        if (!taxa) pend(v, "SEM_TAXA", `Sem taxa de licenciamento para ${v.uf_registro} (${ex})`, "LICENCIAMENTO");
        propostas.push({
          ...base,
          tributo: "LICENCIAMENTO",
          forma: "COTA_UNICA",
          parcela: "U",
          vencimento: l ? l.vencimento : null,
          valor_estimado: taxa ? Number(taxa.valor) : null,
          base_estimativa: taxa ? `taxa ${v.uf_registro} ${formatarMoeda(taxa.valor)}` : null,
          crlv_emitido: "N",
          observacoes: l && l.provisorio === "S" ? OBS_PROVISORIO : null
        });
      }
      for (const pr of propostas) {
        pr.obrigacao_id = obrigacaoId(ex, pr.tributo, v.veiculo_id, pr.parcela);
        const vendaAntes = v.data_venda && pr.vencimento && v.data_venda < pr.vencimento;
        Object.assign(pr, responsavel(locacoes, v, pr.tributo, pr.vencimento || inicioAno));
        if (vendaAntes) {
          pr.status = "NAO_APLICA";
          pr.observacoes = `Ve\u00edculo vendido em ${v.data_venda}`;
        }
        gerados.add(pr.obrigacao_id);
        const atual = existentesDoAno.get(pr.obrigacao_id);
        if (!atual) {
          plano.novas.push(pr);
          continue;
        }
        if (obrigacaoTravada(atual)) {
          plano.mantidas++;
          continue;
        }
        const patch = {};
        for (const campo of ["vencimento", "valor_estimado", "base_estimativa", "forma", "status", "observacoes", "responsavel_pgto", "repasse_status"]) {
          const novo = pr[campo] === void 0 ? null : pr[campo];
          const velho = atual[campo] === void 0 || atual[campo] === "" ? null : atual[campo];
          if (campo === "observacoes" && velho !== null && velho !== OBS_PROVISORIO) continue;
          if (novo !== velho) patch[campo] = novo;
        }
        if (Object.keys(patch).length) plano.atualizar.push({ obrigacao_id: pr.obrigacao_id, ...patch });
        else plano.mantidas++;
      }
    }
    for (const [id, o] of existentesDoAno) {
      if (gerados.has(id) || o.origem !== "GERADO") continue;
      if (obrigacaoTravada(o)) {
        plano.pendencias.push({ veiculo_id: o.veiculo_id, placa: o.placa, uf: o.uf, tributo: o.tributo, tipo: "CONFLITO", detalhe: `${id} n\u00e3o seria mais gerada, mas j\u00e1 tem guia, lan\u00e7amento ou pagamento: revisar manualmente` });
        continue;
      }
      plano.encerrar.push({ obrigacao_id: id, status: "CANCELADO", observacoes: "Cancelada na regenera\u00e7\u00e3o do exerc\u00edcio (forma de pagamento ou cadastro mudou)" });
    }
    plano.totais = totalizar(plano.novas.concat(plano.atualizar.map((u) => ({ ...existentesDoAno.get(u.obrigacao_id), ...u }))), veiculos);
    return plano;
  }
  function totalizar(obrigacoes, veiculos = []) {
    const tipoDe = new Map(veiculos.map((v) => [v.veiculo_id, v.tipo]));
    const soma = {};
    const add = (dim, chave, o) => {
      soma[dim] = soma[dim] || {};
      const s = soma[dim][chave] = soma[dim][chave] || { quantidade: 0, estimado: 0, semEstimativa: 0 };
      s.quantidade++;
      if (o.valor_estimado === null || o.valor_estimado === void 0 || o.valor_estimado === "") s.semEstimativa++;
      else s.estimado = arredondar2(s.estimado + Number(o.valor_estimado));
    };
    for (const o of obrigacoes) {
      if (["CANCELADO", "NAO_APLICA"].includes(o.status)) continue;
      add("mes", o.vencimento ? o.vencimento.slice(0, 7) : "sem data", o);
      add("tributo", o.tributo, o);
      add("uf", o.uf || "\u2014", o);
      add("filial", o.cnpj || "\u2014", o);
      add("tipo", tipoDe.get(o.veiculo_id) || "\u2014", o);
    }
    return soma;
  }
  function resumoPlano(plano) {
    const porTipo = {};
    for (const p of plano.pendencias) porTipo[p.tipo] = (porTipo[p.tipo] || 0) + 1;
    const trib = plano.totais.tributo || {};
    const l = [
      `Exerc\u00edcio ${plano.exercicio}: ${plano.novas.length} obriga\u00e7\u00e3o(\u00f5es) nova(s), ${plano.atualizar.length} atualizada(s), ${plano.encerrar.length} cancelada(s), ${plano.mantidas} sem mudan\u00e7a.`,
      ...Object.entries(trib).map(([t2, s]) => `${t2}: ${s.quantidade} \u00b7 estimado ${formatarMoeda(s.estimado)}${s.semEstimativa ? ` \u00b7 ${s.semEstimativa} sem estimativa` : ""}`),
      `Ve\u00edculos n\u00e3o tributados no IPVA (pela tabela de al\u00edquotas): ${plano.naoTributados}. Fora do exerc\u00edcio (vendidos/baixados): ${plano.foraDoExercicio}.`
    ];
    if (plano.pendencias.length) l.push("Pend\u00eancias: " + Object.entries(porTipo).map(([k, n]) => `${k} ${n}`).join(" \u00b7 "));
    return l;
  }

  // core/index.js
  var VERSAO = "0.2.0";
  return __toCommonJS(index_exports);
})();


// ===== 01_painel.js =====
// GERADO por `npm run build` a partir de apps-script/ui/. N\u00c3O EDITAR ESTE ARQUIVO.
var PAINEL_HTML = "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head>\n  <base target=\"_top\">\n  <meta charset=\"utf-8\">\n  <title>Frota Gobor</title>\n  <style>\n  :root {\n    --fundo: #f5f6f8; --superficie: #ffffff; --texto: #1d2430; --mudo: #5d6878; --borda: #dde2e8;\n    --primaria: #1f3a5f; --primaria-texto: #ffffff; --destaque: #e8eef6;\n    --ok: #1e7a46; --alerta: #a35d00; --erro: #b42318;\n    --raio: 10px; --sombra: 0 1px 2px rgba(16, 24, 40, .06);\n    color-scheme: light dark;\n  }\n  @media (prefers-color-scheme: dark) {\n    :root:not([data-theme=\"light\"]) {\n      --fundo: #12161c; --superficie: #1b2129; --texto: #e7ebf0; --mudo: #9aa5b4; --borda: #2c3542;\n      --primaria: #8fb3e3; --primaria-texto: #0d1420; --destaque: #233042;\n      --ok: #5cc98a; --alerta: #f0b35a; --erro: #ff8a80;\n    }\n  }\n  :root[data-theme=\"dark\"] {\n    --fundo: #12161c; --superficie: #1b2129; --texto: #e7ebf0; --mudo: #9aa5b4; --borda: #2c3542;\n    --primaria: #8fb3e3; --primaria-texto: #0d1420; --destaque: #233042;\n    --ok: #5cc98a; --alerta: #f0b35a; --erro: #ff8a80;\n  }\n  * { box-sizing: border-box; }\n  html, body { margin: 0; padding: 0; }\n  body { background: var(--fundo); color: var(--texto); font: 15px/1.45 -apple-system, \"Segoe UI\", Roboto, Arial, sans-serif; min-height: 100vh; display: flex; flex-direction: column; }\n  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }\n  .topo { display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: var(--superficie); border-bottom: 1px solid var(--borda); position: sticky; top: 0; z-index: 5; }\n  .marca { white-space: nowrap; }\n  .busca { flex: 1; min-width: 0; }\n  .busca input { width: 100%; padding: 8px 12px; border: 1px solid var(--borda); border-radius: 8px; background: var(--fundo); color: var(--texto); font: inherit; }\n  .usuario { font-size: 13px; color: var(--mudo); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 40vw; }\n  .menu-botao { display: none; border: 1px solid var(--borda); background: var(--superficie); color: var(--texto); border-radius: 8px; padding: 4px 10px; font-size: 18px; }\n  .corpo { flex: 1; display: flex; min-height: 0; }\n  .lateral { width: 240px; flex-shrink: 0; padding: 12px 8px; border-right: 1px solid var(--borda); background: var(--superficie); }\n  .lateral a { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; color: var(--texto); text-decoration: none; font-size: 14px; }\n  .lateral a:hover { background: var(--destaque); }\n  .lateral a[aria-current=\"page\"] { background: var(--primaria); color: var(--primaria-texto); }\n  .lateral .fase { font-size: 11px; opacity: .7; }\n  .conteudo { flex: 1; min-width: 0; padding: 20px 24px; outline: none; }\n  h1 { font-size: 22px; margin: 0 0 4px; }\n  .subtitulo { color: var(--mudo); margin: 0 0 20px; }\n  .grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-bottom: 20px; }\n  .cartao { background: var(--superficie); border: 1px solid var(--borda); border-radius: var(--raio); padding: 14px 16px; box-shadow: var(--sombra); }\n  .cartao .rotulo { color: var(--mudo); font-size: 13px; }\n  .cartao .valor { font-size: 24px; font-weight: 600; margin-top: 2px; }\n  .tabela-envoltorio { overflow-x: auto; background: var(--superficie); border: 1px solid var(--borda); border-radius: var(--raio); }\n  table { border-collapse: collapse; width: 100%; font-size: 14px; }\n  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--borda); }\n  th { color: var(--mudo); font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: .03em; }\n  td.num { text-align: right; font-variant-numeric: tabular-nums; }\n  tr:last-child td { border-bottom: 0; }\n  .selo { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; font-size: 12px; border: 1px solid currentColor; }\n  .selo.ok { color: var(--ok); } .selo.alerta { color: var(--alerta); } .selo.erro { color: var(--erro); }\n  .mudo { color: var(--mudo); }\n  .aviso { border-left: 4px solid var(--alerta); background: var(--superficie); padding: 12px 14px; border-radius: 6px; margin-bottom: 16px; }\n  .erro-caixa { border-left: 4px solid var(--erro); background: var(--superficie); padding: 12px 14px; border-radius: 6px; }\n  .rodape { color: var(--mudo); font-size: 12px; padding: 8px 16px; border-top: 1px solid var(--borda); background: var(--superficie); }\n  @media (max-width: 800px) {\n    .menu-botao { display: inline-block; }\n    .usuario { display: none; }\n    .lateral { position: fixed; top: 53px; left: 0; bottom: 0; z-index: 4; transform: translateX(-100%); transition: transform .2s; box-shadow: var(--sombra); overflow-y: auto; }\n    .lateral.aberta { transform: none; }\n    .conteudo { padding: 16px; }\n  }\n</style>\n\n</head>\n<body>\n  <header class=\"topo\">\n    <button class=\"menu-botao\" id=\"menuBotao\" aria-label=\"Abrir menu\" aria-expanded=\"false\">\u2630</button>\n    <div class=\"marca\">\ud83d\ude9b <strong>Frota Gobor</strong></div>\n    <label class=\"busca\">\n      <span class=\"sr\">Busca global</span>\n      <input id=\"busca\" type=\"search\" placeholder=\"Placa, AIT, MTO ou motorista (em breve)\" disabled>\n    </label>\n    <div class=\"usuario\" id=\"usuario\">carregando\u2026</div>\n  </header>\n  <div class=\"corpo\">\n    <nav class=\"lateral\" id=\"lateral\" aria-label=\"Telas\"></nav>\n    <main id=\"conteudo\" class=\"conteudo\" tabindex=\"-1\">\n      <p class=\"mudo\">Carregando\u2026</p>\n    </main>\n  </div>\n  <footer class=\"rodape\">Vers\u00e3o <?= versao ?> \u00b7 dados no fuso America/Sao_Paulo</footer>\n  <script>\n  (function () {\n    'use strict';\n\n    // Telas do painel (prompt \u00a77). `perfis` vazio = todos os perfis cadastrados.\n    var TELAS = [\n      { id: 'visao-geral', titulo: '\ud83c\udfe0 Vis\u00e3o Geral', fase: '4', perfis: [] },\n      { id: 'agenda', titulo: '\ud83d\udcc5 Agenda', fase: '4', perfis: [] },\n      { id: 'ipva-licenciamento', titulo: '\ud83e\uddfe IPVA & Licenciamento', fase: '3', perfis: [] },\n      { id: 'multas', titulo: '\ud83d\udea8 Multas', fase: '5', perfis: [] },\n      { id: 'motoristas', titulo: '\ud83d\udc77 Motoristas', fase: '6', perfis: ['ADMIN', 'FINANCEIRO', 'DP'] },\n      { id: 'folha', titulo: '\ud83d\udcbc Folha do m\u00eas', fase: '6', perfis: ['ADMIN', 'FINANCEIRO', 'DP'] },\n      { id: 'veiculos', titulo: '\ud83d\ude9b Ve\u00edculos', fase: '3', perfis: [] },\n      { id: 'locatarios', titulo: '\ud83e\udd1d Locat\u00e1rios & Repasses', fase: '8', perfis: [] },\n      { id: 'custos', titulo: '\ud83d\udcca Custos & Gerencial', fase: '4', perfis: [] },\n      { id: 'revisao', titulo: '\ud83d\udce5 Fila de Revis\u00e3o', fase: '5', perfis: ['ADMIN', 'FINANCEIRO'] },\n      { id: 'admin', titulo: '\u2699\ufe0f Admin', fase: '1', perfis: ['ADMIN'] }\n    ];\n\n    var estado = { perfil: null, eu: null };\n\n    function el(tag, atributos, filhos) {\n      var e = document.createElement(tag);\n      Object.keys(atributos || {}).forEach(function (k) {\n        if (k === 'texto') e.textContent = atributos[k];\n        else if (k === 'classe') e.className = atributos[k];\n        else e.setAttribute(k, atributos[k]);\n      });\n      (filhos || []).forEach(function (f) { if (f) e.appendChild(typeof f === 'string' ? document.createTextNode(f) : f); });\n      return e;\n    }\n\n    function chamar(rota, args) {\n      return new Promise(function (resolve, reject) {\n        google.script.run\n          .withSuccessHandler(function (r) { (r && r.ok) ? resolve(r.dados) : reject(new Error(r ? r.erro : 'Sem resposta do servidor')); })\n          .withFailureHandler(function (e) { reject(e instanceof Error ? e : new Error(String(e))); })\n          .api(rota, args || {});\n      });\n    }\n\n    function numeroBR(n) {\n      return n === null || n === undefined ? '\u2014' : Number(n).toLocaleString('pt-BR');\n    }\n\n    function dataBR(iso) {\n      return iso ? iso.split('-').reverse().join('/') : '';\n    }\n\n    function telasPermitidas() {\n      return TELAS.filter(function (t) { return !t.perfis.length || t.perfis.indexOf(estado.perfil) >= 0; });\n    }\n\n    function montarMenu(atual) {\n      var nav = document.getElementById('lateral');\n      nav.innerHTML = '';\n      telasPermitidas().forEach(function (t) {\n        var a = el('a', { href: '#/' + t.id }, [el('span', { texto: t.titulo }), el('span', { classe: 'fase', texto: 'F' + t.fase })]);\n        if (t.id === atual) a.setAttribute('aria-current', 'page');\n        nav.appendChild(a);\n      });\n    }\n\n    function conteudo() {\n      var c = document.getElementById('conteudo');\n      c.innerHTML = '';\n      return c;\n    }\n\n    function mostrarErro(mensagem) {\n      var c = conteudo();\n      c.appendChild(el('div', { classe: 'erro-caixa' }, [el('strong', { texto: 'N\u00e3o foi poss\u00edvel carregar. ' }), document.createTextNode(mensagem)]));\n    }\n\n    function telaEmConstrucao(t) {\n      var c = conteudo();\n      c.appendChild(el('h1', { texto: t.titulo }));\n      c.appendChild(el('p', { classe: 'subtitulo', texto: 'Esta tela chega na Fase ' + t.fase + ' do projeto.' }));\n    }\n\n    function telaAdmin() {\n      var c = conteudo();\n      c.appendChild(el('h1', { texto: '\u2699\ufe0f Admin' }));\n      c.appendChild(el('p', { classe: 'subtitulo', texto: 'Estado das tabelas da base. Cadastros, importadores e o assistente de exerc\u00edcio chegam nas pr\u00f3ximas fases.' }));\n      var caixa = el('div', { classe: 'tabela-envoltorio' }, [el('p', { classe: 'mudo', texto: ' Carregando\u2026' })]);\n      c.appendChild(caixa);\n      chamar('statusBase').then(function (d) {\n        var tbody = el('tbody');\n        d.tabelas.forEach(function (t) {\n          var selo = t.erro ? el('span', { classe: 'selo erro', texto: '\u2716 ' + t.erro }) : el('span', { classe: 'selo ok', texto: '\u2714 ok' });\n          tbody.appendChild(el('tr', {}, [\n            el('td', {}, [el('strong', { texto: t.nome }), el('div', { classe: 'mudo', texto: t.descricao })]),\n            el('td', { texto: t.planilha === 'MOTORISTAS' ? '\ud83d\udd12 Restrita' : 'Base' }),\n            el('td', { classe: 'num', texto: numeroBR(t.registros) }),\n            el('td', {}, [selo])\n          ]));\n        });\n        var tabela = el('table', {}, [\n          el('thead', {}, [el('tr', {}, [el('th', { texto: 'Tabela' }), el('th', { texto: 'Planilha' }), el('th', { texto: 'Registros' }), el('th', { texto: 'Situa\u00e7\u00e3o' })])]),\n          tbody\n        ]);\n        caixa.innerHTML = '';\n        caixa.appendChild(tabela);\n      }).catch(function (e) { mostrarErro(e.message); });\n    }\n\n    function telaVisaoGeral() {\n      var c = conteudo();\n      c.appendChild(el('h1', { texto: '\ud83c\udfe0 Vis\u00e3o Geral' }));\n      c.appendChild(el('p', { classe: 'subtitulo', texto: 'Hoje \u00e9 ' + dataBR(estado.eu.hoje) + '. Os indicadores chegam na Fase 4.' }));\n      c.appendChild(el('div', { classe: 'aviso', texto: 'Fase 1 (funda\u00e7\u00e3o): a base est\u00e1 criada e o acesso por perfil funciona. A carga dos 212 ve\u00edculos vem na Fase 2.' }));\n      var grade = el('div', { classe: 'grade' });\n      c.appendChild(grade);\n      chamar('statusBase').then(function (d) {\n        var mapa = {};\n        d.tabelas.forEach(function (t) { mapa[t.nome] = t.registros; });\n        [['Ve\u00edculos', 'VEICULOS'], ['Obriga\u00e7\u00f5es', 'OBRIGACOES'], ['Multas', 'MULTAS'], ['Filiais', 'FILIAIS']].forEach(function (p) {\n          grade.appendChild(el('div', { classe: 'cartao' }, [el('div', { classe: 'rotulo', texto: p[0] }), el('div', { classe: 'valor', texto: numeroBR(mapa[p[1]]) })]));\n        });\n      }).catch(function (e) { mostrarErro(e.message); });\n    }\n\n    function rotear() {\n      var id = (location.hash || '#/visao-geral').replace('#/', '');\n      var t = telasPermitidas().filter(function (x) { return x.id === id; })[0] || telasPermitidas()[0];\n      montarMenu(t.id);\n      document.getElementById('lateral').classList.remove('aberta');\n      if (t.id === 'visao-geral') telaVisaoGeral();\n      else if (t.id === 'admin') telaAdmin();\n      else telaEmConstrucao(t);\n      document.getElementById('conteudo').focus();\n    }\n\n    document.getElementById('menuBotao').addEventListener('click', function () {\n      var nav = document.getElementById('lateral');\n      var aberta = nav.classList.toggle('aberta');\n      this.setAttribute('aria-expanded', aberta ? 'true' : 'false');\n    });\n\n    chamar('meuPerfil').then(function (eu) {\n      estado.eu = eu;\n      estado.perfil = eu.perfil;\n      document.getElementById('usuario').textContent = eu.email + ' \u00b7 ' + eu.perfil;\n      window.addEventListener('hashchange', rotear);\n      rotear();\n    }).catch(function (e) {\n      document.getElementById('usuario').textContent = '';\n      mostrarErro(e.message);\n    });\n  })();\n</script>\n\n</body>\n</html>\n";


// ===== Api.js =====
/**
 * Ponto \u00fanico de entrada do painel: google.script.run.api(rota, args).
 * Cada rota declara quais perfis podem cham\u00e1-la. Erros voltam como {ok:false, erro}, com
 * mensagem em portugu\u00eas, sem quebrar a tela.
 *
 * Valores devolvidos n\u00e3o podem conter Date (limita\u00e7\u00e3o do google.script.run): os registros
 * j\u00e1 trazem datas como texto ISO.
 */
var Rotas = (function () {
  var TODOS = ['ADMIN', 'FINANCEIRO', 'DP', 'CONSULTA'];

  function meuPerfil(args, ctx) {
    return {
      email: ctx.email,
      perfil: ctx.perfil,
      nome: ctx.nome,
      dadosPessoais: Auth.podeVerDadosPessoais(ctx.perfil),
      versao: Core.VERSAO,
      empresa: Config.obter('NOME_EMPRESA'),
      hoje: Util.hojeIso(),
    };
  }

  function statusBase(args, ctx) {
    var tabelas = Core.schema.TABELAS.filter(function (t) {
      return t.planilha === 'BASE' || Auth.podeVerDadosPessoais(ctx.perfil);
    }).map(function (t) {
      var n = null, erro = null;
      try { n = Db.contar(t.nome); } catch (e) { erro = String(e.message || e); }
      return { nome: t.nome, descricao: t.descricao, planilha: t.planilha, registros: n, erro: erro };
    });
    return { tabelas: tabelas };
  }

  return {
    meuPerfil: { perfis: TODOS, fn: meuPerfil },
    statusBase: { perfis: TODOS, fn: statusBase },
  };
})();

function api(rota, args) {
  try {
    var def = Rotas[rota];
    if (!def) throw new Error('Rota desconhecida: ' + rota);
    var ctx = Auth.exigir(def.perfis);
    return { ok: true, dados: def.fn(args || {}, ctx) };
  } catch (e) {
    console.error('api(' + rota + '): ' + ((e && e.stack) || e));
    return { ok: false, erro: String((e && e.message) || e) };
  }
}


// ===== Auditoria.js =====
/**
 * Auditoria: quem, quando, a\u00e7\u00e3o, entidade, id, antes/depois em JSON.
 * Altera\u00e7\u00f5es nas tabelas restritas (motoristas, descontos) v\u00e3o para AUDITORIA_RESTRITA,
 * na planilha restrita, para que dados pessoais n\u00e3o apare\u00e7am na base geral.
 */
var Auditoria = (function () {
  var LIMITE_CELULA = 45000;

  function json_(obj) {
    if (obj === null || obj === undefined) return '';
    var s = JSON.stringify(obj);
    return s.length > LIMITE_CELULA ? s.slice(0, LIMITE_CELULA) + '\u2026(truncado)' : s;
  }

  /**
   * @param {{acao:string, entidade:string, entidade_id?:string, antes?:object, depois?:object}[]} itens
   * @param {{origem?:string, detalhe?:string}} ctx
   */
  function registrar(itens, ctx) {
    ctx = ctx || {};
    if (!itens || !itens.length) return;
    var quando = Util.agoraIso();
    var quem = Util.quem();
    var porTabela = {};
    itens.forEach(function (it) {
      var destino = Core.schema.tabelaDeAuditoria(it.entidade);
      (porTabela[destino] = porTabela[destino] || []).push({
        quando: quando,
        quem: quem,
        origem: ctx.origem || 'SCRIPT',
        acao: it.acao,
        entidade: it.entidade,
        entidade_id: it.entidade_id || '',
        antes_json: json_(it.antes),
        depois_json: json_(it.depois),
        detalhe: ctx.detalhe || '',
      });
    });
    Object.keys(porTabela).forEach(function (tab) {
      Db.inserir(tab, porTabela[tab], { semAuditoria: true });
    });
  }

  return { registrar: registrar };
})();


// ===== Auth.js =====
/**
 * Perfis de acesso (prompt \u00a710). O perfil vem do e-mail do usu\u00e1rio cruzado com a aba
 * USUARIOS:
 * - ADMIN: tudo;
 * - FINANCEIRO: obriga\u00e7\u00f5es, multas e repasses;
 * - DP: motoristas e folha;
 * - CONSULTA: s\u00f3 leitura, sem dados pessoais de motoristas.
 *
 * Primeiro acesso: enquanto USUARIOS estiver vazia, o propriet\u00e1rio do script \u00e9 ADMIN.
 */
var Auth = (function () {
  var CHAVE_CACHE = 'USUARIOS_V1';
  var PERFIS_DADOS_PESSOAIS = ['ADMIN', 'FINANCEIRO', 'DP'];

  function usuarios_() {
    var cache = CacheService.getScriptCache();
    var guardado = cache.get(CHAVE_CACHE);
    if (guardado) return JSON.parse(guardado);
    var mapa = {};
    try {
      Db.lerTodos('USUARIOS').forEach(function (u) {
        if (u.email) mapa[String(u.email).toLowerCase()] = { perfil: u.perfil, ativo: u.ativo, nome: u.nome || '' };
      });
    } catch (e) {
      // Antes do primeiro setup a aba ainda n\u00e3o existe: segue como lista vazia.
      mapa = {};
    }
    cache.put(CHAVE_CACHE, JSON.stringify(mapa), 300);
    return mapa;
  }

  /** @returns {{email:string, perfil:string|null, nome:string}} */
  function contexto() {
    var email = Util.emailUsuario();
    var lista = usuarios_();
    var u = email ? lista[email] : null;
    var perfil = u && u.ativo !== 'N' ? u.perfil : null;
    if (!perfil && email && email === Util.emailProprietario() && Object.keys(lista).length === 0) perfil = 'ADMIN';
    return { email: email, perfil: perfil, nome: u ? u.nome : '' };
  }

  /**
   * Garante que o usu\u00e1rio tem um dos perfis (ou qualquer perfil, se `perfis` for vazio).
   * @throws Error com mensagem clara em portugu\u00eas
   */
  function exigir(perfis) {
    var ctx = contexto();
    if (!ctx.email) throw new Error('Acesso negado: n\u00e3o foi poss\u00edvel identificar seu e-mail. Entre com a conta @gobor.com.br.');
    if (!ctx.perfil) throw new Error('Acesso negado: ' + ctx.email + ' n\u00e3o est\u00e1 cadastrado (ou est\u00e1 inativo) na aba USUARIOS.');
    if (perfis && perfis.length && perfis.indexOf(ctx.perfil) < 0) {
      throw new Error('Acesso negado: o perfil ' + ctx.perfil + ' n\u00e3o permite esta a\u00e7\u00e3o.');
    }
    return ctx;
  }

  function podeVerDadosPessoais(perfil) {
    return PERFIS_DADOS_PESSOAIS.indexOf(perfil) >= 0;
  }

  function emailsDosAdmins() {
    var lista = usuarios_();
    return Object.keys(lista).filter(function (e) { return lista[e].perfil === 'ADMIN' && lista[e].ativo !== 'N'; });
  }

  function limparCache() {
    CacheService.getScriptCache().remove(CHAVE_CACHE);
  }

  return {
    contexto: contexto,
    exigir: exigir,
    podeVerDadosPessoais: podeVerDadosPessoais,
    emailsDosAdmins: emailsDosAdmins,
    limparCache: limparCache,
  };
})();


// ===== Config.js =====
/**
 * Par\u00e2metros da aba CONFIG, com cache de 5 minutos. Chaves ausentes na planilha usam o
 * padr\u00e3o de core/config-padrao.js. Segredos (chave da API) ficam em Propriedades do
 * Script, nunca aqui.
 */
var Config = (function () {
  var CHAVE_CACHE = 'CONFIG_V1';

  function todas() {
    var cache = CacheService.getScriptCache();
    var guardado = cache.get(CHAVE_CACHE);
    if (guardado) return JSON.parse(guardado);
    var valores = Core.config.configPadraoComoObjeto();
    Db.lerTodos('CONFIG').forEach(function (r) {
      if (r.chave) valores[r.chave] = r.valor === null || r.valor === undefined ? '' : String(r.valor);
    });
    cache.put(CHAVE_CACHE, JSON.stringify(valores), 300);
    return valores;
  }

  function obter(chave) {
    var v = todas()[chave];
    return v === undefined || v === null ? '' : String(v);
  }

  /** N\u00famero (aceita v\u00edrgula decimal). Vazio ou inv\u00e1lido \u2192 null. */
  function numero(chave) {
    var v = obter(chave).trim();
    if (!v) return null;
    var n = Number(v.replace(',', '.'));
    return isFinite(n) ? n : null;
  }

  /** Lista de e-mails separados por v\u00edrgula, ponto e v\u00edrgula ou espa\u00e7o. */
  function emails(chave) {
    return obter(chave).split(/[;,\s]+/).filter(function (e) { return e.indexOf('@') > 0; });
  }

  function definir(chave, valor, ctx) {
    Db.upsert('CONFIG', [{ chave: chave, valor: valor === null || valor === undefined ? '' : String(valor) }], ctx || { origem: 'SCRIPT' });
    limparCache();
  }

  function limparCache() {
    CacheService.getScriptCache().remove(CHAVE_CACHE);
  }

  return { todas: todas, obter: obter, numero: numero, emails: emails, definir: definir, limparCache: limparCache };
})();


// ===== Db.js =====
/**
 * Acesso \u00e0s abas pelo NOME do cabe\u00e7alho (nunca pelo \u00edndice da coluna), com leitura e
 * escrita em bloco, valida\u00e7\u00e3o pelo esquema, colunas de controle, trava e auditoria.
 *
 * Datas: na planilha ficam como Date; no n\u00facleo e nos registros, como texto ISO.
 */
var Db = (function () {
  var planilhas = {};

  function abrir_(id) {
    if (!planilhas[id]) planilhas[id] = SpreadsheetApp.openById(id);
    return planilhas[id];
  }

  /** Planilha base: a do container ou, fora dele (ex.: Web App), a do ID salvo no setup. */
  function base() {
    var ss = null;
    try { ss = SpreadsheetApp.getActive(); } catch (e) { ss = null; }
    if (ss) return ss;
    var id = Util.propriedades().getProperty('PLANILHA_BASE_ID');
    if (!id) throw new Error('Planilha base n\u00e3o identificada. Rode \ud83d\ude9b Frota \u2192 Admin \u2192 Criar/validar base.');
    return abrir_(id);
  }

  function motoristas() {
    var id = Util.propriedades().getProperty('PLANILHA_MOTORISTAS_ID');
    if (!id) throw new Error('A planilha restrita de motoristas ainda n\u00e3o existe. Rode \ud83d\ude9b Frota \u2192 Admin \u2192 Criar/validar base.');
    return abrir_(id);
  }

  function planilhaDe(def) {
    return def.planilha === 'MOTORISTAS' ? motoristas() : base();
  }

  function aba_(nome) {
    var def = Core.schema.tabela(nome);
    var sh = planilhaDe(def).getSheetByName(nome);
    if (!sh) throw new Error('Aba "' + nome + '" n\u00e3o encontrada. Rode \ud83d\ude9b Frota \u2192 Admin \u2192 Criar/validar base.');
    var cols = {};
    def.colunas.forEach(function (c) { cols[c.nome] = c; });
    return { def: def, sh: sh, cols: cols };
  }

  function lerBloco_(sh) {
    var ultimaLinha = sh.getLastRow();
    var ultimaCol = sh.getLastColumn();
    if (ultimaCol === 0) return { cabecalho: [], linhas: [] };
    var valores = sh.getRange(1, 1, Math.max(ultimaLinha, 1), ultimaCol).getValues();
    return { cabecalho: valores[0].map(function (h) { return String(h).trim(); }), linhas: valores.slice(1) };
  }

  function paraNucleo_(valor, col) {
    if (valor instanceof Date) return col && col.tipo === 'datahora' ? Util.isoDataHoraDeDate(valor) : Util.isoDeDate(valor);
    return valor;
  }

  function paraCelula_(valor, col) {
    if (valor === null || valor === undefined || valor === '') return '';
    if (col && col.tipo === 'data' && typeof valor === 'string' && Core.datas.ehIso(valor)) return Util.dateDeIso(valor);
    if (col && col.tipo === 'datahora' && typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valor)) return Util.dateDeIsoDataHora(valor);
    return valor;
  }

  function linhaVazia_(linha) {
    for (var i = 0; i < linha.length; i++) if (linha[i] !== '' && linha[i] !== null) return false;
    return true;
  }

  function exigirCabecalho_(a, cabecalho) {
    var faltando = Core.tabela.planoCabecalho(cabecalho, a.def.colunas.map(function (c) { return c.nome; })).faltando;
    if (faltando.length) {
      throw new Error('Aba ' + a.def.nome + ' sem as colunas: ' + faltando.join(', ') + '. Rode \ud83d\ude9b Frota \u2192 Admin \u2192 Criar/validar base.');
    }
  }

  function registroDaLinha_(a, cabecalho, mapa, linhaBruta) {
    var convertida = linhaBruta.map(function (v, i) { return paraNucleo_(v, a.cols[cabecalho[i]]); });
    return Core.tabela.linhaParaRegistro(convertida, mapa, a.def.nome);
  }

  function linhaDoRegistro_(a, cabecalho, registro, linhaBruta) {
    var linha = Core.tabela.registroParaLinha(registro, cabecalho, a.def.nome, linhaBruta || null);
    return linha.map(function (v, i) {
      var col = a.cols[cabecalho[i]];
      return col ? paraCelula_(v, col) : v;
    });
  }

  function garantirLinhas_(sh, quantidade) {
    var livres = sh.getMaxRows() - sh.getLastRow();
    if (livres < quantidade) sh.insertRowsAfter(sh.getMaxRows(), quantidade - livres + 200);
  }

  function validar_(nome, registro) {
    var erros = Core.tabela.validarRegistro(registro, nome);
    if (erros.length) {
      var chave = Core.tabela.chaveRegistro(registro, nome);
      throw new Error(nome + (chave ? ' [' + chave + ']' : '') + ': ' + erros.join('; '));
    }
  }

  /**
   * Todos os registros da tabela. Cada registro traz `_linha` (n\u00ba da linha na aba), \u00fatil
   * s\u00f3 para diagn\u00f3stico: nunca usar como identificador.
   */
  function lerTodos(nome) {
    var a = aba_(nome);
    var bloco = lerBloco_(a.sh);
    if (!bloco.cabecalho.length) return [];
    var mapa = Core.tabela.mapearCabecalho(bloco.cabecalho);
    var saida = [];
    bloco.linhas.forEach(function (linha, i) {
      if (linhaVazia_(linha)) return;
      var r = registroDaLinha_(a, bloco.cabecalho, mapa, linha);
      r._linha = i + 2;
      saida.push(r);
    });
    return saida;
  }

  /** Mapa chave \u2192 registro. */
  function porChave(nome) {
    var mapa = {};
    lerTodos(nome).forEach(function (r) {
      var k = Core.tabela.chaveRegistro(r, nome);
      if (k) mapa[k] = r;
    });
    return mapa;
  }

  function contar(nome) {
    var a = aba_(nome);
    return Math.max(0, a.sh.getLastRow() - 1);
  }

  function carimbar_(a, registro, novo) {
    if (!a.def.transacional) return;
    var agora = Util.agoraIso();
    if (novo) registro.criado_em = agora;
    registro.atualizado_em = agora;
    registro.atualizado_por = Util.quem();
  }

  function semInterno_(r) {
    var c = {};
    Object.keys(r).forEach(function (k) { if (k.charAt(0) !== '_') c[k] = r[k]; });
    return c;
  }

  /**
   * Insere e atualiza numa \u00fanica leitura da aba.
   * @param {string} nome tabela
   * @param {object[]} registros registros (completos para inserir; parciais para atualizar)
   * @param {{origem?:string, detalhe?:string, semAuditoria?:boolean, somenteInserir?:boolean, somenteAtualizar?:boolean}} ctx
   * @returns {{inseridos:number, atualizados:number, inalterados:number, chaves:string[]}}
   */
  function gravar_(nome, registros, ctx) {
    ctx = ctx || {};
    return Util.comLock(function () {
      var a = aba_(nome);
      var bloco = lerBloco_(a.sh);
      var cabecalho = bloco.cabecalho;
      exigirCabecalho_(a, cabecalho);
      var mapa = Core.tabela.mapearCabecalho(cabecalho);
      var temChave = a.def.chave.length > 0;

      var indice = {};
      if (temChave) {
        bloco.linhas.forEach(function (linha, i) {
          if (linhaVazia_(linha)) return;
          var k = Core.tabela.chaveRegistro(registroDaLinha_(a, cabecalho, mapa, linha), nome);
          if (k) indice[k] = i;
        });
      }

      var novas = [], atualizacoes = [], auditorias = [], chaves = [];
      var resultado = { inseridos: 0, atualizados: 0, inalterados: 0, chaves: chaves };
      var vistos = {};

      registros.forEach(function (entrada) {
        var r = Core.tabela.normalizarRegistro(semInterno_(entrada), nome);
        var k = temChave ? Core.tabela.chaveRegistro(r, nome) : null;
        if (temChave && !k) throw new Error(nome + ': registro sem chave (' + a.def.chave.join(' + ') + ')');
        if (k && vistos[k]) throw new Error(nome + ': chave repetida no mesmo lote: ' + k);
        if (k) vistos[k] = true;
        if (k) chaves.push(k);

        var pos = k !== null && indice.hasOwnProperty(k) ? indice[k] : -1;
        if (pos >= 0) {
          if (ctx.somenteInserir) throw new Error(nome + ': j\u00e1 existe ' + k);
          var bruta = bloco.linhas[pos];
          var antes = registroDaLinha_(a, cabecalho, mapa, bruta);
          var depois = Object.assign({}, antes, r);
          var mudancas = Core.tabela.diffRegistros(antes, depois);
          if (!Object.keys(mudancas).length) { resultado.inalterados++; return; }
          carimbar_(a, depois, false);
          validar_(nome, depois);
          atualizacoes.push({ linha: pos + 2, valores: linhaDoRegistro_(a, cabecalho, depois, bruta) });
          var ant = {}, dep = {};
          Object.keys(mudancas).forEach(function (c) { ant[c] = mudancas[c].antes; dep[c] = mudancas[c].depois; });
          auditorias.push({ acao: 'ATUALIZAR', entidade: nome, entidade_id: k, antes: ant, depois: dep });
          resultado.atualizados++;
        } else {
          if (ctx.somenteAtualizar) throw new Error(nome + ': n\u00e3o encontrado ' + k);
          carimbar_(a, r, true);
          validar_(nome, r);
          novas.push(linhaDoRegistro_(a, cabecalho, r, null));
          auditorias.push({ acao: 'INSERIR', entidade: nome, entidade_id: k, antes: null, depois: r });
          resultado.inseridos++;
        }
      });

      atualizacoes.forEach(function (u) {
        a.sh.getRange(u.linha, 1, 1, u.valores.length).setValues([u.valores]);
      });
      if (novas.length) {
        garantirLinhas_(a.sh, novas.length);
        a.sh.getRange(a.sh.getLastRow() + 1, 1, novas.length, cabecalho.length).setValues(novas);
      }
      if (!ctx.semAuditoria && auditorias.length) Auditoria.registrar(auditorias, ctx);
      return resultado;
    });
  }

  function inserir(nome, registros, ctx) {
    return gravar_(nome, registros, Object.assign({}, ctx || {}, { somenteInserir: true }));
  }

  function upsert(nome, registros, ctx) {
    return gravar_(nome, registros, ctx);
  }

  /** Atualiza um registro existente pela chave. `alteracoes` pode ser parcial. */
  function atualizar(nome, chave, alteracoes, ctx) {
    var def = Core.schema.tabela(nome);
    var partes = String(chave).split('|');
    var r = Object.assign({}, alteracoes);
    def.chave.forEach(function (k, i) { r[k] = partes[i]; });
    var tipos = {};
    def.colunas.forEach(function (c) { tipos[c.nome] = c.tipo; });
    def.chave.forEach(function (k) { if (tipos[k] === 'inteiro') r[k] = Number(r[k]); });
    return gravar_(nome, [r], Object.assign({}, ctx || {}, { somenteAtualizar: true }));
  }

  return {
    base: base,
    motoristas: motoristas,
    planilhaDe: planilhaDe,
    lerTodos: lerTodos,
    porChave: porChave,
    contar: contar,
    inserir: inserir,
    upsert: upsert,
    atualizar: atualizar,
  };
})();


// ===== Exercicio.js =====
/**
 * Assistente de gera\u00e7\u00e3o do exerc\u00edcio (prompt \u00a75.3): l\u00ea ve\u00edculos, loca\u00e7\u00f5es e tabelas de
 * refer\u00eancia, mostra o plano (novas, atualizadas, canceladas, totais e pend\u00eancias) e s\u00f3
 * grava depois da confirma\u00e7\u00e3o. Pode rodar quantas vezes quiser (idempotente).
 */

/** Menu: \ud83d\ude9b Frota \u2192 Gerar exerc\u00edcio\u2026 */
function menuGerarExercicio() {
  Exercicio.executarComUi();
}

var Exercicio = (function () {
  var PERFIS = ['ADMIN', 'FINANCEIRO'];

  function anoSugerido() {
    var hoje = Util.hojeIso();
    var ano = Number(hoje.slice(0, 4));
    return Number(hoje.slice(5, 7)) >= 10 ? ano + 1 : ano;
  }

  function planejar(exercicio) {
    Auth.exigir(PERFIS);
    return Core.exercicio.planejarExercicio({
      exercicio: exercicio,
      veiculos: Db.lerTodos('VEICULOS'),
      locacoes: Db.lerTodos('LOCACOES'),
      existentes: Db.lerTodos('OBRIGACOES'),
      tabelas: {
        calendario: Db.lerTodos('CALENDARIO_VENCIMENTOS'),
        aliquotas: Db.lerTodos('ALIQUOTAS_IPVA'),
        taxas: Db.lerTodos('TAXAS_LICENCIAMENTO'),
        venais: Db.lerTodos('VALORES_VENAIS'),
      },
      opcoes: { formaPadrao: Config.obter('FORMA_PGTO_IPVA_PADRAO') || 'COTA_UNICA' },
    });
  }

  function gravar(plano) {
    Auth.exigir(PERFIS);
    return LogExec.executar('GERAR_EXERCICIO', function (c) {
      var registros = plano.novas.concat(plano.atualizar, plano.encerrar);
      c.exercicio = plano.exercicio;
      c.pendencias = plano.pendencias.length;
      if (!registros.length) return { inseridos: 0, atualizados: 0, inalterados: 0 };
      var r = Db.upsert('OBRIGACOES', registros, { origem: 'SCRIPT', detalhe: 'gerar exerc\u00edcio ' + plano.exercicio });
      c.inseridos = r.inseridos;
      c.atualizados = r.atualizados;
      return r;
    });
  }

  function textoPendencias_(plano, max) {
    if (!plano.pendencias.length) return '';
    var linhas = plano.pendencias.slice(0, max).map(function (p) { return p.placa + ' \u00b7 ' + p.tipo + ' \u00b7 ' + p.detalhe; });
    return '\n\nPend\u00eancias (' + plano.pendencias.length + '), primeiras ' + linhas.length + ':\n\u2022 ' + linhas.join('\n\u2022 ');
  }

  function executarComUi() {
    var ui = SpreadsheetApp.getUi();
    try {
      Auth.exigir(PERFIS);
      var sugerido = anoSugerido();
      var resp = ui.prompt('Gerar exerc\u00edcio', 'Ano do exerc\u00edcio (vazio = ' + sugerido + '):', ui.ButtonSet.OK_CANCEL);
      if (resp.getSelectedButton() !== ui.Button.OK) return;
      var texto = String(resp.getResponseText() || '').trim();
      var exercicio = texto ? Number(texto) : sugerido;
      if (!(exercicio >= 2020 && exercicio <= 2100)) throw new Error('Ano inv\u00e1lido: ' + texto);
      var plano = planejar(exercicio);
      var resumo = Core.exercicio.resumoPlano(plano).join('\n') + textoPendencias_(plano, 15);
      if (!plano.novas.length && !plano.atualizar.length && !plano.encerrar.length) {
        ui.alert('Nada a mudar', resumo, ui.ButtonSet.OK);
        return;
      }
      if (ui.alert('Confirmar gera\u00e7\u00e3o', resumo + '\n\nGravar na aba OBRIGACOES?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
      var r = gravar(plano);
      ui.alert('Exerc\u00edcio ' + exercicio + ' gerado',
        r.inseridos + ' obriga\u00e7\u00e3o(\u00f5es) nova(s), ' + r.atualizados + ' atualizada(s). As pend\u00eancias continuam na gera\u00e7\u00e3o seguinte at\u00e9 serem resolvidas (tabelas de refer\u00eancia e valores venais).',
        ui.ButtonSet.OK);
    } catch (e) {
      ui.alert('Erro ao gerar exerc\u00edcio', String((e && e.message) || e), ui.ButtonSet.OK);
    }
  }

  return { anoSugerido: anoSugerido, planejar: planejar, gravar: gravar, executarComUi: executarComUi };
})();


// ===== Importacao.js =====
/**
 * Importa\u00e7\u00e3o de CSVs da pasta "\ud83d\udce4 Importa\u00e7\u00e3o" (carga inicial da Fase 2).
 *
 * Arquivos aceitos (os que existirem s\u00e3o importados): FILIAIS.csv, LOCATARIOS.csv,
 * VEICULOS.csv, LOCACOES.csv (carga inicial: scripts/carga_inicial/carga_previa.py) e
 * CALENDARIO_VENCIMENTOS.csv, ALIQUOTAS_IPVA.csv, TAXAS_LICENCIAMENTO.csv (referencias/AAAA/)
 * e VALORES_VENAIS.csv (com a coluna veiculo_id ou placa).
 *
 * Fluxo: l\u00ea e valida tudo (n\u00facleo) \u2192 mostra o resumo \u2192 s\u00f3 grava se n\u00e3o houver erro e
 * voc\u00ea confirmar. Depois, os arquivos s\u00e3o renomeados com "[importado AAAA-MM-DD]".
 * Rodar de novo com os mesmos arquivos n\u00e3o duplica nada: grava pela chave (atualiza o
 * que mudou).
 */

/** Menu: \ud83d\ude9b Frota \u2192 Admin \u2192 Importar CSVs da pasta \ud83d\udce4 Importa\u00e7\u00e3o\u2026 */
function menuImportarCsv() {
  Importacao.executarComUi();
}

var Importacao = (function () {
  function pasta_() {
    var id = Config.obter('PASTA_IMPORTACAO_ID');
    if (!id) throw new Error('Pasta de importa\u00e7\u00e3o n\u00e3o configurada. Rode \ud83d\ude9b Frota \u2192 Admin \u2192 Criar/validar base.');
    return DriveApp.getFolderById(id);
  }

  function lerArquivos_() {
    var pasta = pasta_();
    var matrizes = {}, arquivos = {};
    Core.importacao.ORDEM_IMPORTACAO.forEach(function (t) {
      var it = pasta.getFilesByName(t + '.csv');
      if (!it.hasNext()) return;
      var f = it.next();
      if (it.hasNext()) throw new Error('H\u00e1 mais de um arquivo ' + t + '.csv na pasta \ud83d\udce4 Importa\u00e7\u00e3o. Deixe s\u00f3 um.');
      matrizes[t] = Utilities.parseCsv(f.getBlob().getDataAsString('UTF-8'));
      arquivos[t] = f;
    });
    return { matrizes: matrizes, arquivos: arquivos };
  }

  /** L\u00ea e valida, sem gravar nada. */
  function analisar() {
    Auth.exigir(['ADMIN']);
    var lidos = lerArquivos_();
    if (!Object.keys(lidos.matrizes).length) {
      throw new Error('Nenhum CSV reconhecido na pasta \ud83d\udce4 Importa\u00e7\u00e3o. Nomes aceitos: ' + Core.importacao.ORDEM_IMPORTACAO.map(function (t) { return t + '.csv'; }).join(', ') + '.');
    }
    var existentes = {};
    Core.importacao.ORDEM_IMPORTACAO.forEach(function (t) { existentes[t] = Db.lerTodos(t); });
    var analise = Core.importacao.prepararImportacao(lidos.matrizes, existentes);
    analise.arquivos = lidos.arquivos;
    return analise;
  }

  /** Grava uma an\u00e1lise sem erros. */
  function gravar(analise) {
    Auth.exigir(['ADMIN']);
    if (!analise.ok) throw new Error('A an\u00e1lise tem erros; nada foi gravado.');
    return LogExec.executar('IMPORTACAO_CSV', function (contagens) {
      Core.importacao.ORDEM_IMPORTACAO.forEach(function (t) {
        var regs = analise.porTabela[t].registros;
        if (!regs.length) return;
        var r = Db.upsert(t, regs, { origem: 'IMPORTACAO', detalhe: t + '.csv' });
        contagens[t] = { inseridos: r.inseridos, atualizados: r.atualizados, inalterados: r.inalterados };
      });
      var carimbo = '[importado ' + Util.hojeIso() + '] ';
      Object.keys(analise.arquivos).forEach(function (t) {
        var f = analise.arquivos[t];
        f.setName(carimbo + f.getName());
      });
      return contagens;
    });
  }

  function lista_(titulo, itens, max) {
    if (!itens.length) return '';
    return '\n\n' + titulo + ' (' + itens.length + '):\n\u2022 ' + itens.slice(0, max).join('\n\u2022 ') + (itens.length > max ? '\n\u2022 \u2026' : '');
  }

  function executarComUi() {
    var ui = SpreadsheetApp.getUi();
    try {
      var a = analisar();
      var resumo = Core.importacao.resumoImportacao(a).join('\n');
      if (!a.ok) {
        ui.alert('Importa\u00e7\u00e3o bloqueada: nada foi gravado', resumo + lista_('Erros', a.erros, 25) + lista_('Avisos', a.avisos, 10), ui.ButtonSet.OK);
        return;
      }
      var resp = ui.alert('Confirmar importa\u00e7\u00e3o', resumo + lista_('Avisos', a.avisos, 15) + '\n\nGravar na base?', ui.ButtonSet.YES_NO);
      if (resp !== ui.Button.YES) return;
      var c = gravar(a);
      var linhas = Object.keys(c).map(function (t) {
        return t + ': ' + c[t].inseridos + ' inserido(s), ' + c[t].atualizados + ' atualizado(s), ' + c[t].inalterados + ' sem mudan\u00e7a';
      });
      ui.alert('Importa\u00e7\u00e3o conclu\u00edda', linhas.join('\n') + '\n\nOs arquivos foram renomeados com "[importado \u2026]". Detalhes nas abas AUDITORIA e LOG_EXECUCAO.', ui.ButtonSet.OK);
    } catch (e) {
      ui.alert('Erro na importa\u00e7\u00e3o', String((e && e.message) || e), ui.ButtonSet.OK);
    }
  }

  return { analisar: analisar, gravar: gravar, executarComUi: executarComUi };
})();


// ===== LogExec.js =====
/**
 * Registro de execu\u00e7\u00f5es (rotinas, gatilhos, setup) na aba LOG_EXECUCAO.
 */
var LogExec = (function () {
  /**
   * Executa `fn(contagens)` registrando in\u00edcio, fim, dura\u00e7\u00e3o, status e erro.
   * `fn` pode preencher o objeto `contagens` (ex.: {processados: 3}) e definir
   * `contagens._status = 'PARCIAL'` quando parar antes do fim por limite de tempo.
   */
  function executar(rotina, fn) {
    var inicio = new Date();
    var id = Utilities.formatDate(inicio, Util.TZ, 'yyyyMMdd-HHmmss') + '-' + Util.idCurto();
    var contagens = {};
    var status = 'OK';
    var erro = '';
    try {
      return fn(contagens);
    } catch (e) {
      status = 'ERRO';
      erro = String((e && e.stack) || e);
      throw e;
    } finally {
      if (status === 'OK' && contagens._status) status = contagens._status;
      delete contagens._status;
      var fim = new Date();
      try {
        Db.inserir('LOG_EXECUCAO', [{
          execucao_id: id,
          rotina: rotina,
          inicio: Util.isoDataHoraDeDate(inicio),
          fim: Util.isoDataHoraDeDate(fim),
          duracao_seg: Math.round((fim.getTime() - inicio.getTime()) / 100) / 10,
          status: status,
          contagens_json: JSON.stringify(contagens),
          erro: erro.slice(0, 45000),
          usuario: Util.quem(),
        }], { semAuditoria: true });
      } catch (e2) {
        console.error('N\u00e3o foi poss\u00edvel gravar LOG_EXECUCAO: ' + e2);
      }
    }
  }

  return { executar: executar };
})();


// ===== Menu.js =====
/**
 * Menu "\ud83d\ude9b Frota" na planilha base.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('\ud83d\ude9b Frota')
    .addItem('Abrir painel', 'menuAbrirPainel')
    .addSeparator()
    .addItem('Processar documentos agora', 'menuProcessarDocumentos')
    .addItem('Gerar exerc\u00edcio\u2026', 'menuGerarExercicio')
    .addItem('Enviar resumo agora', 'menuEnviarResumo')
    .addSeparator()
    .addSubMenu(ui.createMenu('Admin')
      .addItem('Criar/validar base', 'criarOuValidarBase')
      .addItem('Reaplicar formatos e prote\u00e7\u00f5es', 'criarOuValidarBaseForcado')
      .addItem('Importar CSVs da pasta \ud83d\udce4 Importa\u00e7\u00e3o\u2026', 'menuImportarCsv')
      .addItem('Testar meu acesso', 'menuTestarAcesso')
      .addItem('Sobre', 'menuSobre'))
    .addToUi();
}

function menuAbrirPainel() {
  var url = '';
  try { url = Config.obter('URL_WEBAPP'); } catch (e) { url = ''; }
  var ui = SpreadsheetApp.getUi();
  if (!url) {
    ui.alert('Painel ainda n\u00e3o implantado',
      'Implante o Web App (Extens\u00f5es \u2192 Apps Script \u2192 Implantar \u2192 Nova implanta\u00e7\u00e3o \u2192 App da Web) e cole o endere\u00e7o na CONFIG, chave URL_WEBAPP. O passo a passo est\u00e1 em docs/runbook.md.',
      ui.ButtonSet.OK);
    return;
  }
  var html = HtmlService.createHtmlOutput(
    '<div style="font-family:Arial,sans-serif;padding:8px">' +
    '<p><a href="' + url + '" target="_blank" rel="noopener" style="font-size:16px">Abrir o painel da frota \u2197</a></p>' +
    '<p style="color:#666;font-size:12px">Se n\u00e3o abrir, copie: ' + url + '</p></div>'
  ).setWidth(420).setHeight(130);
  ui.showModelessDialog(html, '\ud83d\ude9b Painel da Frota');
}

function emBreve_(funcao, fase) {
  var ui = SpreadsheetApp.getUi();
  ui.alert(funcao, 'Dispon\u00edvel a partir da ' + fase + ' do projeto.', ui.ButtonSet.OK);
}

function menuProcessarDocumentos() { emBreve_('Processar documentos', 'Fase 5'); }
function menuEnviarResumo() { emBreve_('Enviar resumo', 'Fase 8'); }

function menuTestarAcesso() {
  var ui = SpreadsheetApp.getUi();
  var ctx = Auth.contexto();
  ui.alert('Meu acesso',
    'E-mail: ' + (ctx.email || '(n\u00e3o identificado)') +
    '\nPerfil: ' + (ctx.perfil || 'sem perfil (pe\u00e7a ao ADMIN para cadastrar em USUARIOS)') +
    '\nV\u00ea dados pessoais de motoristas: ' + (Auth.podeVerDadosPessoais(ctx.perfil) ? 'sim' : 'n\u00e3o'),
    ui.ButtonSet.OK);
}

function menuSobre() {
  var ui = SpreadsheetApp.getUi();
  ui.alert('Painel de Frota Gobor', 'Vers\u00e3o ' + Core.VERSAO + '\nFuso: ' + Util.TZ + '\nDocumenta\u00e7\u00e3o: docs/ no reposit\u00f3rio.', ui.ButtonSet.OK);
}


// ===== Setup.js =====
/**
 * Cria\u00e7\u00e3o e valida\u00e7\u00e3o da base (idempotente): pode rodar quantas vezes quiser.
 *
 * - Cria as abas que faltam e acrescenta, no fim, as colunas que faltam. Nunca apaga nem
 *   reordena colunas; colunas extras criadas \u00e0 m\u00e3o s\u00e3o mantidas e s\u00f3 reportadas.
 * - Aplica cabe\u00e7alho congelado, filtro, notas com a descri\u00e7\u00e3o de cada coluna, formatos
 *   (texto puro para RENAVAM/CNPJ/IDs, data, R$), listas suspensas e prote\u00e7\u00f5es (abas de
 *   sistema, cabe\u00e7alho e colunas calculadas). S\u00f3 reaplica quando a defini\u00e7\u00e3o da tabela muda,
 *   ou quando o ADMIN pede "Reaplicar formatos e prote\u00e7\u00f5es".
 * - Semeia CONFIG (s\u00f3 chaves que faltam) e USUARIOS (quem roda vira ADMIN, se vazia).
 * - Cria a planilha restrita de motoristas (D-15) e a estrutura de pastas no Drive (\u00a76.1).
 */

/** Menu: \ud83d\ude9b Frota \u2192 Admin \u2192 Criar/validar base */
function criarOuValidarBase() {
  Setup.executarComUi(false);
}

/** Menu: \ud83d\ude9b Frota \u2192 Admin \u2192 Reaplicar formatos e prote\u00e7\u00f5es */
function criarOuValidarBaseForcado() {
  Setup.executarComUi(true);
}

var Setup = (function () {
  var ORCAMENTO_MS = 270000;
  var MARCA = '[frota]';
  var COR_CABECALHO = '#1f3a5f';
  var CONGELAR_1A_COLUNA = ['VEICULOS', 'OBRIGACOES', 'MULTAS', 'MOTORISTAS'];
  var ABAS_PADRAO = ['P\u00e1gina1', 'Pagina1', 'Planilha1', 'Sheet1'];
  /**
   * Linhas m\u00ednimas por aba. Formatos, listas e prote\u00e7\u00f5es de coluna cobrem a aba inteira
   * desde o in\u00edcio. Ex.: as obriga\u00e7\u00f5es de 2027 (\u2248210 ve\u00edculos \u00d7 parcelas) passam de 1.000.
   */
  var CAPACIDADE = {
    OBRIGACOES: 6000, MULTAS: 3000, DOCUMENTOS: 3000, VALORES_VENAIS: 2000, CALENDARIO_VENCIMENTOS: 2000,
    AUDITORIA: 5000, AUDITORIA_RESTRITA: 3000, LOG_EXECUCAO: 3000, SNAPSHOT_KPI: 5000, DESCONTOS_FOLHA: 2000,
  };
  var CAPACIDADE_PADRAO = 1000;
  var FORMATOS = {
    data: 'dd/mm/yyyy',
    datahora: 'dd/mm/yyyy hh:mm',
    moeda: '"R$" #,##0.00',
    pct: '0.00',
    inteiro: '0',
    sn: '@',
    texto_longo: '@',
    json: '@',
    email: '@',
    emails: '@',
  };

  function formatoDe_(col) {
    if (Core.schema.TIPOS_TEXTO_PURO.indexOf(col.tipo) >= 0) return '@';
    return FORMATOS[col.tipo] || null;
  }

  function regraValidacao_(col) {
    var b = SpreadsheetApp.newDataValidation();
    switch (col.tipo) {
      case 'enum':
        return b.requireValueInList(Core.schema.ENUMS[col.enum], true).setAllowInvalid(false).setHelpText('Escolha um valor da lista').build();
      case 'sn':
        return b.requireValueInList(['S', 'N'], true).setAllowInvalid(false).setHelpText('S ou N').build();
      case 'data':
        return b.requireDate().setAllowInvalid(false).setHelpText('Data no formato dd/mm/aaaa').build();
      case 'moeda':
        return b.requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).setHelpText('Valor em R$ (n\u00famero)').build();
      case 'pct':
        return b.requireNumberBetween(0, 100).setAllowInvalid(false).setHelpText('Percentual em pontos: 1,9 = 1,9%').build();
      default:
        return null;
    }
  }

  function notaDe_(col) {
    if (!col) return 'Coluna extra (n\u00e3o faz parte do sistema)';
    var partes = [];
    if (col.descricao) partes.push(col.descricao);
    if (col.tipo === 'enum') partes.push('Lista: ' + Core.schema.ENUMS[col.enum].join(', '));
    if (col.obrigatorio) partes.push('Obrigat\u00f3rio');
    if (col.calculada) partes.push('Calculado pelo sistema (protegido)');
    if (col.fk) partes.push('Refer\u00eancia: ' + col.fk);
    return partes.join('\n');
  }

  function editoresSistema_() {
    var lista = [Util.emailProprietario()];
    try {
      Auth.emailsDosAdmins().forEach(function (e) { if (lista.indexOf(e) < 0) lista.push(e); });
    } catch (e) { /* USUARIOS ainda n\u00e3o existe */ }
    return lista.filter(Boolean);
  }

  function aplicarEditores_(protecao, editores) {
    protecao.addEditors(editores);
    var remover = protecao.getEditors().filter(function (u) {
      return editores.indexOf(String(u.getEmail()).toLowerCase()) < 0;
    });
    try {
      if (remover.length) protecao.removeEditors(remover);
      if (protecao.canDomainEdit()) protecao.setDomainEdit(false);
    } catch (e) {
      // Em Drive compartilhado, gestores do drive podem n\u00e3o ser remov\u00edveis: segue com aviso.
      console.warn('Prote\u00e7\u00e3o "' + protecao.getDescription() + '": ' + e);
    }
  }

  function protegerAba_(sh, def, cabecalho) {
    var tipos = [SpreadsheetApp.ProtectionType.SHEET, SpreadsheetApp.ProtectionType.RANGE];
    tipos.forEach(function (tipo) {
      sh.getProtections(tipo).forEach(function (p) {
        if (String(p.getDescription() || '').indexOf(MARCA) === 0) p.remove();
      });
    });
    var editores = editoresSistema_();
    if (def.sistema) {
      aplicarEditores_(sh.protect().setDescription(MARCA + ' Aba de sistema: alterada s\u00f3 pelo sistema'), editores);
      return;
    }
    aplicarEditores_(sh.getRange(1, 1, 1, cabecalho.length).protect().setDescription(MARCA + ' Cabe\u00e7alho'), editores);
    var cols = {};
    def.colunas.forEach(function (c) { cols[c.nome] = c; });
    cabecalho.forEach(function (h, i) {
      var col = cols[h];
      if (col && col.calculada) {
        var faixa = sh.getRange(2, i + 1, sh.getMaxRows() - 1, 1);
        aplicarEditores_(faixa.protect().setDescription(MARCA + ' Calculado: ' + h), editores);
      }
    });
  }

  function formatarAba_(sh, def, cabecalho) {
    var capacidade = CAPACIDADE[def.nome] || CAPACIDADE_PADRAO;
    if (sh.getMaxRows() < capacidade) sh.insertRowsAfter(sh.getMaxRows(), capacidade - sh.getMaxRows());
    var nLinhas = sh.getMaxRows() - 1;
    var nCols = cabecalho.length;
    var cols = {};
    def.colunas.forEach(function (c) { cols[c.nome] = c; });

    var faixa = sh.getRange(1, 1, 1, nCols);
    faixa.setFontWeight('bold').setBackground(COR_CABECALHO).setFontColor('#ffffff').setVerticalAlignment('middle');
    faixa.setNotes([cabecalho.map(function (h) { return notaDe_(cols[h]); })]);
    sh.setFrozenRows(1);
    if (CONGELAR_1A_COLUNA.indexOf(def.nome) >= 0) sh.setFrozenColumns(1);

    cabecalho.forEach(function (h, i) {
      var col = cols[h];
      if (!col) return;
      var dados = sh.getRange(2, i + 1, nLinhas, 1);
      var fmt = formatoDe_(col);
      if (fmt) dados.setNumberFormat(fmt);
      dados.setDataValidation(col.calculada ? null : regraValidacao_(col));
    });

    var filtro = sh.getFilter();
    if (filtro) filtro.remove();
    sh.getRange(1, 1, sh.getMaxRows(), nCols).createFilter();

    protegerAba_(sh, def, cabecalho);
  }

  function lerCabecalho_(sh) {
    var n = sh.getLastColumn();
    if (!n) return [];
    return sh.getRange(1, 1, 1, n).getValues()[0].map(function (h) { return String(h).trim(); });
  }

  function garantirAba_(ss, def, rel, opcoes) {
    var sh = ss.getSheetByName(def.nome);
    var nova = !sh;
    if (nova) {
      sh = ss.insertSheet(def.nome);
      rel.abasCriadas.push(def.nome);
    }
    var esperadas = def.colunas.map(function (c) { return c.nome; });
    var ultimaCol = sh.getLastColumn();
    var cabecalho = lerCabecalho_(sh);
    var plano = Core.tabela.planoCabecalho(cabecalho, esperadas);
    if (plano.faltando.length) {
      var precisa = ultimaCol + plano.faltando.length;
      if (sh.getMaxColumns() < precisa) sh.insertColumnsAfter(sh.getMaxColumns(), precisa - sh.getMaxColumns());
      sh.getRange(1, ultimaCol + 1, 1, plano.faltando.length).setValues([plano.faltando]);
      if (!nova) rel.colunasAdicionadas.push(def.nome + ': ' + plano.faltando.join(', '));
      cabecalho = lerCabecalho_(sh);
    }
    if (plano.extras.length) rel.colunasExtras.push(def.nome + ': ' + plano.extras.join(', '));
    if (nova && sh.getMaxColumns() > cabecalho.length) sh.deleteColumns(cabecalho.length + 1, sh.getMaxColumns() - cabecalho.length);

    var props = Util.propriedades();
    var chaveProp = 'SETUP_' + def.nome;
    var assinatura = Core.schema.assinaturaTabela(def.nome, cabecalho) + ':' + sh.getSheetId();
    if (!opcoes.forcar && props.getProperty(chaveProp) === assinatura) {
      rel.abasSemMudanca++;
      return;
    }
    formatarAba_(sh, def, cabecalho);
    props.setProperty(chaveProp, assinatura);
    rel.abasFormatadas.push(def.nome);
  }

  function removerAbaPadrao_(ss) {
    ABAS_PADRAO.forEach(function (nome) {
      var sh = ss.getSheetByName(nome);
      if (sh && sh.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(sh);
    });
  }

  function ordenarAbas_(ss, defs) {
    defs.forEach(function (def, i) {
      var sh = ss.getSheetByName(def.nome);
      if (sh && sh.getIndex() !== i + 1) {
        ss.setActiveSheet(sh);
        ss.moveActiveSheet(i + 1);
      }
    });
  }

  function semearConfig_(rel) {
    var existentes = Db.porChave('CONFIG');
    var novos = Core.config.CONFIG_PADRAO.filter(function (c) { return !existentes[c[0]]; }).map(function (c) {
      return { chave: c[0], valor: c[1], tipo: c[2], descricao: c[3] };
    });
    if (novos.length) Db.inserir('CONFIG', novos, { origem: 'SCRIPT', detalhe: 'setup: par\u00e2metros padr\u00e3o' });
    rel.configCriadas = novos.length;
  }

  function semearUsuarios_(rel) {
    if (Db.contar('USUARIOS') > 0) return;
    var email = Util.emailProprietario() || Util.emailUsuario();
    Db.inserir('USUARIOS', [{ email: email, perfil: 'ADMIN', ativo: 'S', observacoes: 'Criado pelo setup (primeiro ADMIN)' }], { origem: 'SCRIPT', detalhe: 'setup' });
    rel.avisos.push(email + ' cadastrado como ADMIN em USUARIOS.');
  }

  function garantirPlanilhaMotoristas_(rel, opcoes) {
    var props = Util.propriedades();
    var id = props.getProperty('PLANILHA_MOTORISTAS_ID');
    var ssM;
    if (id) {
      try {
        ssM = SpreadsheetApp.openById(id);
      } catch (e) {
        throw new Error('N\u00e3o consegui abrir a planilha restrita de motoristas (ID ' + id + '). Verifique o acesso. Para criar outra, apague a propriedade PLANILHA_MOTORISTAS_ID do script.');
      }
    } else {
      ssM = SpreadsheetApp.create('\ud83d\udd12 Frota Gobor \u2014 Motoristas');
      var restrita = Config.obter('PASTA_RESTRITA_ID');
      if (restrita) DriveApp.getFileById(ssM.getId()).moveTo(DriveApp.getFolderById(restrita));
      props.setProperty('PLANILHA_MOTORISTAS_ID', ssM.getId());
      rel.avisos.push('Planilha "\ud83d\udd12 Frota Gobor \u2014 Motoristas" criada ' + (restrita ? 'na pasta restrita configurada' : 'no seu Meu Drive') + '. Compartilhe s\u00f3 com ADMIN e DP.');
    }
    ssM.setSpreadsheetTimeZone(Util.TZ);
    try { ssM.setSpreadsheetLocale('pt_BR'); } catch (e) { /* opcional */ }
    var defs = Core.schema.tabelasDaPlanilha('MOTORISTAS');
    defs.forEach(function (def) { garantirAba_(ssM, def, rel, opcoes); });
    removerAbaPadrao_(ssM);
    ordenarAbas_(ssM, defs);
    if (Config.obter('PLANILHA_MOTORISTAS_ID') !== ssM.getId()) Config.definir('PLANILHA_MOTORISTAS_ID', ssM.getId());
  }

  function subpasta_(pai, nome) {
    var it = pai.getFoldersByName(nome);
    return it.hasNext() ? it.next() : pai.createFolder(nome);
  }

  function garantirPastas_(ss, rel) {
    var raizId = Config.obter('PASTA_RAIZ_ID');
    var raiz;
    if (raizId) {
      raiz = DriveApp.getFolderById(raizId);
    } else {
      var pais = DriveApp.getFileById(ss.getId()).getParents();
      var pai = pais.hasNext() ? pais.next() : DriveApp.getRootFolder();
      raiz = subpasta_(pai, '\ud83d\ude9b Frota Gobor \u2014 Documentos');
      Config.definir('PASTA_RAIZ_ID', raiz.getId());
      rel.pastasCriadas.push(raiz.getName());
    }
    [
      ['PASTA_ENTRADA_ID', '\ud83d\udce5 Entrada'],
      ['PASTA_REVISAO_ID', '\u26a0\ufe0f Revis\u00e3o'],
      ['PASTA_ERROS_ID', '\u274c Erros'],
      ['PASTA_DUPLICADOS_ID', '\ud83d\udd01 Duplicados'],
      ['PASTA_MULTAS_ID', 'Multas'],
      ['PASTA_IPVA_ID', 'IPVA'],
      ['PASTA_LICENCIAMENTO_ID', 'Licenciamento'],
      ['PASTA_CRLV_ID', 'CRLV'],
      ['PASTA_COMPROVANTES_ID', 'Comprovantes'],
      ['PASTA_IMPORTACAO_ID', '\ud83d\udce4 Importa\u00e7\u00e3o'],
    ].forEach(function (p) {
      if (Config.obter(p[0])) return;
      var pasta = subpasta_(raiz, p[1]);
      Config.definir(p[0], pasta.getId());
      rel.pastasCriadas.push(p[1]);
    });
    if (!Config.obter('PASTA_MOTORISTAS_ID')) {
      var restrita = Config.obter('PASTA_RESTRITA_ID');
      var paiRestrito = restrita ? DriveApp.getFolderById(restrita) : DriveApp.getRootFolder();
      var pm = subpasta_(paiRestrito, '\ud83d\udd12 Motoristas \u2014 documentos');
      Config.definir('PASTA_MOTORISTAS_ID', pm.getId());
      rel.pastasCriadas.push(pm.getName());
      rel.avisos.push('Pasta "\ud83d\udd12 Motoristas \u2014 documentos" criada ' + (restrita ? 'na pasta restrita configurada' : 'no seu Meu Drive') + ' (fora do Drive compartilhado, para manter o acesso restrito).');
    }
  }

  function exigirAdmin_() {
    var ctx = Auth.contexto();
    if (ctx.perfil !== 'ADMIN') throw new Error('S\u00f3 ADMIN pode rodar o setup (voc\u00ea: ' + (ctx.email || 'n\u00e3o identificado') + ').');
    return ctx;
  }

  /**
   * @param {{forcar?:boolean}} opcoes forcar = reaplicar formatos e prote\u00e7\u00f5es em todas as abas
   * @returns {object} relat\u00f3rio
   */
  function executar(opcoes) {
    opcoes = opcoes || {};
    exigirAdmin_();
    var inicio = Date.now();
    var rel = {
      abasCriadas: [], abasFormatadas: [], abasSemMudanca: 0, colunasAdicionadas: [], colunasExtras: [],
      pastasCriadas: [], avisos: [], configCriadas: 0, incompleto: false,
    };
    return LogExec.executar('SETUP', function (contagens) {
      var ss = SpreadsheetApp.getActive();
      Util.propriedades().setProperty('PLANILHA_BASE_ID', ss.getId());
      ss.setSpreadsheetTimeZone(Util.TZ);
      try { ss.setSpreadsheetLocale('pt_BR'); } catch (e) { /* opcional */ }

      var defs = Core.schema.tabelasDaPlanilha('BASE');
      for (var i = 0; i < defs.length; i++) {
        if (Date.now() - inicio > ORCAMENTO_MS) { rel.incompleto = true; break; }
        garantirAba_(ss, defs[i], rel, opcoes);
      }
      if (!rel.incompleto) {
        removerAbaPadrao_(ss);
        ordenarAbas_(ss, defs);
        semearConfig_(rel);
        semearUsuarios_(rel);
        Config.limparCache();
        Auth.limparCache();
        garantirPlanilhaMotoristas_(rel, opcoes);
        garantirPastas_(ss, rel);
      }
      contagens.abas_criadas = rel.abasCriadas.length;
      contagens.abas_formatadas = rel.abasFormatadas.length;
      contagens.config_criadas = rel.configCriadas;
      contagens.pastas_criadas = rel.pastasCriadas.length;
      if (rel.incompleto) contagens._status = 'PARCIAL';
      return rel;
    });
  }

  function formatarRelatorio(rel) {
    var l = [];
    if (rel.incompleto) l.push('\u23f1\ufe0f O tempo da execu\u00e7\u00e3o acabou antes do fim. Rode "Criar/validar base" de novo para continuar.');
    l.push('Abas criadas: ' + (rel.abasCriadas.length ? rel.abasCriadas.join(', ') : 'nenhuma'));
    l.push('Abas (re)formatadas: ' + rel.abasFormatadas.length + ' \u00b7 sem mudan\u00e7a: ' + rel.abasSemMudanca);
    if (rel.colunasAdicionadas.length) l.push('Colunas acrescentadas no fim: ' + rel.colunasAdicionadas.join(' | '));
    if (rel.colunasExtras.length) l.push('Colunas extras mantidas (n\u00e3o s\u00e3o do sistema): ' + rel.colunasExtras.join(' | '));
    if (rel.configCriadas) l.push('Par\u00e2metros criados na CONFIG: ' + rel.configCriadas);
    if (rel.pastasCriadas.length) l.push('Pastas criadas no Drive: ' + rel.pastasCriadas.join(', '));
    rel.avisos.forEach(function (a) { l.push('\u2022 ' + a); });
    return l.join('\n');
  }

  function executarComUi(forcar) {
    var ui = SpreadsheetApp.getUi();
    try {
      var rel = executar({ forcar: forcar });
      ui.alert(rel.incompleto ? 'Setup parcial' : 'Base pronta', formatarRelatorio(rel), ui.ButtonSet.OK);
    } catch (e) {
      ui.alert('Erro no setup', String((e && e.message) || e), ui.ButtonSet.OK);
    }
  }

  return { executar: executar, executarComUi: executarComUi, formatarRelatorio: formatarRelatorio };
})();


// ===== Util.js =====
/**
 * Utilidades do Apps Script: fuso, convers\u00e3o Date \u2194 ISO, usu\u00e1rio atual e trava de escrita.
 *
 * Nenhum arquivo do servidor usa outro m\u00f3dulo (Core, Db, Config\u2026) no n\u00edvel superior: s\u00f3
 * dentro de fun\u00e7\u00f5es. Assim a ordem de carga dos arquivos n\u00e3o importa.
 */
var Util = (function () {
  var TZ = 'America/Sao_Paulo';
  var profundidadeLock = 0;

  function isoDeDate(d) {
    return Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
  }

  function isoDataHoraDeDate(d) {
    return Utilities.formatDate(d, TZ, 'yyyy-MM-dd HH:mm:ss');
  }

  /** "2027-01-15" \u2192 Date \u00e0 meia-noite em S\u00e3o Paulo. */
  function dateDeIso(iso) {
    return Utilities.parseDate(iso, TZ, 'yyyy-MM-dd');
  }

  /** "2027-01-15 10:30[:00]" \u2192 Date em S\u00e3o Paulo. */
  function dateDeIsoDataHora(texto) {
    var s = String(texto).replace('T', ' ');
    var formato = s.length > 16 ? 'yyyy-MM-dd HH:mm:ss' : s.length > 10 ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd';
    return Utilities.parseDate(s.slice(0, formato.length), TZ, formato);
  }

  function hojeIso() {
    return isoDeDate(new Date());
  }

  function agoraIso() {
    return isoDataHoraDeDate(new Date());
  }

  /** E-mail de quem est\u00e1 usando (no Web App, o visitante do dom\u00ednio). */
  function emailUsuario() {
    try {
      return String(Session.getActiveUser().getEmail() || '').toLowerCase();
    } catch (e) {
      return '';
    }
  }

  /** E-mail de quem o script executa como (no Web App, o propriet\u00e1rio). */
  function emailProprietario() {
    try {
      return String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
    } catch (e) {
      return '';
    }
  }

  function quem() {
    return emailUsuario() || emailProprietario() || 'sistema';
  }

  /**
   * Executa `fn` com a trava de script (uma escrita por vez). Reentrante: chamadas
   * aninhadas na mesma execu\u00e7\u00e3o n\u00e3o tentam travar de novo.
   */
  function comLock(fn) {
    if (profundidadeLock > 0) {
      profundidadeLock++;
      try { return fn(); } finally { profundidadeLock--; }
    }
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    profundidadeLock = 1;
    try {
      return fn();
    } finally {
      profundidadeLock = 0;
      lock.releaseLock();
    }
  }

  function idCurto() {
    return Utilities.getUuid().replace(/-/g, '').slice(0, 8);
  }

  function propriedades() {
    return PropertiesService.getScriptProperties();
  }

  return {
    TZ: TZ,
    isoDeDate: isoDeDate,
    isoDataHoraDeDate: isoDataHoraDeDate,
    dateDeIso: dateDeIso,
    dateDeIsoDataHora: dateDeIsoDataHora,
    hojeIso: hojeIso,
    agoraIso: agoraIso,
    emailUsuario: emailUsuario,
    emailProprietario: emailProprietario,
    quem: quem,
    comLock: comLock,
    idCurto: idCurto,
    propriedades: propriedades,
  };
})();


// ===== WebApp.js =====
/**
 * Web App (painel). Implantado como "Executar como: eu (propriet\u00e1rio)" e "Acesso:
 * qualquer pessoa do dom\u00ednio". O perfil de cada visitante vem de Auth (aba USUARIOS).
 */
function doGet() {
  // PAINEL_HTML vem de 01_painel.js (gerado no build a partir de apps-script/ui/).
  var t = HtmlService.createTemplate(PAINEL_HTML);
  t.versao = Core.VERSAO;
  return t.evaluate()
    .setTitle('Frota Gobor')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}
