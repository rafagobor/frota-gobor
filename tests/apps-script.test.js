/**
 * Testes de ponta a ponta do servidor Apps Script contra o ambiente simulado.
 * Pré-requisito: `npm run build` (o `npm test` já roda o build antes, via pretest).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarAmbiente, carregarAppsScript } from './fakes/google.js';
import { TABELAS, tabelasDaPlanilha, nomesColunas } from '../core/schema.js';
import { CONFIG_PADRAO } from '../core/config-padrao.js';

/** Compara estrutura ignorando o "realm" do vm (arrays do contexto têm outro protótipo). */
function igual(atual, esperado, msg) {
  const norm = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));
  assert.deepEqual(norm(atual), norm(esperado), msg);
}

function preparar(opcoes) {
  const amb = criarAmbiente(opcoes);
  const g = carregarAppsScript(amb.globals);
  return { amb, g };
}

function comSetup(opcoes) {
  const r = preparar(opcoes);
  r.rel = r.g.Setup.executar({});
  return r;
}

function linhas(sh) {
  return sh.dados.slice(1).filter((l) => l.some((v) => v !== '' && v !== undefined && v !== null));
}

test('setup cria a base completa na primeira execução', () => {
  const { amb, g, rel } = comSetup();
  const nomesBase = tabelasDaPlanilha('BASE').map((t) => t.nome);
  igual(amb.base.getSheets().map((s) => s.getName()), nomesBase, 'abas na ordem do esquema e sem a Página1');
  assert.equal(rel.incompleto, false);
  igual(rel.abasCriadas.slice(0, nomesBase.length), nomesBase);

  for (const nome of nomesBase) {
    const cab = amb.base.getSheetByName(nome).cabecalho();
    igual(cab, nomesColunas(nome), `cabeçalho de ${nome}`);
  }

  // Planilha restrita (D-15) no Meu Drive, com as 3 abas
  const idM = amb.props.PLANILHA_MOTORISTAS_ID;
  assert.ok(idM);
  const ssM = amb.planilhas[idM];
  igual(ssM.getSheets().map((s) => s.getName()), ['MOTORISTAS', 'DESCONTOS_FOLHA', 'AUDITORIA_RESTRITA']);
  assert.equal(amb.props.PLANILHA_BASE_ID, amb.base.getId());

  // CONFIG semeada, IDs de pastas preenchidos
  const config = g.Db.porChave('CONFIG');
  assert.equal(Object.keys(config).length, CONFIG_PADRAO.length);
  assert.equal(config.API_MODELO.valor, 'claude-sonnet-5-5');
  for (const k of ['PASTA_RAIZ_ID', 'PASTA_ENTRADA_ID', 'PASTA_REVISAO_ID', 'PASTA_MOTORISTAS_ID', 'PLANILHA_MOTORISTAS_ID']) assert.ok(config[k].valor, k);

  // Pastas: estrutura no Drive compartilhado; documentos de motoristas fora dele
  const raiz = amb.driveCompartilhado.filhos.find((f) => f.nome === '🚛 Frota Gobor — Documentos');
  assert.ok(raiz);
  igual(raiz.filhos.map((f) => f.nome), ['📥 Entrada', '⚠️ Revisão', '❌ Erros', '🔁 Duplicados', 'Multas', 'IPVA', 'Licenciamento', 'CRLV', 'Comprovantes']);
  assert.ok(amb.meuDrive.filhos.some((f) => f.nome === '🔒 Motoristas — documentos'));

  // Primeiro ADMIN
  const usuarios = g.Db.lerTodos('USUARIOS');
  assert.equal(usuarios.length, 1);
  assert.equal(usuarios[0].email, 'rafael@gobor.com.br');
  assert.equal(usuarios[0].perfil, 'ADMIN');

  // Log da execução
  const log = g.Db.lerTodos('LOG_EXECUCAO');
  assert.equal(log.length, 1);
  assert.equal(log[0].rotina, 'SETUP');
  assert.equal(log[0].status, 'OK');
});

test('setup aplica formatos, listas e proteções', () => {
  const { amb } = comSetup();
  const veic = amb.base.getSheetByName('VEICULOS');
  assert.equal(veic.formatos[veic.coluna('renavam')], '@', 'RENAVAM como texto (zeros à esquerda)');
  assert.equal(veic.formatos[veic.coluna('cnpj_proprietario')], '@');
  assert.equal(veic.formatos[veic.coluna('data_aquisicao')], 'dd/mm/yyyy');
  igual(veic.validacoes[veic.coluna('tipo')].requireValueInList[0], TABELAS.find((t) => t.nome === 'VEICULOS') && ['CAVALO', 'CARRETA', 'BITREM', 'TRUCK', 'TOCO', 'AUTOMOVEL', 'VAN', 'UTILITARIO', 'CARRETINHA']);
  assert.equal(veic.validacoes[veic.coluna('placa_norm')], null, 'coluna calculada sem lista');
  assert.equal(veic.congeladas, 1);
  assert.ok(veic.filtro);
  const descricoes = veic.protecoes.map((p) => p.desc).sort();
  igual(descricoes, ['[frota] Cabeçalho', '[frota] Calculado: atualizado_em', '[frota] Calculado: atualizado_por',
    '[frota] Calculado: categoria', '[frota] Calculado: criado_em', '[frota] Calculado: placa_norm']);
  for (const p of veic.protecoes) {
    igual(p.editores, ['rafael@gobor.com.br']);
    assert.equal(p.dominio, false);
  }
  const obr = amb.base.getSheetByName('OBRIGACOES');
  assert.ok(obr.getMaxRows() >= 6000, 'capacidade para as obrigações do exercício');
  assert.equal(obr.formatos[obr.coluna('valor_pago')], '"R$" #,##0.00');
  const aud = amb.base.getSheetByName('AUDITORIA');
  assert.equal(aud.protecoes.length, 1);
  assert.equal(aud.protecoes[0].tipo, 'SHEET');
});

test('setup é idempotente e preserva o que foi editado', () => {
  const { amb, g } = comSetup();
  g.Db.atualizar('CONFIG', 'DIAS_ALERTA_VENCIMENTO', { valor: '10' });
  const audAntes = linhas(amb.base.getSheetByName('AUDITORIA')).length;
  const rel2 = g.Setup.executar({});
  igual(rel2.abasCriadas, []);
  igual(rel2.abasFormatadas, [], 'nada mudou: não reformatou');
  assert.equal(rel2.configCriadas, 0);
  assert.equal(rel2.pastasCriadas.length, 0);
  assert.equal(g.Config.obter('DIAS_ALERTA_VENCIMENTO'), '10');
  assert.equal(g.Db.contar('USUARIOS'), 1);
  assert.equal(linhas(amb.base.getSheetByName('AUDITORIA')).length, audAntes, 'segunda execução não gera auditoria');
  assert.equal(Object.keys(amb.planilhas).length, 2, 'não criou outra planilha restrita');

  const rel3 = g.Setup.executar({ forcar: true });
  assert.equal(rel3.abasFormatadas.length, TABELAS.length, 'forçar reaplica em todas as abas');
  const veic = amb.base.getSheetByName('VEICULOS');
  assert.equal(veic.protecoes.length, 6, 'reaplicar não duplica proteções');
});

test('setup acrescenta no fim as colunas que faltam e mantém colunas extras e dados', () => {
  const { amb, g } = preparar();
  const sh = amb.base.insertSheet('VEICULOS');
  sh.set(1, 1, 'veiculo_id'); sh.set(1, 2, 'placa'); sh.set(1, 3, 'minha_coluna');
  sh.set(2, 1, 'V0001'); sh.set(2, 2, 'BEU1D91'); sh.set(2, 3, 'anotação');
  const rel = g.Setup.executar({});
  const cab = sh.cabecalho();
  igual(cab.slice(0, 3), ['veiculo_id', 'placa', 'minha_coluna']);
  igual([...cab].sort(), [...nomesColunas('VEICULOS'), 'minha_coluna'].sort());
  assert.equal(sh.get(2, 3), 'anotação');
  assert.ok(rel.colunasExtras.some((x) => x.startsWith('VEICULOS: minha_coluna')));
  assert.ok(rel.colunasAdicionadas.some((x) => x.startsWith('VEICULOS: renavam')));
  assert.match(sh.notas[2], /Coluna extra/);
});

test('Db: inserir, ler e atualizar com auditoria; RENAVAM e datas', () => {
  const { amb, g } = comSetup();
  g.Db.inserir('FILIAIS', [{ cnpj: '77505550000197', nome_curto: 'Matriz', uf: 'PR', ativo: 'S' }]);
  g.Db.inserir('VEICULOS', [{
    veiculo_id: 'V0001', placa: 'asx-8d02', renavam: 229498353, tipo: 'TOCO', uf_registro: 'PR',
    situacao: 'OPERACAO_PROPRIA', cnpj_proprietario: '77505550000197', data_aquisicao: '2020-05-10',
  }]);
  const sh = amb.base.getSheetByName('VEICULOS');
  assert.equal(sh.get(2, sh.coluna('renavam')), '00229498353');
  assert.equal(sh.get(2, sh.coluna('placa')), 'ASX8D02');
  assert.ok(sh.get(2, sh.coluna('data_aquisicao')) instanceof Date, 'data gravada como Date');
  assert.ok(sh.get(2, sh.coluna('criado_em')) instanceof Date);

  const [v] = g.Db.lerTodos('VEICULOS');
  assert.equal(v.renavam, '00229498353');
  assert.equal(v.data_aquisicao, '2020-05-10');
  assert.equal(v.cnpj_proprietario, '77.505.550/0001-97');
  assert.equal(v.atualizado_por, 'rafael@gobor.com.br');

  const r1 = g.Db.atualizar('VEICULOS', 'V0001', { observacoes: 'teste' });
  assert.equal(r1.atualizados, 1);
  const aud = g.Db.lerTodos('AUDITORIA');
  const ultima = aud[aud.length - 1];
  assert.equal(ultima.acao, 'ATUALIZAR');
  assert.equal(ultima.entidade_id, 'V0001');
  igual(JSON.parse(ultima.antes_json), { observacoes: null });
  igual(JSON.parse(ultima.depois_json), { observacoes: 'teste' });

  const r2 = g.Db.atualizar('VEICULOS', 'V0001', { observacoes: 'teste' });
  assert.equal(r2.inalterados, 1);
  assert.equal(g.Db.lerTodos('AUDITORIA').length, aud.length, 'sem mudança, sem auditoria');

  assert.throws(() => g.Db.inserir('VEICULOS', [{ ...v, _linha: undefined }]), /já existe/);
  assert.throws(() => g.Db.inserir('VEICULOS', [{ veiculo_id: 'V0002', placa: 'RLI4H26', renavam: 127280801, tipo: 'CARRETA', uf_registro: 'PR', situacao: 'OPERACAO_PROPRIA' }]), /RENAVAM inválido/);
  assert.equal(g.Db.contar('VEICULOS'), 1, 'registro inválido não é gravado');
  assert.throws(() => g.Db.atualizar('VEICULOS', 'V9999', { observacoes: 'x' }), /não encontrado/);

  const r3 = g.Db.upsert('VEICULOS', [
    { veiculo_id: 'V0001', situacao: 'PARADO' },
    { veiculo_id: 'V0002', placa: 'BEU1D91', renavam: '1251100403', tipo: 'CAVALO', uf_registro: 'PR', situacao: 'OPERACAO_PROPRIA' },
  ]);
  assert.equal(r3.inseridos, 1);
  assert.equal(r3.atualizados, 1);
  assert.equal(g.Db.porChave('VEICULOS').V0001.situacao, 'PARADO');
});

test('Db: dados restritos são auditados só na planilha restrita', () => {
  const { amb, g } = comSetup();
  g.Db.inserir('MOTORISTAS', [{ motorista_id: 'MT0001', nome: 'Fulano de Tal', cpf: '52998224725', situacao: 'ATIVO' }]);
  const base = JSON.stringify(amb.base.getSheetByName('AUDITORIA').dados);
  assert.ok(!base.includes('Fulano'), 'nome do motorista não vai para a auditoria da base');
  const restrita = g.Db.lerTodos('AUDITORIA_RESTRITA');
  assert.equal(restrita.length, 1);
  assert.equal(restrita[0].entidade, 'MOTORISTAS');
  assert.equal(g.Db.lerTodos('MOTORISTAS')[0].cpf, '529.982.247-25');
});

test('perfis: ADMIN, CONSULTA, desconhecido', () => {
  const { amb, g } = comSetup();
  let r = g.api('meuPerfil');
  assert.equal(r.ok, true);
  assert.equal(r.dados.perfil, 'ADMIN');
  assert.equal(r.dados.dadosPessoais, true);
  assert.equal(r.dados.empresa, 'Transportadora Gobor');

  g.Db.inserir('USUARIOS', [{ email: 'consulta@gobor.com.br', perfil: 'CONSULTA', ativo: 'S' }]);
  g.Auth.limparCache();
  amb.estado.usuario = 'consulta@gobor.com.br';
  r = g.api('meuPerfil');
  assert.equal(r.dados.perfil, 'CONSULTA');
  assert.equal(r.dados.dadosPessoais, false);
  const status = g.api('statusBase');
  assert.ok(status.ok);
  assert.ok(!status.dados.tabelas.some((t) => t.planilha === 'MOTORISTAS'), 'CONSULTA não vê tabelas restritas');
  assert.throws(() => g.Setup.executar({}), /Só ADMIN/);

  amb.estado.usuario = 'estranho@gobor.com.br';
  r = g.api('meuPerfil');
  assert.equal(r.ok, false);
  assert.match(r.erro, /não está cadastrado/);

  amb.estado.usuario = '';
  assert.match(g.api('meuPerfil').erro, /não foi possível identificar/);

  amb.estado.usuario = 'rafael@gobor.com.br';
  assert.match(g.api('rotaQueNaoExiste').erro, /Rota desconhecida/);

  g.Db.atualizar('USUARIOS', 'consulta@gobor.com.br', { ativo: 'N' });
  g.Auth.limparCache();
  amb.estado.usuario = 'consulta@gobor.com.br';
  assert.equal(g.api('meuPerfil').ok, false, 'usuário inativo perde o acesso');
});

test('LogExec registra erro e a trava é liberada', () => {
  const { amb, g } = comSetup();
  assert.throws(() => g.LogExec.executar('TESTE', () => { throw new Error('falhou de propósito'); }), /falhou/);
  const log = g.Db.lerTodos('LOG_EXECUCAO');
  const ultimo = log[log.length - 1];
  assert.equal(ultimo.rotina, 'TESTE');
  assert.equal(ultimo.status, 'ERRO');
  assert.match(ultimo.erro, /falhou de propósito/);
  assert.equal(amb.lock.preso, false);
  assert.throws(() => g.Db.inserir('FILIAIS', [{ cnpj: 'x' }]));
  assert.equal(amb.lock.preso, false, 'trava liberada mesmo após erro');
});

test('menu, painel e setup pela interface', () => {
  const { amb, g } = preparar();
  g.onOpen();
  const menu = amb.menus[0];
  assert.equal(menu.nome, '🚛 Frota');
  assert.ok(menu.itens.some(([rotulo]) => rotulo === 'Abrir painel'));
  for (const [, fn] of menu.itens.filter(([r]) => r !== '>')) assert.equal(typeof g[fn], 'function', `função do menu ${fn}`);
  const admin = menu.itens.find(([r]) => r === '>')[1];
  for (const [, fn] of admin.itens) assert.equal(typeof g[fn], 'function', `função do menu ${fn}`);

  g.criarOuValidarBase();
  assert.equal(amb.alertas.at(-1)[0], 'Base pronta');
  g.menuAbrirPainel();
  assert.equal(amb.alertas.at(-1)[0], 'Painel ainda não implantado');
  assert.equal(g.doGet().titulo, 'Frota Gobor');
});
