/**
 * Assistente de geração do exercício (prompt §5.3): lê veículos, locações e tabelas de
 * referência, mostra o plano (novas, atualizadas, canceladas, totais e pendências) e só
 * grava depois da confirmação. Pode rodar quantas vezes quiser (idempotente).
 */

/** Menu: 🚛 Frota → Gerar exercício… */
function menuGerarExercicio() {
  Exercicio.executarComUi();
}

var Exercicio = (function () {
  var PERFIS = ['ADMIN', 'FINANCEIRO'];

  function anoSugerido() {
    var hoje = Util.hojeIso();
    var ano = Number(hoje.slice(0, 4));
    return Number(hoje.slice(5, 7)) >= 10 ? ano + 1 : ano;
  }

  function planejar(exercicio) {
    Auth.exigir(PERFIS);
    return Core.exercicio.planejarExercicio({
      exercicio: exercicio,
      veiculos: Db.lerTodos('VEICULOS'),
      locacoes: Db.lerTodos('LOCACOES'),
      existentes: Db.lerTodos('OBRIGACOES'),
      tabelas: {
        calendario: Db.lerTodos('CALENDARIO_VENCIMENTOS'),
        aliquotas: Db.lerTodos('ALIQUOTAS_IPVA'),
        taxas: Db.lerTodos('TAXAS_LICENCIAMENTO'),
        venais: Db.lerTodos('VALORES_VENAIS'),
      },
      opcoes: { formaPadrao: Config.obter('FORMA_PGTO_IPVA_PADRAO') || 'COTA_UNICA' },
    });
  }

  function gravar(plano) {
    Auth.exigir(PERFIS);
    return LogExec.executar('GERAR_EXERCICIO', function (c) {
      var registros = plano.novas.concat(plano.atualizar, plano.encerrar);
      c.exercicio = plano.exercicio;
      c.pendencias = plano.pendencias.length;
      if (!registros.length) return { inseridos: 0, atualizados: 0, inalterados: 0 };
      var r = Db.upsert('OBRIGACOES', registros, { origem: 'SCRIPT', detalhe: 'gerar exercício ' + plano.exercicio });
      c.inseridos = r.inseridos;
      c.atualizados = r.atualizados;
      return r;
    });
  }

  function textoPendencias_(plano, max) {
    if (!plano.pendencias.length) return '';
    var linhas = plano.pendencias.slice(0, max).map(function (p) { return p.placa + ' · ' + p.tipo + ' · ' + p.detalhe; });
    return '\n\nPendências (' + plano.pendencias.length + '), primeiras ' + linhas.length + ':\n• ' + linhas.join('\n• ');
  }

  function executarComUi() {
    var ui = SpreadsheetApp.getUi();
    try {
      Auth.exigir(PERFIS);
      var sugerido = anoSugerido();
      var resp = ui.prompt('Gerar exercício', 'Ano do exercício (vazio = ' + sugerido + '):', ui.ButtonSet.OK_CANCEL);
      if (resp.getSelectedButton() !== ui.Button.OK) return;
      var texto = String(resp.getResponseText() || '').trim();
      var exercicio = texto ? Number(texto) : sugerido;
      if (!(exercicio >= 2020 && exercicio <= 2100)) throw new Error('Ano inválido: ' + texto);
      var plano = planejar(exercicio);
      var resumo = Core.exercicio.resumoPlano(plano).join('\n') + textoPendencias_(plano, 15);
      if (!plano.novas.length && !plano.atualizar.length && !plano.encerrar.length) {
        ui.alert('Nada a mudar', resumo, ui.ButtonSet.OK);
        return;
      }
      if (ui.alert('Confirmar geração', resumo + '\n\nGravar na aba OBRIGACOES?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
      var r = gravar(plano);
      ui.alert('Exercício ' + exercicio + ' gerado',
        r.inseridos + ' obrigação(ões) nova(s), ' + r.atualizados + ' atualizada(s). As pendências continuam na geração seguinte até serem resolvidas (tabelas de referência e valores venais).',
        ui.ButtonSet.OK);
    } catch (e) {
      ui.alert('Erro ao gerar exercício', String((e && e.message) || e), ui.ButtonSet.OK);
    }
  }

  return { anoSugerido: anoSugerido, planejar: planejar, gravar: gravar, executarComUi: executarComUi };
})();
