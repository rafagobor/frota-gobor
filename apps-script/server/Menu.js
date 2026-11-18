/**
 * Menu "🚛 Frota" na planilha base.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚛 Frota')
    .addItem('Abrir painel', 'menuAbrirPainel')
    .addSeparator()
    .addItem('Processar documentos agora', 'menuProcessarDocumentos')
    .addItem('Gerar exercício…', 'menuGerarExercicio')
    .addItem('Enviar resumo agora', 'menuEnviarResumo')
    .addSeparator()
    .addSubMenu(ui.createMenu('Admin')
      .addItem('Criar/validar base', 'criarOuValidarBase')
      .addItem('Reaplicar formatos e proteções', 'criarOuValidarBaseForcado')
      .addItem('Importar CSVs da pasta 📤 Importação…', 'menuImportarCsv')
      .addItem('Testar meu acesso', 'menuTestarAcesso')
      .addItem('Sobre', 'menuSobre'))
    .addToUi();
}

function menuAbrirPainel() {
  var url = '';
  try { url = Config.obter('URL_WEBAPP'); } catch (e) { url = ''; }
  var ui = SpreadsheetApp.getUi();
  if (!url) {
    ui.alert('Painel ainda não implantado',
      'Implante o Web App (Extensões → Apps Script → Implantar → Nova implantação → App da Web) e cole o endereço na CONFIG, chave URL_WEBAPP. O passo a passo está em docs/runbook.md.',
      ui.ButtonSet.OK);
    return;
  }
  var html = HtmlService.createHtmlOutput(
    '<div style="font-family:Arial,sans-serif;padding:8px">' +
    '<p><a href="' + url + '" target="_blank" rel="noopener" style="font-size:16px">Abrir o painel da frota ↗</a></p>' +
    '<p style="color:#666;font-size:12px">Se não abrir, copie: ' + url + '</p></div>'
  ).setWidth(420).setHeight(130);
  ui.showModelessDialog(html, '🚛 Painel da Frota');
}

function emBreve_(funcao, fase) {
  var ui = SpreadsheetApp.getUi();
  ui.alert(funcao, 'Disponível a partir da ' + fase + ' do projeto.', ui.ButtonSet.OK);
}

function menuProcessarDocumentos() { emBreve_('Processar documentos', 'Fase 5'); }
function menuEnviarResumo() { emBreve_('Enviar resumo', 'Fase 8'); }

function menuTestarAcesso() {
  var ui = SpreadsheetApp.getUi();
  var ctx = Auth.contexto();
  ui.alert('Meu acesso',
    'E-mail: ' + (ctx.email || '(não identificado)') +
    '\nPerfil: ' + (ctx.perfil || 'sem perfil (peça ao ADMIN para cadastrar em USUARIOS)') +
    '\nVê dados pessoais de motoristas: ' + (Auth.podeVerDadosPessoais(ctx.perfil) ? 'sim' : 'não'),
    ui.ButtonSet.OK);
}

function menuSobre() {
  var ui = SpreadsheetApp.getUi();
  ui.alert('Painel de Frota Gobor', 'Versão ' + Core.VERSAO + '\nFuso: ' + Util.TZ + '\nDocumentação: docs/ no repositório.', ui.ButtonSet.OK);
}
