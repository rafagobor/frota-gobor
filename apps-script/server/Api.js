/**
 * Ponto único de entrada do painel: google.script.run.api(rota, args).
 * Cada rota declara quais perfis podem chamá-la. Erros voltam como {ok:false, erro}, com
 * mensagem em português, sem quebrar a tela.
 *
 * Valores devolvidos não podem conter Date (limitação do google.script.run): os registros
 * já trazem datas como texto ISO.
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
