/**
 * Utilidades do Apps Script: fuso, conversão Date ↔ ISO, usuário atual e trava de escrita.
 *
 * Nenhum arquivo do servidor usa outro módulo (Core, Db, Config…) no nível superior: só
 * dentro de funções. Assim a ordem de carga dos arquivos não importa.
 */
var Util = (function () {
  var TZ = 'America/Sao_Paulo';
  var profundidadeLock = 0;

  function isoDeDate(d) {
    return Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
  }

  function isoDataHoraDeDate(d) {
    return Utilities.formatDate(d, TZ, 'yyyy-MM-dd HH:mm:ss');
  }

  /** "2027-01-15" → Date à meia-noite em São Paulo. */
  function dateDeIso(iso) {
    return Utilities.parseDate(iso, TZ, 'yyyy-MM-dd');
  }

  /** "2027-01-15 10:30[:00]" → Date em São Paulo. */
  function dateDeIsoDataHora(texto) {
    var s = String(texto).replace('T', ' ');
    var formato = s.length > 16 ? 'yyyy-MM-dd HH:mm:ss' : s.length > 10 ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd';
    return Utilities.parseDate(s.slice(0, formato.length), TZ, formato);
  }

  function hojeIso() {
    return isoDeDate(new Date());
  }

  function agoraIso() {
    return isoDataHoraDeDate(new Date());
  }

  /** E-mail de quem está usando (no Web App, o visitante do domínio). */
  function emailUsuario() {
    try {
      return String(Session.getActiveUser().getEmail() || '').toLowerCase();
    } catch (e) {
      return '';
    }
  }

  /** E-mail de quem o script executa como (no Web App, o proprietário). */
  function emailProprietario() {
    try {
      return String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
    } catch (e) {
      return '';
    }
  }

  function quem() {
    return emailUsuario() || emailProprietario() || 'sistema';
  }

  /**
   * Executa `fn` com a trava de script (uma escrita por vez). Reentrante: chamadas
   * aninhadas na mesma execução não tentam travar de novo.
   */
  function comLock(fn) {
    if (profundidadeLock > 0) {
      profundidadeLock++;
      try { return fn(); } finally { profundidadeLock--; }
    }
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    profundidadeLock = 1;
    try {
      return fn();
    } finally {
      profundidadeLock = 0;
      lock.releaseLock();
    }
  }

  function idCurto() {
    return Utilities.getUuid().replace(/-/g, '').slice(0, 8);
  }

  function propriedades() {
    return PropertiesService.getScriptProperties();
  }

  return {
    TZ: TZ,
    isoDeDate: isoDeDate,
    isoDataHoraDeDate: isoDataHoraDeDate,
    dateDeIso: dateDeIso,
    dateDeIsoDataHora: dateDeIsoDataHora,
    hojeIso: hojeIso,
    agoraIso: agoraIso,
    emailUsuario: emailUsuario,
    emailProprietario: emailProprietario,
    quem: quem,
    comLock: comLock,
    idCurto: idCurto,
    propriedades: propriedades,
  };
})();
