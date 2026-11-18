/**
 * Auditoria: quem, quando, ação, entidade, id, antes/depois em JSON.
 * Alterações nas tabelas restritas (motoristas, descontos) vão para AUDITORIA_RESTRITA,
 * na planilha restrita, para que dados pessoais não apareçam na base geral.
 */
var Auditoria = (function () {
  var LIMITE_CELULA = 45000;

  function json_(obj) {
    if (obj === null || obj === undefined) return '';
    var s = JSON.stringify(obj);
    return s.length > LIMITE_CELULA ? s.slice(0, LIMITE_CELULA) + '…(truncado)' : s;
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
