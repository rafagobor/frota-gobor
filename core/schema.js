/**
 * Esquema da base: fonte única da verdade para abas, colunas, tipos, listas (enums),
 * chaves, colunas calculadas e em qual planilha cada tabela fica.
 *
 * A partir dele:
 * - o Apps Script cria e valida as abas, cabeçalhos, dropdowns, formatos e proteções;
 * - o núcleo valida registros antes de gravar;
 * - `npm run docs:modelo` gera docs/modelo-dados.md.
 *
 * Planilhas (decisão D-15):
 * - BASE: "🚛 Frota Gobor — Base", em Drive compartilhado;
 * - MOTORISTAS: "🔒 Frota Gobor — Motoristas", compartilhada só com ADMIN/DP. Na BASE, a
 *   MULTA guarda apenas o motorista_id (pseudônimo).
 *
 * Regras: nunca reordenar nem remover colunas de uma tabela já em produção. Coluna nova
 * entra no fim da lista (a rotina de setup acrescenta no fim da aba).
 */

export const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB',
  'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];

export const ENUMS = {
  SN: ['S', 'N'],
  UF: UFS,
  PERFIL: ['ADMIN', 'FINANCEIRO', 'DP', 'CONSULTA'],
  TIPO_CONFIG: ['TEXTO', 'NUMERO', 'SN', 'EMAILS', 'ID_DRIVE', 'URL', 'JSON'],
  TIPO_VEICULO: ['CAVALO', 'CARRETA', 'BITREM', 'TRUCK', 'TOCO', 'AUTOMOVEL', 'VAN', 'UTILITARIO', 'CARRETINHA'],
  CATEGORIA_VEICULO: ['TRACAO', 'IMPLEMENTO', 'LEVE'],
  SITUACAO_VEICULO: ['OPERACAO_PROPRIA', 'LOCADO_TERCEIRO', 'PARADO', 'A_VENDA', 'VENDIDO', 'BAIXADO', 'EM_TRANSFERENCIA', 'HISTORICO'],
  FORMA_PGTO_IPVA: ['COTA_UNICA', 'PARCELADO'],
  TRIBUTO: ['IPVA', 'LICENCIAMENTO', 'OUTRO'],
  GRUPO_VEICULO: ['TODOS', 'CAMINHAO', 'IMPLEMENTO', 'AUTOMOVEL', 'UTILITARIO'],
  FINAL_PLACA: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*'],
  PARCELA: ['U', '1', '2', '3', '4', '5'],
  ORIGEM_VENAL: ['GUIA', 'CSV_SEFAZ', 'MANUAL', 'PROJECAO'],
  FORMA_OBRIGACAO: ['COTA_UNICA', 'PARCELADO', 'ISENTO', 'NAO_APLICA'],
  STATUS_OBRIGACAO: ['PREVISTO', 'GUIA_DISPONIVEL', 'LANCADO_ERP', 'PAGO', 'PAGO_SEM_LANCAMENTO', 'ISENTO', 'NAO_APLICA', 'CANCELADO', 'BLOQUEADO'],
  SITUACAO_PRAZO: ['EM_DIA', 'VENCE_EM_7_DIAS', 'VENCE_HOJE', 'VENCIDO'],
  RESPONSAVEL_PGTO: ['GOBOR', 'LOCATARIO'],
  REPASSE_STATUS: ['NAO_APLICA', 'A_COBRAR', 'COBRADO', 'RECEBIDO'],
  ORIGEM_REGISTRO: ['CARGA_INICIAL', 'GERADO', 'PDF', 'CSV', 'MANUAL', 'MIGRACAO'],
  GRAVIDADE: ['LEVE', 'MEDIA', 'GRAVE', 'GRAVISSIMA'],
  RESPONSAVEL_INFRACAO: ['CONDUTOR', 'PROPRIETARIO', 'EMBARCADOR', 'TRANSPORTADOR'],
  FASE_MULTA: ['AUTUACAO', 'PENALIDADE', 'NIC'],
  RESPONSAVEL_MULTA: ['OPERACAO_PROPRIA', 'LOCATARIO'],
  COMO_IDENTIFICADO: ['ESCALA', 'RASTREADOR', 'TACOGRAFO', 'DECLARACAO', 'OUTRO'],
  DECISAO_CONDUTOR: ['PENDENTE', 'INDICAR', 'NAO_INDICAR_PAGAR_NIC', 'LOCATARIO_INDICA', 'NAO_APLICA'],
  INDICACAO_STATUS: ['NAO_APLICA', 'AGUARDANDO_ASSINATURA', 'ENVIADA', 'CONFIRMADA', 'RECUSADA'],
  CUSTO_ASSUMIDO_POR: ['MOTORISTA', 'EMPRESA', 'LOCATARIO', 'DIVIDIDO'],
  FORMA_RESSARCIMENTO: ['DESCONTO_FOLHA_A_VISTA', 'DESCONTO_FOLHA_PARCELADO', 'PAGAMENTO_DIRETO', 'EMPRESA_ASSUME', 'LOCATARIO_REEMBOLSA'],
  DEFESA_STATUS: ['NAO', 'DEFESA_PREVIA', 'RECURSO_JARI', 'RECURSO_CETRAN'],
  RESULTADO_DEFESA: ['PENDENTE', 'DEFERIDO', 'INDEFERIDO'],
  PGTO_STATUS: ['PENDENTE', 'PAGO', 'NAO_PAGAR'],
  PAGO_VIA: ['BOLETO', 'LICENCIAMENTO'],
  REEMBOLSO_STATUS: ['NAO_APLICA', 'A_COBRAR', 'COBRADO', 'RECEBIDO', 'PERDIDO'],
  STATUS_GERAL_MULTA: ['NOVA', 'IDENTIFICAR_MOTORISTA', 'DECIDIR_INDICACAO', 'AGUARDANDO_PAGAMENTO', 'EM_DEFESA', 'PAGA', 'A_RESSARCIR', 'ENCERRADA', 'CANCELADA', 'DEFERIDA'],
  PRAZO_MULTA: ['EM_DIA', 'URGENTE', 'VENCIDA'],
  SITUACAO_MOTORISTA: ['ATIVO', 'AFASTADO', 'DESLIGADO'],
  CNH_CATEGORIA: ['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'],
  STATUS_DESCONTO: ['PROGRAMADO', 'ENVIADO_DP', 'DESCONTADO', 'NAO_DESCONTADO', 'CANCELADO', 'A_DESCONTAR_NA_RESCISAO'],
  TIPO_DOCUMENTO: ['MULTA_NA', 'MULTA_NP', 'NIC', 'GUIA_IPVA', 'GUIA_LICENCIAMENTO', 'COMPROVANTE_PAGAMENTO', 'CRLV', 'EXTRATO_DEBITOS', 'OUTRO'],
  ENTIDADE_DOC: ['MULTA', 'OBRIGACAO', 'VEICULO', 'MOTORISTA'],
  STATUS_DOCUMENTO: ['PROCESSADO', 'REVISAO', 'ERRO', 'DUPLICADO', 'IGNORADO'],
  ORIGEM_ACAO: ['WEBAPP', 'MENU', 'GATILHO', 'SCRIPT', 'IMPORTACAO'],
  STATUS_EXECUCAO: ['EM_ANDAMENTO', 'OK', 'PARCIAL', 'ERRO'],
};

/**
 * Tipos de coluna:
 * id, texto, texto_longo, inteiro, numero, moeda (R$), pct (pontos percentuais: 1,9 = 1,9%),
 * data, datahora, enum, sn, json, email, emails, placa, renavam, cnpj, cpf,
 * documento (CNPJ ou CPF), competencia (AAAA-MM), lista (valores separados por vírgula).
 */
export const TIPOS = ['id', 'texto', 'texto_longo', 'inteiro', 'numero', 'moeda', 'pct', 'data', 'datahora',
  'enum', 'sn', 'json', 'email', 'emails', 'placa', 'renavam', 'cnpj', 'cpf', 'documento', 'competencia', 'lista'];

/** Tipos guardados como texto puro na planilha (preserva zeros à esquerda). */
export const TIPOS_TEXTO_PURO = ['id', 'renavam', 'cnpj', 'cpf', 'documento', 'placa', 'competencia', 'texto', 'lista', 'enum'];

export const COLUNAS_CONTROLE = ['criado_em', 'atualizado_em', 'atualizado_por'];

function c(nome, tipo, opts = {}) {
  return { nome, tipo, ...opts };
}
const ob = { obrigatorio: true };
const calc = { calculada: true };

function controle() {
  return [
    c('criado_em', 'datahora', { calculada: true, descricao: 'Preenchido pelo sistema' }),
    c('atualizado_em', 'datahora', { calculada: true, descricao: 'Preenchido pelo sistema' }),
    c('atualizado_por', 'email', { calculada: true, descricao: 'E-mail de quem fez a última alteração' }),
  ];
}

function t(def) {
  const colunas = def.transacional === false ? def.colunas : [...def.colunas, ...controle()];
  return { planilha: 'BASE', sistema: false, transacional: true, ...def, colunas, chave: [].concat(def.chave || []) };
}

const AUDITORIA_COLUNAS = [
  c('quando', 'datahora', ob),
  c('quem', 'email', ob),
  c('origem', 'enum', { enum: 'ORIGEM_ACAO' }),
  c('acao', 'texto', ob),
  c('entidade', 'texto', ob),
  c('entidade_id', 'texto'),
  c('antes_json', 'json'),
  c('depois_json', 'json'),
  c('detalhe', 'texto_longo'),
];

export const TABELAS = [
  t({
    nome: 'VEICULOS', chave: 'veiculo_id', descricao: 'Cadastro mestre de veículos (fonte única da verdade)',
    colunas: [
      c('veiculo_id', 'id', { ...ob, descricao: 'Chave interna (V0001). Nunca muda' }),
      c('renavam', 'renavam', { descricao: '11 dígitos com zeros à esquerda. Único e obrigatório para veículos ativos' }),
      c('placa', 'placa', { ...ob, descricao: 'Como está no CRLV atual' }),
      c('placa_norm', 'placa', { ...calc, descricao: 'Forma canônica (Mercosul convertido para dígito). Única entre os ativos' }),
      c('chassi', 'texto'),
      c('tipo', 'enum', { ...ob, enum: 'TIPO_VEICULO' }),
      c('categoria', 'enum', { ...calc, enum: 'CATEGORIA_VEICULO', descricao: 'Derivada do tipo' }),
      c('marca_modelo', 'texto'),
      c('ano_fabricacao', 'inteiro'),
      c('ano_modelo', 'inteiro'),
      c('cnpj_proprietario', 'cnpj', { fk: 'FILIAIS.cnpj' }),
      c('uf_registro', 'enum', { ...ob, enum: 'UF' }),
      c('municipio_registro', 'texto'),
      c('situacao', 'enum', { ...ob, enum: 'SITUACAO_VEICULO' }),
      c('data_aquisicao', 'data'),
      c('data_venda', 'data'),
      c('isento_ipva', 'sn'),
      c('motivo_isencao', 'texto'),
      c('forma_pgto_ipva_padrao', 'enum', { enum: 'FORMA_PGTO_IPVA' }),
      c('pasta_drive_id', 'id'),
      c('observacoes', 'texto_longo'),
    ],
  }),
  t({
    nome: 'OBRIGACOES', chave: 'obrigacao_id', descricao: 'Uma linha por veículo × exercício × tributo × parcela',
    colunas: [
      c('obrigacao_id', 'id', { ...ob, descricao: 'Ex.: 2027-IPVA-V0001-U' }),
      c('exercicio', 'inteiro', ob),
      c('tributo', 'enum', { ...ob, enum: 'TRIBUTO' }),
      c('descricao_outro', 'texto', { descricao: 'Para tributo = OUTRO (tacógrafo, RNTRC, seguro, AET…)' }),
      c('veiculo_id', 'id', { ...ob, fk: 'VEICULOS.veiculo_id' }),
      c('placa', 'placa', { descricao: 'Retrato no momento da geração' }),
      c('uf', 'enum', { enum: 'UF', descricao: 'Retrato no momento da geração' }),
      c('cnpj', 'cnpj', { descricao: 'Retrato no momento da geração' }),
      c('forma', 'enum', { enum: 'FORMA_OBRIGACAO' }),
      c('parcela', 'enum', { ...ob, enum: 'PARCELA' }),
      c('vencimento', 'data'),
      c('valor_estimado', 'moeda', { descricao: 'Camada 1: orçamento' }),
      c('base_estimativa', 'texto', { descricao: 'Ex.: venal 180.000 × 1% − desc. 3%' }),
      c('valor_guia', 'moeda', { descricao: 'Camada 2: devido' }),
      c('linha_digitavel', 'texto'),
      c('valor_pago', 'moeda', { descricao: 'Camada 3: realizado. Obrigatório para marcar como pago' }),
      c('data_pagamento', 'data'),
      c('encargos', 'moeda', { descricao: 'Juros + multa por atraso' }),
      c('desconto_obtido', 'moeda'),
      c('base_calculo', 'moeda', { descricao: 'Valor venal informado na guia' }),
      c('aliquota_aplicada', 'pct'),
      c('nr_lancamento_erp', 'texto', { descricao: 'Formato "MTO 421779"' }),
      c('data_lancamento_erp', 'data'),
      c('status', 'enum', { ...ob, enum: 'STATUS_OBRIGACAO' }),
      c('situacao_prazo', 'enum', { ...calc, enum: 'SITUACAO_PRAZO' }),
      c('responsavel_pgto', 'enum', { enum: 'RESPONSAVEL_PGTO' }),
      c('repasse_status', 'enum', { enum: 'REPASSE_STATUS' }),
      c('repasse_valor', 'moeda'),
      c('repasse_data', 'data'),
      c('crlv_emitido', 'sn'),
      c('data_crlv', 'data'),
      c('multas_quitadas_junto', 'moeda'),
      c('bloqueio_motivo', 'texto'),
      c('doc_guia_id', 'id'),
      c('doc_comprovante_id', 'id'),
      c('origem', 'enum', { enum: 'ORIGEM_REGISTRO' }),
      c('observacoes', 'texto_longo'),
    ],
  }),
  t({
    nome: 'MULTAS', chave: 'multa_id', descricao: 'Multas da frota inteira (operação própria e locados)',
    colunas: [
      c('multa_id', 'id', ob),
      c('chave_dedupe', 'texto', { ...calc, descricao: 'ÓRGÃO|AIT normalizados' }),
      c('orgao_sigla', 'texto', ob),
      c('orgao_nome', 'texto'),
      c('orgao_codigo', 'texto'),
      c('nr_ait', 'texto', ob),
      c('nr_notificacao', 'texto'),
      c('veiculo_id', 'id', { fk: 'VEICULOS.veiculo_id' }),
      c('placa_documento', 'texto', { descricao: 'Como veio no documento' }),
      c('placa_norm', 'placa', calc),
      c('data_hora_infracao', 'datahora'),
      c('uf_infracao', 'enum', { enum: 'UF' }),
      c('municipio', 'texto'),
      c('local', 'texto'),
      c('cod_infracao', 'texto', { descricao: 'Ex.: 745-5' }),
      c('desdobramento', 'texto'),
      c('descricao', 'texto_longo'),
      c('amparo_legal', 'texto'),
      c('gravidade', 'enum', { enum: 'GRAVIDADE' }),
      c('fator_multiplicador', 'numero'),
      c('pontos', 'inteiro'),
      c('vel_permitida', 'numero'),
      c('vel_medida', 'numero'),
      c('vel_considerada', 'numero'),
      c('responsavel_infracao', 'enum', { enum: 'RESPONSAVEL_INFRACAO' }),
      c('suspensao_cnh', 'sn', { descricao: 'Quando o documento indicar' }),
      c('fase', 'enum', { ...ob, enum: 'FASE_MULTA' }),
      c('data_expedicao', 'data', { descricao: 'Expedição da notificação de autuação' }),
      c('data_expedicao_penalidade', 'data', { descricao: 'Expedição da notificação de penalidade' }),
      c('ait_origem', 'texto', { descricao: 'Para NIC: AIT da infração original' }),
      c('condutor_no_documento', 'texto'),
      c('valor_original', 'moeda'),
      c('valor_com_desconto', 'moeda', { descricao: 'Como informado no documento' }),
      c('valor_desconto_sne', 'moeda', { descricao: 'Como informado no documento' }),
      c('vencimento_pgto', 'data'),
      c('linha_digitavel', 'texto'),
      c('prazo_defesa_previa', 'data'),
      c('prazo_indicacao_condutor', 'data'),
      c('prazo_recurso', 'data'),
      c('responsavel', 'enum', { ...calc, enum: 'RESPONSAVEL_MULTA', descricao: 'Pela locação vigente na data da infração' }),
      c('locatario_id', 'id', { fk: 'LOCATARIOS.locatario_id' }),
      c('motorista_id', 'id', { descricao: 'Infrator (dados pessoais só na planilha restrita)' }),
      c('como_identificado', 'enum', { enum: 'COMO_IDENTIFICADO' }),
      c('decisao_condutor', 'enum', { enum: 'DECISAO_CONDUTOR' }),
      c('decidido_por', 'email'),
      c('data_decisao', 'data'),
      c('motivo_decisao', 'texto_longo'),
      c('indicacao_status', 'enum', { enum: 'INDICACAO_STATUS' }),
      c('data_indicacao', 'data'),
      c('protocolo_indicacao', 'texto'),
      c('pontos_no_motorista', 'sn'),
      c('custo_nic_estimado', 'moeda'),
      c('custo_assumido_por', 'enum', { enum: 'CUSTO_ASSUMIDO_POR' }),
      c('pct_motorista', 'pct'),
      c('inclui_nic_no_desconto', 'sn'),
      c('forma_ressarcimento', 'enum', { enum: 'FORMA_RESSARCIMENTO' }),
      c('n_parcelas', 'inteiro'),
      c('valor_a_ressarcir', 'moeda'),
      c('valor_ressarcido', 'moeda', calc),
      c('doc_autorizacao_id', 'id'),
      c('defesa_status', 'enum', { enum: 'DEFESA_STATUS' }),
      c('protocolo', 'texto'),
      c('resultado', 'enum', { enum: 'RESULTADO_DEFESA' }),
      c('pgto_status', 'enum', { enum: 'PGTO_STATUS' }),
      c('data_pgto', 'data'),
      c('valor_pago', 'moeda'),
      c('desconto_aproveitado', 'moeda'),
      c('pago_via', 'enum', { enum: 'PAGO_VIA' }),
      c('obrigacao_licenciamento_id', 'id', { fk: 'OBRIGACOES.obrigacao_id', descricao: 'Quando paga junto com o licenciamento' }),
      c('nr_lancamento_erp', 'texto'),
      c('reembolso_status', 'enum', { enum: 'REEMBOLSO_STATUS' }),
      c('reembolso_valor', 'moeda'),
      c('data_cobranca', 'data'),
      c('data_recebimento', 'data'),
      c('status_geral', 'enum', { ...calc, enum: 'STATUS_GERAL_MULTA' }),
      c('prazo_situacao', 'enum', { ...calc, enum: 'PRAZO_MULTA' }),
      c('flags', 'lista', calc),
      c('doc_ids', 'lista'),
      c('confianca_extracao', 'numero'),
      c('origem', 'enum', { enum: 'ORIGEM_REGISTRO' }),
      c('observacoes', 'texto_longo'),
    ],
  }),
  t({
    nome: 'FILIAIS', chave: 'cnpj', descricao: 'CNPJs da Gobor (matriz e filiais)',
    colunas: [
      c('cnpj', 'cnpj', ob),
      c('nome_curto', 'texto', ob),
      c('razao_social', 'texto'),
      c('uf', 'enum', { ...ob, enum: 'UF' }),
      c('municipio', 'texto'),
      c('ativo', 'sn', ob),
      c('observacoes', 'texto_longo'),
    ],
  }),
  t({
    nome: 'LOCATARIOS', chave: 'locatario_id', descricao: 'Clientes que alugam veículos da Gobor',
    colunas: [
      c('locatario_id', 'id', ob),
      c('nome', 'texto', ob),
      c('cnpj_cpf', 'documento'),
      c('contato', 'texto'),
      c('email', 'emails'),
      c('telefone', 'texto'),
      c('ativo', 'sn'),
      c('observacoes', 'texto_longo'),
      c('ref_painel', 'texto', { descricao: 'Id do locatário no painel "Locação de Carretas Gobor" (decisão N9)' }),
    ],
  }),
  t({
    nome: 'LOCACOES', chave: 'locacao_id', descricao: 'Vigência veículo ↔ locatário (fim vazio = vigente)',
    colunas: [
      c('locacao_id', 'id', ob),
      c('veiculo_id', 'id', { ...ob, fk: 'VEICULOS.veiculo_id' }),
      c('locatario_id', 'id', { ...ob, fk: 'LOCATARIOS.locatario_id' }),
      c('inicio', 'data', ob),
      c('fim', 'data'),
      c('contrato_ref', 'texto'),
      c('repassa_multas', 'sn', { descricao: 'Padrão S' }),
      c('repassa_licenciamento', 'sn'),
      c('repassa_ipva', 'sn'),
      c('observacoes', 'texto_longo'),
      c('ref_painel', 'texto', { descricao: 'Contrato#item no painel "Locação de Carretas Gobor" (decisão N9)' }),
    ],
  }),
  t({
    nome: 'CALENDARIO_VENCIMENTOS', chave: ['exercicio', 'uf', 'tributo', 'grupo_veiculo', 'final_placa', 'parcela'],
    descricao: 'Vencimentos oficiais por exercício, UF, grupo e final de placa (sempre com fonte)',
    colunas: [
      c('exercicio', 'inteiro', ob),
      c('uf', 'enum', { ...ob, enum: 'UF' }),
      c('tributo', 'enum', { ...ob, enum: 'TRIBUTO' }),
      c('grupo_veiculo', 'enum', { ...ob, enum: 'GRUPO_VEICULO' }),
      c('final_placa', 'enum', { ...ob, enum: 'FINAL_PLACA' }),
      c('parcela', 'enum', { ...ob, enum: 'PARCELA' }),
      c('vencimento', 'data', ob),
      c('desconto_pct', 'pct'),
      c('provisorio', 'sn', { descricao: 'S = projetado do calendário oficial do ano anterior (decisão D-10)' }),
      c('fonte', 'texto', { ...ob, descricao: 'Norma ou página oficial (link)' }),
      c('observacoes', 'texto_longo'),
    ],
  }),
  t({
    nome: 'ALIQUOTAS_IPVA', chave: ['exercicio', 'uf', 'tipo_ou_categoria'],
    descricao: 'Se o tipo paga IPVA na UF e com qual alíquota (sempre com fonte)',
    colunas: [
      c('exercicio', 'inteiro', ob),
      c('uf', 'enum', { ...ob, enum: 'UF' }),
      c('tipo_ou_categoria', 'texto', { ...ob, descricao: 'Um TIPO_VEICULO, uma CATEGORIA_VEICULO ou um GRUPO_VEICULO' }),
      c('tributado', 'sn', ob),
      c('aliquota_pct', 'pct', { descricao: 'Em pontos percentuais: 1,9 = 1,9%' }),
      c('fonte', 'texto', ob),
      c('observacoes', 'texto_longo'),
    ],
  }),
  t({
    nome: 'TAXAS_LICENCIAMENTO', chave: ['exercicio', 'uf', 'grupo_veiculo'],
    descricao: 'Taxa anual de licenciamento do DETRAN de cada UF (sempre com fonte)',
    colunas: [
      c('exercicio', 'inteiro', ob),
      c('uf', 'enum', { ...ob, enum: 'UF' }),
      c('grupo_veiculo', 'enum', { ...ob, enum: 'GRUPO_VEICULO' }),
      c('valor', 'moeda', ob),
      c('fonte', 'texto', ob),
      c('observacoes', 'texto_longo'),
    ],
  }),
  t({
    nome: 'VALORES_VENAIS', chave: ['veiculo_id', 'exercicio'],
    descricao: 'Valor venal por veículo e exercício, com a origem do dado',
    colunas: [
      c('veiculo_id', 'id', { ...ob, fk: 'VEICULOS.veiculo_id' }),
      c('exercicio', 'inteiro', ob),
      c('valor_venal', 'moeda', ob),
      c('origem', 'enum', { ...ob, enum: 'ORIGEM_VENAL' }),
      c('fonte', 'texto'),
      c('observacoes', 'texto_longo'),
    ],
  }),
  t({
    nome: 'DOCUMENTOS', chave: 'doc_id', sistema: true, descricao: 'Todo arquivo que entrou pela pasta de Entrada',
    colunas: [
      c('doc_id', 'id', { ...ob, descricao: 'fileId do Drive' }),
      c('nome_original', 'texto'),
      c('nome_padronizado', 'texto'),
      c('md5', 'texto'),
      c('mime', 'texto'),
      c('paginas', 'inteiro'),
      c('tipo_documento', 'enum', { enum: 'TIPO_DOCUMENTO' }),
      c('placa_extraida', 'texto'),
      c('renavam_extraido', 'texto'),
      c('entidade', 'enum', { enum: 'ENTIDADE_DOC' }),
      c('entidade_id', 'texto'),
      c('confianca', 'numero'),
      c('status', 'enum', { enum: 'STATUS_DOCUMENTO' }),
      c('motivo_revisao', 'texto_longo'),
      c('json_extraido_id', 'id'),
      c('modelo', 'texto'),
      c('tokens_entrada', 'inteiro'),
      c('tokens_saida', 'inteiro'),
      c('custo_estimado_usd', 'numero'),
      c('processado_em', 'datahora'),
      c('erro', 'texto_longo'),
    ],
  }),
  t({
    nome: 'USUARIOS', chave: 'email', descricao: 'Quem acessa o painel e com qual perfil',
    colunas: [
      c('email', 'email', ob),
      c('nome', 'texto'),
      c('perfil', 'enum', { ...ob, enum: 'PERFIL' }),
      c('ativo', 'sn', ob),
      c('observacoes', 'texto_longo'),
    ],
  }),
  t({
    nome: 'CONFIG', chave: 'chave', descricao: 'Parâmetros do sistema (chave/valor)',
    colunas: [
      c('chave', 'texto', ob),
      c('valor', 'texto'),
      c('tipo', 'enum', { enum: 'TIPO_CONFIG' }),
      c('descricao', 'texto_longo'),
    ],
  }),
  t({
    nome: 'AUDITORIA', transacional: false, sistema: true, descricao: 'Quem, quando e o que mudou (antes/depois)',
    colunas: AUDITORIA_COLUNAS,
  }),
  t({
    nome: 'LOG_EXECUCAO', chave: 'execucao_id', transacional: false, sistema: true, descricao: 'Execuções de rotinas e gatilhos',
    colunas: [
      c('execucao_id', 'id', ob),
      c('rotina', 'texto', ob),
      c('inicio', 'datahora', ob),
      c('fim', 'datahora'),
      c('duracao_seg', 'numero'),
      c('status', 'enum', { enum: 'STATUS_EXECUCAO' }),
      c('contagens_json', 'json'),
      c('erro', 'texto_longo'),
      c('usuario', 'email'),
    ],
  }),
  t({
    nome: 'SNAPSHOT_KPI', chave: ['data', 'kpi', 'dimensao'], transacional: false, sistema: true,
    descricao: 'Foto diária dos indicadores (para gráficos de tendência)',
    colunas: [
      c('data', 'data', ob),
      c('kpi', 'texto', ob),
      c('dimensao', 'texto', { descricao: 'Ex.: TOTAL, UF=PR, FILIAL=Matriz' }),
      c('valor', 'numero'),
      c('observacao', 'texto'),
    ],
  }),
  // ---- Planilha restrita (D-15) ----
  t({
    nome: 'MOTORISTAS', planilha: 'MOTORISTAS', chave: 'motorista_id', descricao: 'Dados pessoais dos motoristas (acesso restrito)',
    colunas: [
      c('motorista_id', 'id', ob),
      c('nome', 'texto', ob),
      c('cpf', 'cpf'),
      c('matricula', 'texto'),
      c('filial', 'cnpj', { fk: 'FILIAIS.cnpj' }),
      c('cnh_numero', 'texto'),
      c('cnh_categoria', 'enum', { enum: 'CNH_CATEGORIA' }),
      c('cnh_validade', 'data'),
      c('exerce_atividade_remunerada', 'sn', { descricao: 'EAR na CNH' }),
      c('situacao', 'enum', { ...ob, enum: 'SITUACAO_MOTORISTA' }),
      c('data_admissao', 'data'),
      c('data_desligamento', 'data'),
      c('termo_desconto_assinado', 'sn'),
      c('doc_termo_id', 'id'),
      c('observacoes', 'texto_longo'),
    ],
  }),
  t({
    nome: 'DESCONTOS_FOLHA', planilha: 'MOTORISTAS', chave: 'desconto_id', descricao: 'Uma linha por parcela de desconto em folha',
    colunas: [
      c('desconto_id', 'id', ob),
      c('multa_id', 'id', { ...ob, fk: 'MULTAS.multa_id' }),
      c('motorista_id', 'id', { ...ob, fk: 'MOTORISTAS.motorista_id' }),
      c('parcela', 'inteiro', ob),
      c('total_parcelas', 'inteiro', ob),
      c('competencia', 'competencia', ob),
      c('valor', 'moeda', ob),
      c('status', 'enum', { ...ob, enum: 'STATUS_DESCONTO' }),
      c('data_envio_dp', 'data'),
      c('data_confirmacao', 'data'),
      c('observacoes', 'texto_longo'),
    ],
  }),
  t({
    nome: 'AUDITORIA_RESTRITA', planilha: 'MOTORISTAS', transacional: false, sistema: true,
    descricao: 'Auditoria das tabelas restritas (os dados pessoais não vão para a AUDITORIA da base)',
    colunas: AUDITORIA_COLUNAS,
  }),
];

const POR_NOME = Object.fromEntries(TABELAS.map((d) => [d.nome, d]));

export function tabela(nome) {
  const def = POR_NOME[nome];
  if (!def) throw new Error(`Tabela desconhecida: ${nome}`);
  return def;
}

export function nomesColunas(nome) {
  return tabela(nome).colunas.map((col) => col.nome);
}

export function tabelasDaPlanilha(planilha) {
  return TABELAS.filter((d) => d.planilha === planilha);
}

/** Tabela de auditoria correspondente (dados restritos auditam na planilha restrita). */
export function tabelaDeAuditoria(nome) {
  return tabela(nome).planilha === 'MOTORISTAS' ? 'AUDITORIA_RESTRITA' : 'AUDITORIA';
}

/** Verificações de consistência do próprio esquema (usadas nos testes). */
export function validarEsquema() {
  const erros = [];
  for (const def of TABELAS) {
    const nomes = def.colunas.map((col) => col.nome);
    const dup = nomes.filter((n, i) => nomes.indexOf(n) !== i);
    if (dup.length) erros.push(`${def.nome}: colunas duplicadas ${dup.join(', ')}`);
    for (const k of def.chave) if (!nomes.includes(k)) erros.push(`${def.nome}: chave ${k} não é coluna`);
    if (def.transacional) {
      for (const k of COLUNAS_CONTROLE) if (!nomes.includes(k)) erros.push(`${def.nome}: falta ${k}`);
    }
    for (const col of def.colunas) {
      if (!TIPOS.includes(col.tipo)) erros.push(`${def.nome}.${col.nome}: tipo ${col.tipo} desconhecido`);
      if (col.tipo === 'enum' && !ENUMS[col.enum]) erros.push(`${def.nome}.${col.nome}: enum ${col.enum} não existe`);
      if (col.tipo !== 'enum' && col.enum) erros.push(`${def.nome}.${col.nome}: enum em coluna não-enum`);
      if (col.fk) {
        const [tab, coluna] = col.fk.split('.');
        if (!POR_NOME[tab] || !POR_NOME[tab].colunas.some((x) => x.nome === coluna)) erros.push(`${def.nome}.${col.nome}: fk ${col.fk} inválida`);
      }
      if (!/^[a-z][a-z0-9_]*$/.test(col.nome)) erros.push(`${def.nome}.${col.nome}: nome fora do padrão snake_case`);
    }
  }
  return erros;
}

/** Hash FNV-1a de 32 bits (hex). Suficiente para detectar mudança, não para segurança. */
export function hashTexto(texto) {
  let h = 0x811c9dc5;
  const s = String(texto);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/**
 * Assinatura da definição de uma tabela mais a ordem real do cabeçalho na aba. O setup
 * só reaplica formatos, validações e proteções quando ela muda, o que deixa a
 * revalidação rápida.
 */
export function assinaturaTabela(nome, cabecalho = []) {
  const def = tabela(nome);
  return hashTexto(JSON.stringify({
    c: def.colunas.map((x) => [x.nome, x.tipo, x.enum || '', x.enum ? ENUMS[x.enum] : '', !!x.calculada]),
    s: def.sistema,
    h: cabecalho,
  }));
}
