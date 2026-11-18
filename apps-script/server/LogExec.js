/**
 * Registro de execuções (rotinas, gatilhos, setup) na aba LOG_EXECUCAO.
 */
var LogExec = (function () {
  /**
   * Executa `fn(contagens)` registrando início, fim, duração, status e erro.
   * `fn` pode preencher o objeto `contagens` (ex.: {processados: 3}) e definir
   * `contagens._status = 'PARCIAL'` quando parar antes do fim por limite de tempo.
   */
  function executar(rotina, fn) {
    var inicio = new Date();
    var id = Utilities.formatDate(inicio, Util.TZ, 'yyyyMMdd-HHmmss') + '-' + Util.idCurto();
    var contagens = {};
    var status = 'OK';
    var erro = '';
    try {
      return fn(contagens);
    } catch (e) {
      status = 'ERRO';
      erro = String((e && e.stack) || e);
      throw e;
    } finally {
      if (status === 'OK' && contagens._status) status = contagens._status;
      delete contagens._status;
      var fim = new Date();
      try {
        Db.inserir('LOG_EXECUCAO', [{
          execucao_id: id,
          rotina: rotina,
          inicio: Util.isoDataHoraDeDate(inicio),
          fim: Util.isoDataHoraDeDate(fim),
          duracao_seg: Math.round((fim.getTime() - inicio.getTime()) / 100) / 10,
          status: status,
          contagens_json: JSON.stringify(contagens),
          erro: erro.slice(0, 45000),
          usuario: Util.quem(),
        }], { semAuditoria: true });
      } catch (e2) {
        console.error('Não foi possível gravar LOG_EXECUCAO: ' + e2);
      }
    }
  }

  return { executar: executar };
})();
