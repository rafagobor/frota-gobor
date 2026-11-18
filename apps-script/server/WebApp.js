/**
 * Web App (painel). Implantado como "Executar como: eu (proprietário)" e "Acesso:
 * qualquer pessoa do domínio". O perfil de cada visitante vem de Auth (aba USUARIOS).
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
