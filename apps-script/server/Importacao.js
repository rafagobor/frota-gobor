/**
 * Importação de CSVs da pasta "📤 Importação" (carga inicial da Fase 2).
 *
 * Arquivos aceitos (os que existirem são importados): FILIAIS.csv, LOCATARIOS.csv,
 * VEICULOS.csv, LOCACOES.csv (carga inicial: scripts/carga_inicial/carga_previa.py) e
 * CALENDARIO_VENCIMENTOS.csv, ALIQUOTAS_IPVA.csv, TAXAS_LICENCIAMENTO.csv (referencias/AAAA/)
 * e VALORES_VENAIS.csv (com a coluna veiculo_id ou placa).
 *
 * Fluxo: lê e valida tudo (núcleo) → mostra o resumo → só grava se não houver erro e
 * você confirmar. Depois, os arquivos são renomeados com "[importado AAAA-MM-DD]".
 * Rodar de novo com os mesmos arquivos não duplica nada: grava pela chave (atualiza o
 * que mudou).
 */

/** Menu: 🚛 Frota → Admin → Importar CSVs da pasta 📤 Importação… */
function menuImportarCsv() {
  Importacao.executarComUi();
}

var Importacao = (function () {
  function pasta_() {
    var id = Config.obter('PASTA_IMPORTACAO_ID');
    if (!id) throw new Error('Pasta de importação não configurada. Rode 🚛 Frota → Admin → Criar/validar base.');
    return DriveApp.getFolderById(id);
  }

  function lerArquivos_() {
    var pasta = pasta_();
    var matrizes = {}, arquivos = {};
    Core.importacao.ORDEM_IMPORTACAO.forEach(function (t) {
      var it = pasta.getFilesByName(t + '.csv');
      if (!it.hasNext()) return;
      var f = it.next();
      if (it.hasNext()) throw new Error('Há mais de um arquivo ' + t + '.csv na pasta 📤 Importação. Deixe só um.');
      matrizes[t] = Utilities.parseCsv(f.getBlob().getDataAsString('UTF-8'));
      arquivos[t] = f;
    });
    return { matrizes: matrizes, arquivos: arquivos };
  }

  /** Lê e valida, sem gravar nada. */
  function analisar() {
    Auth.exigir(['ADMIN']);
    var lidos = lerArquivos_();
    if (!Object.keys(lidos.matrizes).length) {
      throw new Error('Nenhum CSV reconhecido na pasta 📤 Importação. Nomes aceitos: ' + Core.importacao.ORDEM_IMPORTACAO.map(function (t) { return t + '.csv'; }).join(', ') + '.');
    }
    var existentes = {};
    Core.importacao.ORDEM_IMPORTACAO.forEach(function (t) { existentes[t] = Db.lerTodos(t); });
    var analise = Core.importacao.prepararImportacao(lidos.matrizes, existentes);
    analise.arquivos = lidos.arquivos;
    return analise;
  }

  /** Grava uma análise sem erros. */
  function gravar(analise) {
    Auth.exigir(['ADMIN']);
    if (!analise.ok) throw new Error('A análise tem erros; nada foi gravado.');
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
    return '\n\n' + titulo + ' (' + itens.length + '):\n• ' + itens.slice(0, max).join('\n• ') + (itens.length > max ? '\n• …' : '');
  }

  function executarComUi() {
    var ui = SpreadsheetApp.getUi();
    try {
      var a = analisar();
      var resumo = Core.importacao.resumoImportacao(a).join('\n');
      if (!a.ok) {
        ui.alert('Importação bloqueada: nada foi gravado', resumo + lista_('Erros', a.erros, 25) + lista_('Avisos', a.avisos, 10), ui.ButtonSet.OK);
        return;
      }
      var resp = ui.alert('Confirmar importação', resumo + lista_('Avisos', a.avisos, 15) + '\n\nGravar na base?', ui.ButtonSet.YES_NO);
      if (resp !== ui.Button.YES) return;
      var c = gravar(a);
      var linhas = Object.keys(c).map(function (t) {
        return t + ': ' + c[t].inseridos + ' inserido(s), ' + c[t].atualizados + ' atualizado(s), ' + c[t].inalterados + ' sem mudança';
      });
      ui.alert('Importação concluída', linhas.join('\n') + '\n\nOs arquivos foram renomeados com "[importado …]". Detalhes nas abas AUDITORIA e LOG_EXECUCAO.', ui.ButtonSet.OK);
    } catch (e) {
      ui.alert('Erro na importação', String((e && e.message) || e), ui.ButtonSet.OK);
    }
  }

  return { analisar: analisar, gravar: gravar, executarComUi: executarComUi };
})();
