/**
 * Perfis de acesso (prompt §10). O perfil vem do e-mail do usuário cruzado com a aba
 * USUARIOS:
 * - ADMIN: tudo;
 * - FINANCEIRO: obrigações, multas e repasses;
 * - DP: motoristas e folha;
 * - CONSULTA: só leitura, sem dados pessoais de motoristas.
 *
 * Primeiro acesso: enquanto USUARIOS estiver vazia, o proprietário do script é ADMIN.
 */
var Auth = (function () {
  var CHAVE_CACHE = 'USUARIOS_V1';
  var PERFIS_DADOS_PESSOAIS = ['ADMIN', 'FINANCEIRO', 'DP'];

  function usuarios_() {
    var cache = CacheService.getScriptCache();
    var guardado = cache.get(CHAVE_CACHE);
    if (guardado) return JSON.parse(guardado);
    var mapa = {};
    try {
      Db.lerTodos('USUARIOS').forEach(function (u) {
        if (u.email) mapa[String(u.email).toLowerCase()] = { perfil: u.perfil, ativo: u.ativo, nome: u.nome || '' };
      });
    } catch (e) {
      // Antes do primeiro setup a aba ainda não existe: segue como lista vazia.
      mapa = {};
    }
    cache.put(CHAVE_CACHE, JSON.stringify(mapa), 300);
    return mapa;
  }

  /** @returns {{email:string, perfil:string|null, nome:string}} */
  function contexto() {
    var email = Util.emailUsuario();
    var lista = usuarios_();
    var u = email ? lista[email] : null;
    var perfil = u && u.ativo !== 'N' ? u.perfil : null;
    if (!perfil && email && email === Util.emailProprietario() && Object.keys(lista).length === 0) perfil = 'ADMIN';
    return { email: email, perfil: perfil, nome: u ? u.nome : '' };
  }

  /**
   * Garante que o usuário tem um dos perfis (ou qualquer perfil, se `perfis` for vazio).
   * @throws Error com mensagem clara em português
   */
  function exigir(perfis) {
    var ctx = contexto();
    if (!ctx.email) throw new Error('Acesso negado: não foi possível identificar seu e-mail. Entre com a conta @gobor.com.br.');
    if (!ctx.perfil) throw new Error('Acesso negado: ' + ctx.email + ' não está cadastrado (ou está inativo) na aba USUARIOS.');
    if (perfis && perfis.length && perfis.indexOf(ctx.perfil) < 0) {
      throw new Error('Acesso negado: o perfil ' + ctx.perfil + ' não permite esta ação.');
    }
    return ctx;
  }

  function podeVerDadosPessoais(perfil) {
    return PERFIS_DADOS_PESSOAIS.indexOf(perfil) >= 0;
  }

  function emailsDosAdmins() {
    var lista = usuarios_();
    return Object.keys(lista).filter(function (e) { return lista[e].perfil === 'ADMIN' && lista[e].ativo !== 'N'; });
  }

  function limparCache() {
    CacheService.getScriptCache().remove(CHAVE_CACHE);
  }

  return {
    contexto: contexto,
    exigir: exigir,
    podeVerDadosPessoais: podeVerDadosPessoais,
    emailsDosAdmins: emailsDosAdmins,
    limparCache: limparCache,
  };
})();
