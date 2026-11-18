/**
 * Parâmetros padrão da aba CONFIG. A rotina de setup cria só as chaves que ainda não
 * existem; valores já editados na planilha nunca são sobrescritos.
 *
 * Valor vazio = "não definido". As rotinas que dependem dele avisam em vez de inventar um
 * valor (ex.: sem FATOR_DEPRECIACAO_VENAL não há projeção de valor venal).
 */

export const CONFIG_PADRAO = [
  // Geral
  ['NOME_EMPRESA', 'Transportadora Gobor', 'TEXTO', 'Nome exibido no painel e nos e-mails'],
  ['URL_WEBAPP', '', 'URL', 'Endereço do painel (preencher depois de implantar o Web App)'],
  ['PLANILHA_MOTORISTAS_ID', '', 'ID_DRIVE', 'Planilha restrita de motoristas (criada pelo setup)'],
  ['PASTA_RESTRITA_ID', '', 'ID_DRIVE', 'Pasta de acesso restrito (ADMIN/DP) para a planilha de motoristas e a pasta Motoristas/. Vazio = Meu Drive de quem roda o setup'],
  // Pastas do Drive (criadas pelo setup)
  ['PASTA_RAIZ_ID', '', 'ID_DRIVE', '🚛 Frota Gobor — Documentos'],
  ['PASTA_ENTRADA_ID', '', 'ID_DRIVE', '📥 Entrada'],
  ['PASTA_REVISAO_ID', '', 'ID_DRIVE', '⚠️ Revisão'],
  ['PASTA_ERROS_ID', '', 'ID_DRIVE', '❌ Erros'],
  ['PASTA_DUPLICADOS_ID', '', 'ID_DRIVE', '🔁 Duplicados'],
  ['PASTA_MULTAS_ID', '', 'ID_DRIVE', 'Multas/{AAAA}/{PLACA}/'],
  ['PASTA_IPVA_ID', '', 'ID_DRIVE', 'IPVA/{AAAA}/'],
  ['PASTA_LICENCIAMENTO_ID', '', 'ID_DRIVE', 'Licenciamento/{AAAA}/'],
  ['PASTA_CRLV_ID', '', 'ID_DRIVE', 'CRLV/{AAAA}/'],
  ['PASTA_COMPROVANTES_ID', '', 'ID_DRIVE', 'Comprovantes/{AAAA}/{MM}/'],
  ['PASTA_MOTORISTAS_ID', '', 'ID_DRIVE', 'Motoristas/{NOME}/ (acesso restrito)'],
  // Prazos e alertas
  ['DIAS_ALERTA_VENCIMENTO', '7', 'NUMERO', 'Janela do "vence em breve" das obrigações'],
  ['DIAS_ALERTA_INDICACAO', '10', 'NUMERO', 'Multas novas com prazo de indicação em até N dias entram no e-mail de resultado'],
  ['DIAS_ALERTA_DIARIO', '5', 'NUMERO', 'Prazos de indicação e defesa em até N dias entram no alerta diário'],
  ['EMAILS_ALERTA_DIARIO', '', 'EMAILS', 'Destinatários do alerta diário (vazio = ADMINs)'],
  ['EMAILS_RESUMO_SEMANAL', '', 'EMAILS', 'Destinatários do resumo semanal (vazio = ADMINs)'],
  ['EMAILS_FECHAMENTO_MENSAL', '', 'EMAILS', 'Destinatários do fechamento mensal (vazio = ADMINs)'],
  ['EMAILS_INGESTAO', '', 'EMAILS', 'Destinatários do e-mail de resultado da ingestão (vazio = ADMINs)'],
  // Folha / motoristas
  ['EMAIL_DP', '', 'EMAILS', 'E-mail do DP para o relatório mensal de descontos'],
  ['DIA_FECHAMENTO_FOLHA', '', 'NUMERO', 'Dia do mês em que a folha fecha (a definir com o DP)'],
  ['LIMITE_DESCONTO_MENSAL_MOTORISTA', '', 'NUMERO', 'Teto mensal de desconto por motorista em R$ (a confirmar com o DP e a convenção coletiva)'],
  ['PONTOS_LIMITE_SEM_GRAVISSIMA', '40', 'NUMERO', 'Limite de pontos em 12 meses sem gravíssima (CTB art. 261; conferir regra vigente)'],
  ['PONTOS_LIMITE_1_GRAVISSIMA', '30', 'NUMERO', 'Limite de pontos em 12 meses com 1 gravíssima (conferir regra vigente)'],
  ['PONTOS_LIMITE_2_GRAVISSIMAS', '20', 'NUMERO', 'Limite de pontos em 12 meses com 2 ou mais gravíssimas (conferir regra vigente)'],
  ['PONTOS_LIMITE_EAR', '40', 'NUMERO', 'Limite para quem exerce atividade remunerada (EAR) (conferir regra vigente)'],
  // Custos
  ['FATOR_DEPRECIACAO_VENAL', '', 'NUMERO', 'Fator para projetar o valor venal do ano seguinte (ex.: 0,92). Vazio = sem projeção'],
  // API do Claude (Fase 5). A chave fica em Propriedades do Script, nunca aqui.
  ['API_MODELO', 'claude-sonnet-5-5', 'TEXTO', 'Modelo usado na leitura de documentos'],
  ['API_ESFORCO', 'low', 'TEXTO', 'output_config.effort: low, medium ou high'],
  ['API_FALLBACK', 'default', 'TEXTO', 'Fallback do lado do servidor em caso de recusa ("default" ou vazio para desligar)'],
  ['LIMIAR_CONFIANCA', '0.85', 'NUMERO', 'Abaixo disso o documento vai para a Fila de Revisão'],
  ['TAMANHO_MAX_ARQUIVO_MB', '20', 'NUMERO', 'Arquivos maiores vão para Revisão (limite prático do UrlFetch)'],
  ['INGESTAO_MAX_ARQUIVOS', '20', 'NUMERO', 'Máximo de arquivos por execução'],
  ['INGESTAO_ORCAMENTO_SEG', '270', 'NUMERO', 'Tempo máximo por execução antes de parar e retomar na próxima'],
  ['INGESTAO_HORARIO', '07-19', 'TEXTO', 'Janela do gatilho de ingestão (horas, dias úteis)'],
];

export function configPadraoComoObjeto() {
  return Object.fromEntries(CONFIG_PADRAO.map(([k, v]) => [k, v]));
}
