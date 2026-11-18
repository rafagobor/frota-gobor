/**
 * Acesso às abas pelo NOME do cabeçalho (nunca pelo índice da coluna), com leitura e
 * escrita em bloco, validação pelo esquema, colunas de controle, trava e auditoria.
 *
 * Datas: na planilha ficam como Date; no núcleo e nos registros, como texto ISO.
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
    if (!id) throw new Error('Planilha base não identificada. Rode 🚛 Frota → Admin → Criar/validar base.');
    return abrir_(id);
  }

  function motoristas() {
    var id = Util.propriedades().getProperty('PLANILHA_MOTORISTAS_ID');
    if (!id) throw new Error('A planilha restrita de motoristas ainda não existe. Rode 🚛 Frota → Admin → Criar/validar base.');
    return abrir_(id);
  }

  function planilhaDe(def) {
    return def.planilha === 'MOTORISTAS' ? motoristas() : base();
  }

  function aba_(nome) {
    var def = Core.schema.tabela(nome);
    var sh = planilhaDe(def).getSheetByName(nome);
    if (!sh) throw new Error('Aba "' + nome + '" não encontrada. Rode 🚛 Frota → Admin → Criar/validar base.');
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
      throw new Error('Aba ' + a.def.nome + ' sem as colunas: ' + faltando.join(', ') + '. Rode 🚛 Frota → Admin → Criar/validar base.');
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
   * Todos os registros da tabela. Cada registro traz `_linha` (nº da linha na aba), útil
   * só para diagnóstico: nunca usar como identificador.
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

  /** Mapa chave → registro. */
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
   * Insere e atualiza numa única leitura da aba.
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
          if (ctx.somenteInserir) throw new Error(nome + ': já existe ' + k);
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
          if (ctx.somenteAtualizar) throw new Error(nome + ': não encontrado ' + k);
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
