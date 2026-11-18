/**
 * Criação e validação da base (idempotente): pode rodar quantas vezes quiser.
 *
 * - Cria as abas que faltam e acrescenta, no fim, as colunas que faltam. Nunca apaga nem
 *   reordena colunas; colunas extras criadas à mão são mantidas e só reportadas.
 * - Aplica cabeçalho congelado, filtro, notas com a descrição de cada coluna, formatos
 *   (texto puro para RENAVAM/CNPJ/IDs, data, R$), listas suspensas e proteções (abas de
 *   sistema, cabeçalho e colunas calculadas). Só reaplica quando a definição da tabela muda,
 *   ou quando o ADMIN pede "Reaplicar formatos e proteções".
 * - Semeia CONFIG (só chaves que faltam) e USUARIOS (quem roda vira ADMIN, se vazia).
 * - Cria a planilha restrita de motoristas (D-15) e a estrutura de pastas no Drive (§6.1).
 */

/** Menu: 🚛 Frota → Admin → Criar/validar base */
function criarOuValidarBase() {
  Setup.executarComUi(false);
}

/** Menu: 🚛 Frota → Admin → Reaplicar formatos e proteções */
function criarOuValidarBaseForcado() {
  Setup.executarComUi(true);
}

var Setup = (function () {
  var ORCAMENTO_MS = 270000;
  var MARCA = '[frota]';
  var COR_CABECALHO = '#1f3a5f';
  var CONGELAR_1A_COLUNA = ['VEICULOS', 'OBRIGACOES', 'MULTAS', 'MOTORISTAS'];
  var ABAS_PADRAO = ['Página1', 'Pagina1', 'Planilha1', 'Sheet1'];
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
        return b.requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).setHelpText('Valor em R$ (número)').build();
      case 'pct':
        return b.requireNumberBetween(0, 100).setAllowInvalid(false).setHelpText('Percentual em pontos: 1,9 = 1,9%').build();
      default:
        return null;
    }
  }

  function notaDe_(col) {
    if (!col) return 'Coluna extra (não faz parte do sistema)';
    var partes = [];
    if (col.descricao) partes.push(col.descricao);
    if (col.tipo === 'enum') partes.push('Lista: ' + Core.schema.ENUMS[col.enum].join(', '));
    if (col.obrigatorio) partes.push('Obrigatório');
    if (col.calculada) partes.push('Calculado pelo sistema (protegido)');
    if (col.fk) partes.push('Referência: ' + col.fk);
    return partes.join('\n');
  }

  function editoresSistema_() {
    var lista = [Util.emailProprietario()];
    try {
      Auth.emailsDosAdmins().forEach(function (e) { if (lista.indexOf(e) < 0) lista.push(e); });
    } catch (e) { /* USUARIOS ainda não existe */ }
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
      // Em Drive compartilhado, gestores do drive podem não ser removíveis: segue com aviso.
      console.warn('Proteção "' + protecao.getDescription() + '": ' + e);
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
      aplicarEditores_(sh.protect().setDescription(MARCA + ' Aba de sistema: alterada só pelo sistema'), editores);
      return;
    }
    aplicarEditores_(sh.getRange(1, 1, 1, cabecalho.length).protect().setDescription(MARCA + ' Cabeçalho'), editores);
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
    if (sh.getMaxRows() < 2) sh.insertRowsAfter(1, 999);
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
    if (novos.length) Db.inserir('CONFIG', novos, { origem: 'SCRIPT', detalhe: 'setup: parâmetros padrão' });
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
        throw new Error('Não consegui abrir a planilha restrita de motoristas (ID ' + id + '). Verifique o acesso. Para criar outra, apague a propriedade PLANILHA_MOTORISTAS_ID do script.');
      }
    } else {
      ssM = SpreadsheetApp.create('🔒 Frota Gobor — Motoristas');
      var restrita = Config.obter('PASTA_RESTRITA_ID');
      if (restrita) DriveApp.getFileById(ssM.getId()).moveTo(DriveApp.getFolderById(restrita));
      props.setProperty('PLANILHA_MOTORISTAS_ID', ssM.getId());
      rel.avisos.push('Planilha "🔒 Frota Gobor — Motoristas" criada ' + (restrita ? 'na pasta restrita configurada' : 'no seu Meu Drive') + '. Compartilhe só com ADMIN e DP.');
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
      raiz = subpasta_(pai, '🚛 Frota Gobor — Documentos');
      Config.definir('PASTA_RAIZ_ID', raiz.getId());
      rel.pastasCriadas.push(raiz.getName());
    }
    [
      ['PASTA_ENTRADA_ID', '📥 Entrada'],
      ['PASTA_REVISAO_ID', '⚠️ Revisão'],
      ['PASTA_ERROS_ID', '❌ Erros'],
      ['PASTA_DUPLICADOS_ID', '🔁 Duplicados'],
      ['PASTA_MULTAS_ID', 'Multas'],
      ['PASTA_IPVA_ID', 'IPVA'],
      ['PASTA_LICENCIAMENTO_ID', 'Licenciamento'],
      ['PASTA_CRLV_ID', 'CRLV'],
      ['PASTA_COMPROVANTES_ID', 'Comprovantes'],
    ].forEach(function (p) {
      if (Config.obter(p[0])) return;
      var pasta = subpasta_(raiz, p[1]);
      Config.definir(p[0], pasta.getId());
      rel.pastasCriadas.push(p[1]);
    });
    if (!Config.obter('PASTA_MOTORISTAS_ID')) {
      var restrita = Config.obter('PASTA_RESTRITA_ID');
      var paiRestrito = restrita ? DriveApp.getFolderById(restrita) : DriveApp.getRootFolder();
      var pm = subpasta_(paiRestrito, '🔒 Motoristas — documentos');
      Config.definir('PASTA_MOTORISTAS_ID', pm.getId());
      rel.pastasCriadas.push(pm.getName());
      rel.avisos.push('Pasta "🔒 Motoristas — documentos" criada ' + (restrita ? 'na pasta restrita configurada' : 'no seu Meu Drive') + ' (fora do Drive compartilhado, para manter o acesso restrito).');
    }
  }

  function exigirAdmin_() {
    var ctx = Auth.contexto();
    if (ctx.perfil !== 'ADMIN') throw new Error('Só ADMIN pode rodar o setup (você: ' + (ctx.email || 'não identificado') + ').');
    return ctx;
  }

  /**
   * @param {{forcar?:boolean}} opcoes forcar = reaplicar formatos e proteções em todas as abas
   * @returns {object} relatório
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
    if (rel.incompleto) l.push('⏱️ O tempo da execução acabou antes do fim. Rode "Criar/validar base" de novo para continuar.');
    l.push('Abas criadas: ' + (rel.abasCriadas.length ? rel.abasCriadas.join(', ') : 'nenhuma'));
    l.push('Abas (re)formatadas: ' + rel.abasFormatadas.length + ' · sem mudança: ' + rel.abasSemMudanca);
    if (rel.colunasAdicionadas.length) l.push('Colunas acrescentadas no fim: ' + rel.colunasAdicionadas.join(' | '));
    if (rel.colunasExtras.length) l.push('Colunas extras mantidas (não são do sistema): ' + rel.colunasExtras.join(' | '));
    if (rel.configCriadas) l.push('Parâmetros criados na CONFIG: ' + rel.configCriadas);
    if (rel.pastasCriadas.length) l.push('Pastas criadas no Drive: ' + rel.pastasCriadas.join(', '));
    rel.avisos.forEach(function (a) { l.push('• ' + a); });
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
