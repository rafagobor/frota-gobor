/**
 * Web App (painel). Implantado como "Executar como: eu (proprietário)" e "Acesso:
 * qualquer pessoa do domínio". O perfil de cada visitante vem de Auth (aba USUARIOS).
 */
function doGet() {
  var t = HtmlService.createTemplateFromFile('ui/index');
  t.versao = Core.VERSAO;
  return t.evaluate()
    .setTitle('Frota Gobor')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/** Usado nos templates: <?!= incluir_('ui/estilos') ?> */
function incluir_(arquivo) {
  return HtmlService.createHtmlOutputFromFile(arquivo).getContent();
}
