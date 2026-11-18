/**
 * Rotas de operação do painel (Fase 3): veículos e obrigações de IPVA/licenciamento.
 * Todas passam por api(rota, args), que confere o perfil antes de chamar.
 */
var RotasOperacao = (function () {
  var TODOS = ['ADMIN', 'FINANCEIRO', 'DP', 'CONSULTA'];
  var EDITAM = ['ADMIN', 'FINANCEIRO'];

  var CAMPOS_VEICULO_EDITAVEIS = ['placa', 'renavam', 'chassi', 'tipo', 'marca_modelo', 'ano_fabricacao', 'ano_modelo',
    'cnpj_proprietario', 'uf_registro', 'municipio_registro', 'situacao', 'data_aquisicao', 'isento_ipva', 'motivo_isencao',
    'forma_pgto_ipva_padrao', 'observacoes'];
  var CAMPOS_OBRIGACAO_EDITAVEIS = ['valor_guia', 'vencimento', 'linha_digitavel', 'nr_lancamento_erp', 'data_lancamento_erp',
    'valor_pago', 'data_pagamento', 'encargos', 'desconto_obtido', 'crlv_emitido', 'data_crlv', 'bloqueio_motivo', 'observacoes'];
  var STATUS_MANUAIS = ['BLOQUEADO', 'ISENTO', 'NAO_APLICA', 'CANCELADO', 'REABRIR'];

  function exercicio_(args) {
    var n = Number(args && args.exercicio);
    return n >= 2020 && n <= 2100 ? n : Exercicio.anoSugerido();
  }

  function agrupar_(lista, campo) {
    var m = {};
    lista.forEach(function (x) { (m[x[campo]] = m[x[campo]] || []).push(x); });
    return m;
  }

  function locacaoVigente_(locacoes, veiculoId, data) {
    for (var i = 0; i < locacoes.length; i++) {
      var l = locacoes[i];
      if (l.veiculo_id === veiculoId && l.inicio && l.inicio <= data && (!l.fim || data <= l.fim)) return l;
    }
    return null;
  }

  function semInterno_(r) {
    var c = {};
    Object.keys(r).forEach(function (k) { if (k.charAt(0) !== '_') c[k] = r[k]; });
    return c;
  }

  function tabelasReferencia_() {
    return {
      calendario: Db.lerTodos('CALENDARIO_VENCIMENTOS'),
      aliquotas: Db.lerTodos('ALIQUOTAS_IPVA'),
      taxas: Db.lerTodos('TAXAS_LICENCIAMENTO'),
      venais: Db.lerTodos('VALORES_VENAIS'),
    };
  }

  // ---------------------------------------------------------------- veículos
  function listarVeiculos(args, ctx) {
    var ex = exercicio_(args);
    var hoje = Util.hojeIso();
    var obr = agrupar_(Db.lerTodos('OBRIGACOES'), 'veiculo_id');
    var locacoes = Db.lerTodos('LOCACOES');
    var locatarios = Db.porChave('LOCATARIOS');
    var filiais = Db.lerTodos('FILIAIS');
    var veiculos = Db.lerTodos('VEICULOS').map(function (v) {
      var l = locacaoVigente_(locacoes, v.veiculo_id, hoje);
      var sd = Core.veiculos.situacaoDocumental(obr[v.veiculo_id] || [], ex, hoje);
      return {
        veiculo_id: v.veiculo_id, placa: v.placa, placa_norm: v.placa_norm, renavam: v.renavam, tipo: v.tipo,
        categoria: v.categoria, marca_modelo: v.marca_modelo, cnpj_proprietario: v.cnpj_proprietario,
        uf_registro: v.uf_registro, situacao: v.situacao, ipva: sd.ipva, licenciamento: sd.licenciamento,
        locatario: l ? ((locatarios[l.locatario_id] || {}).nome || l.locatario_id) : null,
      };
    });
    return {
      exercicio: ex, hoje: hoje, veiculos: veiculos,
      filiais: filiais.map(function (f) { return { cnpj: f.cnpj, nome_curto: f.nome_curto, uf: f.uf, ativo: f.ativo }; }),
      podeEditar: EDITAM.indexOf(ctx.perfil) >= 0,
      enums: { TIPO_VEICULO: Core.schema.ENUMS.TIPO_VEICULO, SITUACAO_VEICULO: Core.schema.ENUMS.SITUACAO_VEICULO, UF: Core.schema.ENUMS.UF, FORMA_PGTO_IPVA: Core.schema.ENUMS.FORMA_PGTO_IPVA },
    };
  }

  function fichaVeiculo(args) {
    var v = Db.porChave('VEICULOS')[args.veiculo_id];
    if (!v) throw new Error('Veículo não encontrado: ' + args.veiculo_id);
    var hoje = Util.hojeIso();
    var locatarios = Db.porChave('LOCATARIOS');
    var obrigacoes = Db.lerTodos('OBRIGACOES').filter(function (o) { return o.veiculo_id === v.veiculo_id; }).map(function (o) {
      var c = Core.obrigacoes.classificar(o, hoje);
      var va = Core.obrigacoes.valorAtual(o);
      return { obrigacao_id: o.obrigacao_id, exercicio: o.exercicio, tributo: o.tributo, parcela: o.parcela, vencimento: o.vencimento,
        status: o.status, situacao_prazo: c.situacao_prazo, valor: va.valor, camada: va.camada, nr_lancamento_erp: o.nr_lancamento_erp };
    }).sort(function (a, b) { return String(a.vencimento || '9').localeCompare(String(b.vencimento || '9')); });
    var locacoes = Db.lerTodos('LOCACOES').filter(function (l) { return l.veiculo_id === v.veiculo_id; }).map(function (l) {
      return { locacao_id: l.locacao_id, inicio: l.inicio, fim: l.fim, contrato_ref: l.contrato_ref,
        locatario: (locatarios[l.locatario_id] || {}).nome || l.locatario_id, repassa_multas: l.repassa_multas };
    }).sort(function (a, b) { return String(b.inicio).localeCompare(String(a.inicio)); });
    return { veiculo: semInterno_(v), obrigacoes: obrigacoes, locacoes: locacoes, hoje: hoje };
  }

  function aplicarExercicioNovo_(v, acao, ex) {
    var plano = Core.exercicio.planejarExercicio({
      exercicio: ex, veiculos: [v], tabelas: tabelasReferencia_(), locacoes: Db.lerTodos('LOCACOES'),
      existentes: Db.lerTodos('OBRIGACOES'), opcoes: { formaPadrao: Config.obter('FORMA_PGTO_IPVA_PADRAO') || 'COTA_UNICA' },
    });
    var regs = plano.novas;
    if (acao === 'QUITADAS') {
      regs = regs.map(function (o) {
        var c = Object.assign({}, o);
        c.status = 'NAO_APLICA';
        c.observacoes = 'Exercício já quitado no emplacamento ou antes da aquisição';
        return c;
      });
    }
    if (regs.length) Db.upsert('OBRIGACOES', regs, { origem: 'WEBAPP', detalhe: 'exercício ' + ex + ' do veículo novo ' + v.placa });
    return { geradas: regs.length, pendencias: plano.pendencias.map(function (p) { return p.tipo + ': ' + p.detalhe; }) };
  }

  /**
   * Novo veículo ou edição. Se houver avisos (ex.: placa equivalente a um vendido), devolve
   * {ok:false, avisos} para o painel pedir confirmação; reenviar com confirmarAvisos = true.
   */
  function salvarVeiculo(args) {
    var entrada = args.veiculo || {};
    var novo = !!args.novo;
    var todos = Db.lerTodos('VEICULOS');
    var v;
    if (novo) {
      v = {};
      CAMPOS_VEICULO_EDITAVEIS.forEach(function (k) { if (entrada[k] !== undefined) v[k] = entrada[k]; });
      v.veiculo_id = Core.ids.proximoId('V', todos.map(function (x) { return x.veiculo_id; }), 4);
    } else {
      var atual = null;
      todos.forEach(function (x) { if (x.veiculo_id === entrada.veiculo_id) atual = x; });
      if (!atual) throw new Error('Veículo não encontrado: ' + entrada.veiculo_id);
      v = semInterno_(atual);
      CAMPOS_VEICULO_EDITAVEIS.forEach(function (k) { if (entrada[k] !== undefined) v[k] = entrada[k]; });
    }
    v = Core.tabela.normalizarRegistro(v, 'VEICULOS');
    v = Core.veiculos.completarVeiculo(v);
    var erros = Core.tabela.validarRegistro(v, 'VEICULOS').filter(function (e) { return !/^(criado_em|atualizado_em|atualizado_por)/.test(e); });
    var regra = Core.veiculos.validarVeiculo(v, todos);
    erros = erros.concat(regra.erros);
    if (erros.length) throw new Error(erros.join('; '));
    if (regra.avisos.length && !args.confirmarAvisos) return { ok: false, avisos: regra.avisos };
    Db.upsert('VEICULOS', [v], { origem: 'WEBAPP', detalhe: novo ? 'novo veículo' : 'edição do cadastro' });
    var ex = null;
    if (novo && args.exercicioAcao && args.exercicioAcao !== 'DEPOIS') ex = aplicarExercicioNovo_(v, args.exercicioAcao, exercicio_(args));
    return { ok: true, veiculo_id: v.veiculo_id, avisos: regra.avisos, exercicio: ex };
  }

  function transferirVeiculo(args) {
    var v = Db.porChave('VEICULOS')[args.veiculo_id];
    if (!v) throw new Error('Veículo não encontrado');
    var filial = Db.porChave('FILIAIS')[Core.fiscal.formatarCnpj(args.cnpj)];
    if (!filial) throw new Error('Filial não encontrada: ' + args.cnpj);
    var data = Core.datas.parseDataFlex(args.data) || Util.hojeIso();
    var uf = args.uf || filial.uf;
    var nota = 'Transferido de ' + (v.cnpj_proprietario || '?') + '/' + (v.uf_registro || '?') + ' para ' + filial.cnpj + '/' + uf + ' em ' + Core.datas.dataBR(data);
    Db.atualizar('VEICULOS', v.veiculo_id, {
      cnpj_proprietario: filial.cnpj, uf_registro: uf, municipio_registro: args.municipio || null,
      observacoes: [v.observacoes, nota].filter(function (x) { return x; }).join('; '),
    }, { origem: 'WEBAPP', detalhe: 'transferência' });
    return { ok: true, nota: nota + '. Obrigações já geradas mantêm o retrato anterior; vale a partir do próximo exercício gerado.' };
  }

  function venderVeiculo(args) {
    var v = Db.porChave('VEICULOS')[args.veiculo_id];
    if (!v) throw new Error('Veículo não encontrado');
    var situacao = args.situacao === 'BAIXADO' ? 'BAIXADO' : 'VENDIDO';
    var data = Core.datas.parseDataFlex(args.data);
    if (!data) throw new Error('Informe a data da venda/baixa');
    Db.atualizar('VEICULOS', v.veiculo_id, { situacao: situacao, data_venda: data }, { origem: 'WEBAPP', detalhe: situacao.toLowerCase() });
    var obr = Db.lerTodos('OBRIGACOES').filter(function (o) { return o.veiculo_id === v.veiculo_id; });
    var afetadas = Core.veiculos.obrigacoesAposVenda(obr, data).map(function (o) {
      return { obrigacao_id: o.obrigacao_id, status: 'NAO_APLICA', observacoes: 'Veículo ' + situacao.toLowerCase() + ' em ' + Core.datas.dataBR(data) };
    });
    if (afetadas.length) Db.upsert('OBRIGACOES', afetadas, { origem: 'WEBAPP', detalhe: 'venda/baixa ' + v.placa });
    return { ok: true, obrigacoesNaoAplica: afetadas.length };
  }

  // ---------------------------------------------------------------- obrigações
  function listarObrigacoes(args, ctx) {
    var ex = exercicio_(args);
    var hoje = Util.hojeIso();
    var dias = Config.numero('DIAS_ALERTA_VENCIMENTO') || 7;
    var veic = Db.porChave('VEICULOS');
    var nomes = {};
    Db.lerTodos('FILIAIS').forEach(function (f) { nomes[f.cnpj] = f.nome_curto; });
    var todas = Db.lerTodos('OBRIGACOES');
    var exercicios = {};
    todas.forEach(function (o) { exercicios[o.exercicio] = true; });
    var contagem = { TODAS: 0, A_LANCAR_ERP: 0, PAGO_SEM_LANCAMENTO: 0, VENCIDOS: 0, BLOQUEADOS: 0, SEM_ESTIMATIVA: 0 };
    var lista = todas.filter(function (o) { return Number(o.exercicio) === ex; }).map(function (o) {
      var c = Core.obrigacoes.classificar(o, hoje, dias);
      contagem.TODAS++;
      c.filas.forEach(function (f) { contagem[f]++; });
      var v = veic[o.veiculo_id] || {};
      var r = semInterno_(o);
      r.situacao_prazo = c.situacao_prazo;
      r.filas = c.filas;
      r.tipo = v.tipo || null;
      r.filial = nomes[o.cnpj] || o.cnpj;
      r.historico = Core.obrigacoes.historicoErp(o);
      return r;
    }).sort(function (a, b) { return String(a.vencimento || '9999').localeCompare(String(b.vencimento || '9999')) || String(a.placa).localeCompare(String(b.placa)); });
    return {
      exercicio: ex, hoje: hoje, obrigacoes: lista, contagem: contagem,
      exercicios: Object.keys(exercicios).map(Number).concat([ex]).filter(function (x, i, a) { return a.indexOf(x) === i; }).sort(),
      podeEditar: EDITAM.indexOf(ctx.perfil) >= 0,
    };
  }

  function atualizarObrigacao(args) {
    var atual = Db.porChave('OBRIGACOES')[args.obrigacao_id];
    if (!atual) throw new Error('Obrigação não encontrada: ' + args.obrigacao_id);
    var alt = args.alteracoes || {};
    var depois = semInterno_(atual);
    CAMPOS_OBRIGACAO_EDITAVEIS.forEach(function (k) {
      if (alt[k] === undefined) return;
      var val = alt[k] === '' ? null : alt[k];
      if (val !== null && /^(valor_|encargos|desconto_)/.test(k)) val = Core.moeda.parseMoeda(val);
      if (val !== null && /^(vencimento|data_)/.test(k)) {
        var d = Core.datas.parseDataFlex(val);
        if (!d) throw new Error(k + ': data inválida (' + val + ')');
        val = d;
      }
      if (val !== null && k === 'nr_lancamento_erp') {
        var m = Core.obrigacoes.normalizarMto(val);
        if (!m) throw new Error('Nº MTO inválido: ' + val);
        val = m;
      }
      depois[k] = val;
    });
    if (depois.nr_lancamento_erp && !depois.data_lancamento_erp) depois.data_lancamento_erp = Util.hojeIso();
    if (depois.data_pagamento && depois.data_pagamento > Util.hojeIso()) throw new Error('Data de pagamento no futuro');
    var manual = alt.status_manual;
    if (manual) {
      if (STATUS_MANUAIS.indexOf(manual) < 0) throw new Error('Status inválido: ' + manual);
      var alvo = manual === 'REABRIR' ? Core.obrigacoes.statusCalculado(Object.assign({}, depois, { status: 'PREVISTO' })) : manual;
      if (!Core.obrigacoes.transicaoPermitida(atual.status, alvo)) throw new Error('Não é possível passar de ' + atual.status + ' para ' + alvo);
      depois.status = alvo;
    } else {
      depois.status = Core.obrigacoes.statusCalculado(depois);
      if (depois.status !== atual.status && !Core.obrigacoes.transicaoPermitida(atual.status, depois.status)) {
        throw new Error('Não é possível passar de ' + atual.status + ' para ' + depois.status);
      }
    }
    var erros = Core.obrigacoes.validarObrigacao(depois);
    if (erros.length) throw new Error(erros.join('; '));
    Db.upsert('OBRIGACOES', [depois], { origem: 'WEBAPP', detalhe: manual ? 'status ' + manual : 'edição' });
    var c = Core.obrigacoes.classificar(depois, Util.hojeIso());
    depois.situacao_prazo = c.situacao_prazo;
    depois.filas = c.filas;
    return depois;
  }

  function previa_(args) {
    var ex = exercicio_(args);
    return Core.lote.previaLote({ tipo: args.tipo, texto: args.texto, exercicio: ex, obrigacoes: Db.lerTodos('OBRIGACOES'),
      veiculos: Db.lerTodos('VEICULOS'), hoje: Util.hojeIso() });
  }

  function previaLote(args) {
    return previa_(args);
  }

  function aplicarLote(args) {
    var p = previa_(args);
    var regs = p.itens.filter(function (i) { return !i.erro; }).map(function (i) {
      return Object.assign({ obrigacao_id: i.obrigacao_id }, i.patch);
    });
    if (!regs.length) throw new Error('Nenhuma linha válida para aplicar.');
    var r = Db.upsert('OBRIGACOES', regs, { origem: 'WEBAPP', detalhe: 'lote ' + args.tipo });
    return { aplicados: r.atualizados + r.inseridos, semMudanca: r.inalterados, ignorados: p.comErro };
  }

  function exportarFila(args) {
    var dados = listarObrigacoes(args, { perfil: 'CONSULTA' });
    var fila = args.fila || 'TODAS';
    var lista = dados.obrigacoes.filter(function (o) { return fila === 'TODAS' || o.filas.indexOf(fila) >= 0; });
    if (fila === 'A_LANCAR_ERP') {
      return { nome: 'a-lancar-erp-' + dados.exercicio + '.csv', conteudo: Core.obrigacoes.csvLancamentoErp(lista) };
    }
    var cab = ['obrigacao_id', 'placa', 'tributo', 'parcela', 'vencimento', 'situacao_prazo', 'valor_estimado', 'valor_guia', 'valor_pago', 'data_pagamento', 'nr_lancamento_erp', 'status', 'filial'];
    var linhas = lista.map(function (o) {
      return cab.map(function (k) {
        var v = o[k];
        if (v === null || v === undefined) return '';
        if (typeof v === 'number') return String(v).replace('.', ',');
        var s = String(v);
        return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(';');
    });
    return { nome: 'obrigacoes-' + dados.exercicio + '-' + fila.toLowerCase() + '.csv', conteudo: [cab.join(';')].concat(linhas).join('\n') + '\n' };
  }

  return {
    listarVeiculos: { perfis: TODOS, fn: listarVeiculos },
    fichaVeiculo: { perfis: TODOS, fn: fichaVeiculo },
    salvarVeiculo: { perfis: EDITAM, fn: salvarVeiculo },
    transferirVeiculo: { perfis: EDITAM, fn: transferirVeiculo },
    venderVeiculo: { perfis: EDITAM, fn: venderVeiculo },
    listarObrigacoes: { perfis: TODOS, fn: listarObrigacoes },
    atualizarObrigacao: { perfis: EDITAM, fn: atualizarObrigacao },
    previaLote: { perfis: EDITAM, fn: previaLote },
    aplicarLote: { perfis: EDITAM, fn: aplicarLote },
    exportarFila: { perfis: TODOS, fn: exportarFila },
  };
})();
