/**
 * Parâmetros da aba CONFIG, com cache de 5 minutos. Chaves ausentes na planilha usam o
 * padrão de core/config-padrao.js. Segredos (chave da API) ficam em Propriedades do
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

  /** Número (aceita vírgula decimal). Vazio ou inválido → null. */
  function numero(chave) {
    var v = obter(chave).trim();
    if (!v) return null;
    var n = Number(v.replace(',', '.'));
    return isFinite(n) ? n : null;
  }

  /** Lista de e-mails separados por vírgula, ponto e vírgula ou espaço. */
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
