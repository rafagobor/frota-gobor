/**
 * Simulação mínima dos serviços do Apps Script usados pelo servidor, para testar em Node
 * o setup, a camada de dados, a auditoria e os perfis. Não substitui o teste real na
 * conta Google: serve para pegar erros de lógica antes da implantação.
 */
import vm from 'node:vm';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const OFFSET_SP_MS = -3 * 3600 * 1000; // America/Sao_Paulo (sem horário de verão desde 2019)

function iterador(lista) {
  let i = 0;
  return { hasNext: () => i < lista.length, next: () => lista[i++] };
}

export function criarAmbiente({ usuario = 'rafael@gobor.com.br', proprietario = 'rafael@gobor.com.br' } = {}) {
  let seq = 0;
  const novoId = (p) => `${p}-${++seq}`;
  const estado = { usuario, proprietario, respostaUi: 'YES' };
  const planilhas = {}, pastas = {}, arquivos = {};
  const props = {}, cache = {};
  const lock = { preso: false };
  const alertas = [];
  const menus = [];

  class File {
    constructor(nome, conteudo) { this.id = novoId('arquivo'); this.nome = nome; this.conteudo = conteudo; }
    getId() { return this.id; }
    getName() { return this.nome; }
    setName(n) { this.nome = n; return this; }
    getBlob() { return { getDataAsString: () => this.conteudo }; }
  }

  class Folder {
    constructor(nome) { this.id = novoId('pasta'); this.nome = nome; this.filhos = []; this.arquivos = []; pastas[this.id] = this; }
    getId() { return this.id; }
    getName() { return this.nome; }
    createFolder(n) { const f = new Folder(n); this.filhos.push(f); return f; }
    getFoldersByName(n) { return iterador(this.filhos.filter((f) => f.nome === n)); }
    createFile(nome, conteudo) { const f = new File(nome, conteudo); this.arquivos.push(f); return f; }
    getFilesByName(n) { return iterador(this.arquivos.filter((f) => f.nome === n)); }
  }
  const meuDrive = new Folder('Meu Drive');
  const driveCompartilhado = new Folder('Frota (Drive compartilhado)');

  class Protection {
    constructor(tipo, sh) { this.tipo = tipo; this.sh = sh; this.desc = ''; this.editores = []; this.dominio = true; }
    setDescription(d) { this.desc = d; return this; }
    getDescription() { return this.desc; }
    addEditors(l) { l.forEach((e) => { if (!this.editores.includes(e)) this.editores.push(e); }); return this; }
    getEditors() { return this.editores.map((e) => ({ getEmail: () => e })); }
    removeEditors(l) {
      const rm = l.map((u) => (typeof u === 'string' ? u : u.getEmail()));
      this.editores = this.editores.filter((e) => !rm.includes(e));
      return this;
    }
    canDomainEdit() { return this.dominio; }
    setDomainEdit(b) { this.dominio = b; return this; }
    remove() { this.sh.protecoes = this.sh.protecoes.filter((p) => p !== this); }
  }

  class Range {
    constructor(sh, r, c, nr, nc) { Object.assign(this, { sh, r, c, nr, nc }); }
    getValues() {
      return Array.from({ length: this.nr }, (_, i) => Array.from({ length: this.nc }, (_, j) => this.sh.get(this.r + i, this.c + j)));
    }
    setValues(v) {
      if (v.length !== this.nr || v.some((l) => l.length !== this.nc)) throw new Error(`setValues: dimensões ${v.length}x${v[0] && v[0].length} ≠ ${this.nr}x${this.nc}`);
      v.forEach((linha, i) => linha.forEach((x, j) => this.sh.set(this.r + i, this.c + j, x)));
      return this;
    }
    setNumberFormat(f) { for (let j = 0; j < this.nc; j++) this.sh.formatos[this.c + j] = f; return this; }
    setDataValidation(v) { for (let j = 0; j < this.nc; j++) this.sh.validacoes[this.c + j] = v; return this; }
    setNotes(n) { this.sh.notas = n[0]; return this; }
    setFontWeight() { return this; }
    setBackground() { return this; }
    setFontColor() { return this; }
    setVerticalAlignment() { return this; }
    protect() { const p = new Protection('RANGE', this.sh); p.coluna = this.c; this.sh.protecoes.push(p); return p; }
    createFilter() { const sh = this.sh; sh.filtro = { remove: () => { sh.filtro = null; } }; return sh.filtro; }
  }

  class Sheet {
    constructor(ss, nome) {
      Object.assign(this, { ss, nome, dados: [], maxRows: 1000, maxCols: 26, id: ++seq, formatos: {}, validacoes: {}, protecoes: [], filtro: null, notas: [] });
    }
    getName() { return this.nome; }
    getSheetId() { return this.id; }
    getIndex() { return this.ss.abas.indexOf(this) + 1; }
    get(r, c) { const l = this.dados[r - 1]; const v = l ? l[c - 1] : undefined; return v === undefined || v === null ? '' : v; }
    set(r, c, v) {
      if (r > this.maxRows || c > this.maxCols) throw new Error(`Célula fora da aba ${this.nome}: ${r},${c}`);
      while (this.dados.length < r) this.dados.push([]);
      this.dados[r - 1][c - 1] = v;
    }
    getLastRow() {
      for (let i = this.dados.length; i > 0; i--) if ((this.dados[i - 1] || []).some((v) => v !== '' && v !== undefined && v !== null)) return i;
      return 0;
    }
    getLastColumn() {
      let m = 0;
      this.dados.forEach((l) => l.forEach((v, j) => { if (v !== '' && v !== undefined && v !== null) m = Math.max(m, j + 1); }));
      return m;
    }
    getMaxRows() { return this.maxRows; }
    getMaxColumns() { return this.maxCols; }
    insertRowsAfter(_, n) { this.maxRows += n; }
    insertColumnsAfter(_, n) { this.maxCols += n; }
    deleteColumns(c, n) { this.maxCols -= n; this.dados.forEach((l) => l.splice(c - 1, n)); }
    getRange(r, c, nr = 1, nc = 1) {
      if (r < 1 || c < 1 || nr < 1 || nc < 1 || r + nr - 1 > this.maxRows || c + nc - 1 > this.maxCols) {
        throw new Error(`Intervalo fora da aba ${this.nome}: (${r},${c}) ${nr}x${nc}; aba ${this.maxRows}x${this.maxCols}`);
      }
      return new Range(this, r, c, nr, nc);
    }
    setFrozenRows(n) { this.congeladas = n; }
    setFrozenColumns(n) { this.colunasCongeladas = n; }
    getFilter() { return this.filtro; }
    getProtections(tipo) { return this.protecoes.filter((p) => p.tipo === tipo); }
    protect() { const p = new Protection('SHEET', this); this.protecoes.push(p); return p; }
    /** Ajuda para os testes: cabeçalho e registros brutos. */
    cabecalho() { return (this.dados[0] || []).map((h) => (h === undefined ? '' : h)); }
    coluna(nome) { return this.cabecalho().indexOf(nome) + 1; }
  }

  class Spreadsheet {
    constructor(nome, pasta) {
      this.id = novoId('planilha');
      this.nome = nome;
      this.abas = [new Sheet(this, 'Página1')];
      planilhas[this.id] = this;
      arquivos[this.id] = { pasta };
    }
    getId() { return this.id; }
    getName() { return this.nome; }
    getSheets() { return [...this.abas]; }
    getSheetByName(n) { return this.abas.find((a) => a.nome === n) || null; }
    insertSheet(n) {
      if (this.getSheetByName(n)) throw new Error(`Já existe a aba ${n}`);
      const s = new Sheet(this, n);
      this.abas.push(s);
      return s;
    }
    deleteSheet(s) { this.abas = this.abas.filter((a) => a !== s); }
    setSpreadsheetTimeZone(tz) { this.tz = tz; }
    setSpreadsheetLocale(l) { this.locale = l; }
    setActiveSheet(s) { this.ativa = s; }
    moveActiveSheet(pos) {
      const i = this.abas.indexOf(this.ativa);
      this.abas.splice(i, 1);
      this.abas.splice(pos - 1, 0, this.ativa);
    }
  }

  const base = new Spreadsheet('🚛 Frota Gobor — Base', driveCompartilhado);

  function construtorValidacao() {
    const regra = {};
    const proxy = new Proxy(regra, {
      get(alvo, k) {
        if (k === 'build') return () => ({ ...alvo });
        return (...args) => { alvo[k] = args; return proxy; };
      },
    });
    return proxy;
  }

  function cadeiaMenu(nome) {
    const m = { nome, itens: [] };
    const api = {
      addItem: (rotulo, fn) => { m.itens.push([rotulo, fn]); return api; },
      addSeparator: () => api,
      addSubMenu: (sub) => { m.itens.push(['>', sub._m]); return api; },
      addToUi: () => { menus.push(m); return api; },
      _m: m,
    };
    return api;
  }

  const ui = {
    createMenu: cadeiaMenu,
    alert: (...args) => { alertas.push(args); return args[2] === 'YES_NO' ? estado.respostaUi : 'OK'; },
    prompt: (...args) => { alertas.push(['PROMPT', ...args]); return { getSelectedButton: () => 'OK', getResponseText: () => estado.respostaPrompt || '' }; },
    showModelessDialog: () => {},
    ButtonSet: { OK: 'OK', YES_NO: 'YES_NO', OK_CANCEL: 'OK_CANCEL' },
    Button: { YES: 'YES', NO: 'NO', OK: 'OK' },
  };

  const pad = (n, w = 2) => String(n).padStart(w, '0');

  const Utilities = {
    formatDate(d, _tz, fmt) {
      const t = new Date(d.getTime() + OFFSET_SP_MS);
      return fmt
        .replace('yyyy', t.getUTCFullYear()).replace('MM', pad(t.getUTCMonth() + 1)).replace('dd', pad(t.getUTCDate()))
        .replace('HH', pad(t.getUTCHours())).replace('mm', pad(t.getUTCMinutes())).replace('ss', pad(t.getUTCSeconds()));
    },
    parseDate(s, _tz, fmt) {
      const pos = {};
      for (const tok of ['yyyy', 'MM', 'dd', 'HH', 'mm', 'ss']) {
        const i = fmt.indexOf(tok);
        if (i >= 0) pos[tok] = Number(s.slice(i, i + tok.length));
      }
      return new Date(Date.UTC(pos.yyyy, (pos.MM || 1) - 1, pos.dd || 1, pos.HH || 0, pos.mm || 0, pos.ss || 0) - OFFSET_SP_MS);
    },
    getUuid: () => randomUUID(),
    /** CSV RFC 4180 (aspas duplas, vírgula, quebras dentro de aspas). */
    parseCsv(texto) {
      const linhas = []; let linha = [], campo = '', aspas = false;
      for (let i = 0; i < texto.length; i++) {
        const ch = texto[i];
        if (aspas) {
          if (ch === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
          else if (ch === '"') aspas = false;
          else campo += ch;
        } else if (ch === '"') aspas = true;
        else if (ch === ',') { linha.push(campo); campo = ''; }
        else if (ch === '\n' || ch === '\r') {
          if (ch === '\r' && texto[i + 1] === '\n') i++;
          linha.push(campo); linhas.push(linha); linha = []; campo = '';
        } else campo += ch;
      }
      if (campo !== '' || linha.length) { linha.push(campo); linhas.push(linha); }
      return linhas;
    },
  };

  const logs = [];
  const globals = {
    Date,
    console: { log: (...a) => logs.push(['log', ...a]), warn: (...a) => logs.push(['warn', ...a]), error: (...a) => logs.push(['error', ...a]) },
    SpreadsheetApp: {
      getActive: () => base,
      getActiveSpreadsheet: () => base,
      openById: (id) => { if (!planilhas[id]) throw new Error(`Planilha ${id} não encontrada`); return planilhas[id]; },
      create: (nome) => new Spreadsheet(nome, meuDrive),
      newDataValidation: construtorValidacao,
      getUi: () => ui,
      ProtectionType: { SHEET: 'SHEET', RANGE: 'RANGE' },
    },
    DriveApp: {
      getFileById: (id) => ({
        getParents: () => iterador([arquivos[id].pasta]),
        moveTo: (pasta) => { arquivos[id].pasta = pasta; },
      }),
      getFolderById: (id) => { if (!pastas[id]) throw new Error(`Pasta ${id} não encontrada`); return pastas[id]; },
      getRootFolder: () => meuDrive,
    },
    Utilities,
    Session: {
      getActiveUser: () => ({ getEmail: () => estado.usuario }),
      getEffectiveUser: () => ({ getEmail: () => estado.proprietario }),
    },
    LockService: {
      getScriptLock: () => ({
        waitLock() { if (lock.preso) throw new Error('Trava já presa: reentrância não tratada'); lock.preso = true; },
        releaseLock() { lock.preso = false; },
      }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => (k in cache ? cache[k] : null),
        put: (k, v) => { cache[k] = v; },
        remove: (k) => { delete cache[k]; },
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (k in props ? props[k] : null),
        setProperty: (k, v) => { props[k] = String(v); },
        deleteProperty: (k) => { delete props[k]; },
      }),
    },
    HtmlService: {
      createTemplateFromFile: (nome) => {
        const t = { nome };
        t.evaluate = () => {
          const saida = { titulo: null, setTitle(x) { this.titulo = x; return this; }, addMetaTag() { return this; }, setXFrameOptionsMode() { return this; } };
          return saida;
        };
        return t;
      },
      createTemplate: (html) => {
        const t = { html };
        t.evaluate = () => ({ titulo: null, conteudo: html, setTitle(x) { this.titulo = x; return this; }, addMetaTag() { return this; }, setXFrameOptionsMode() { return this; } });
        return t;
      },
      createHtmlOutput: () => ({ setWidth() { return this; }, setHeight() { return this; } }),
      XFrameOptionsMode: { DEFAULT: 'DEFAULT' },
    },
  };

  return { globals, logs, estado, base, planilhas, pastas, meuDrive, driveCompartilhado, props, cache, alertas, menus, lock };
}

/** Carrega o bundle do núcleo e todos os arquivos do servidor num contexto isolado. */
export function carregarAppsScript(globals) {
  const ctx = vm.createContext({ ...globals });
  const dir = 'apps-script/server';
  const arquivos = readdirSync(dir).filter((n) => n.endsWith('.js')).sort();
  // Ordem invertida (exceto o núcleo) para provar que nada depende da ordem de carga.
  const ordem = ['00_core.js', ...arquivos.filter((n) => n !== '00_core.js').reverse()];
  for (const nome of ordem) vm.runInContext(readFileSync(join(dir, nome), 'utf8'), ctx, { filename: nome });
  return ctx;
}

/** Carrega o arquivo único dist/Frota.gs (instalação sem terminal). */
export function carregarArquivoUnico(globals) {
  const ctx = vm.createContext({ ...globals });
  vm.runInContext(readFileSync('dist/Frota.gs', 'utf8'), ctx, { filename: 'Frota.gs' });
  return ctx;
}
