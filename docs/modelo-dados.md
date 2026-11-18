# Modelo de dados

> Gerado por `npm run docs:modelo` a partir de `core/schema.js`. Não edite à mão.

Planilhas:
- **BASE**: "🚛 Frota Gobor — Base" (Drive compartilhado).
- **MOTORISTAS**: "🔒 Frota Gobor — Motoristas" (acesso restrito ADMIN/DP; decisão D-15).

Legenda: **obr.** = obrigatório · **calc.** = calculado pelo sistema (coluna protegida) · **chave** = identifica o registro.

## VEICULOS

Cadastro mestre de veículos (fonte única da verdade). Planilha: **BASE** · chave: `veiculo_id`.

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `veiculo_id` | id | obr. · chave | Chave interna (V0001). Nunca muda |
| `renavam` | renavam |  | 11 dígitos com zeros à esquerda. Único e obrigatório para veículos ativos |
| `placa` | placa | obr. | Como está no CRLV atual |
| `placa_norm` | placa | calc. | Forma canônica (Mercosul convertido para dígito). Única entre os ativos |
| `chassi` | texto |  |  |
| `tipo` | enum `TIPO_VEICULO` | obr. |  |
| `categoria` | enum `CATEGORIA_VEICULO` | calc. | Derivada do tipo |
| `marca_modelo` | texto |  |  |
| `ano_fabricacao` | inteiro |  |  |
| `ano_modelo` | inteiro |  |  |
| `cnpj_proprietario` | cnpj | → FILIAIS.cnpj |  |
| `uf_registro` | enum `UF` | obr. |  |
| `municipio_registro` | texto |  |  |
| `situacao` | enum `SITUACAO_VEICULO` | obr. |  |
| `data_aquisicao` | data |  |  |
| `data_venda` | data |  |  |
| `isento_ipva` | sn |  |  |
| `motivo_isencao` | texto |  |  |
| `forma_pgto_ipva_padrao` | enum `FORMA_PGTO_IPVA` |  |  |
| `pasta_drive_id` | id |  |  |
| `observacoes` | texto_longo |  |  |
| `criado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_por` | email | calc. | E-mail de quem fez a última alteração |

## OBRIGACOES

Uma linha por veículo × exercício × tributo × parcela. Planilha: **BASE** · chave: `obrigacao_id`.

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `obrigacao_id` | id | obr. · chave | Ex.: 2027-IPVA-V0001-U |
| `exercicio` | inteiro | obr. |  |
| `tributo` | enum `TRIBUTO` | obr. |  |
| `descricao_outro` | texto |  | Para tributo = OUTRO (tacógrafo, RNTRC, seguro, AET…) |
| `veiculo_id` | id | obr. · → VEICULOS.veiculo_id |  |
| `placa` | placa |  | Retrato no momento da geração |
| `uf` | enum `UF` |  | Retrato no momento da geração |
| `cnpj` | cnpj |  | Retrato no momento da geração |
| `forma` | enum `FORMA_OBRIGACAO` |  |  |
| `parcela` | enum `PARCELA` | obr. |  |
| `vencimento` | data |  |  |
| `valor_estimado` | moeda |  | Camada 1: orçamento |
| `base_estimativa` | texto |  | Ex.: venal 180.000 × 1% − desc. 3% |
| `valor_guia` | moeda |  | Camada 2: devido |
| `linha_digitavel` | texto |  |  |
| `valor_pago` | moeda |  | Camada 3: realizado. Obrigatório para marcar como pago |
| `data_pagamento` | data |  |  |
| `encargos` | moeda |  | Juros + multa por atraso |
| `desconto_obtido` | moeda |  |  |
| `base_calculo` | moeda |  | Valor venal informado na guia |
| `aliquota_aplicada` | pct |  |  |
| `nr_lancamento_erp` | texto |  | Formato "MTO 421779" |
| `data_lancamento_erp` | data |  |  |
| `status` | enum `STATUS_OBRIGACAO` | obr. |  |
| `situacao_prazo` | enum `SITUACAO_PRAZO` | calc. |  |
| `responsavel_pgto` | enum `RESPONSAVEL_PGTO` |  |  |
| `repasse_status` | enum `REPASSE_STATUS` |  |  |
| `repasse_valor` | moeda |  |  |
| `repasse_data` | data |  |  |
| `crlv_emitido` | sn |  |  |
| `data_crlv` | data |  |  |
| `multas_quitadas_junto` | moeda |  |  |
| `bloqueio_motivo` | texto |  |  |
| `doc_guia_id` | id |  |  |
| `doc_comprovante_id` | id |  |  |
| `origem` | enum `ORIGEM_REGISTRO` |  |  |
| `observacoes` | texto_longo |  |  |
| `criado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_por` | email | calc. | E-mail de quem fez a última alteração |

## MULTAS

Multas da frota inteira (operação própria e locados). Planilha: **BASE** · chave: `multa_id`.

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `multa_id` | id | obr. · chave |  |
| `chave_dedupe` | texto | calc. | ÓRGÃO|AIT normalizados |
| `orgao_sigla` | texto | obr. |  |
| `orgao_nome` | texto |  |  |
| `orgao_codigo` | texto |  |  |
| `nr_ait` | texto | obr. |  |
| `nr_notificacao` | texto |  |  |
| `veiculo_id` | id | → VEICULOS.veiculo_id |  |
| `placa_documento` | texto |  | Como veio no documento |
| `placa_norm` | placa | calc. |  |
| `data_hora_infracao` | datahora |  |  |
| `uf_infracao` | enum `UF` |  |  |
| `municipio` | texto |  |  |
| `local` | texto |  |  |
| `cod_infracao` | texto |  | Ex.: 745-5 |
| `desdobramento` | texto |  |  |
| `descricao` | texto_longo |  |  |
| `amparo_legal` | texto |  |  |
| `gravidade` | enum `GRAVIDADE` |  |  |
| `fator_multiplicador` | numero |  |  |
| `pontos` | inteiro |  |  |
| `vel_permitida` | numero |  |  |
| `vel_medida` | numero |  |  |
| `vel_considerada` | numero |  |  |
| `responsavel_infracao` | enum `RESPONSAVEL_INFRACAO` |  |  |
| `suspensao_cnh` | sn |  | Quando o documento indicar |
| `fase` | enum `FASE_MULTA` | obr. |  |
| `data_expedicao` | data |  | Expedição da notificação de autuação |
| `data_expedicao_penalidade` | data |  | Expedição da notificação de penalidade |
| `ait_origem` | texto |  | Para NIC: AIT da infração original |
| `condutor_no_documento` | texto |  |  |
| `valor_original` | moeda |  |  |
| `valor_com_desconto` | moeda |  | Como informado no documento |
| `valor_desconto_sne` | moeda |  | Como informado no documento |
| `vencimento_pgto` | data |  |  |
| `linha_digitavel` | texto |  |  |
| `prazo_defesa_previa` | data |  |  |
| `prazo_indicacao_condutor` | data |  |  |
| `prazo_recurso` | data |  |  |
| `responsavel` | enum `RESPONSAVEL_MULTA` | calc. | Pela locação vigente na data da infração |
| `locatario_id` | id | → LOCATARIOS.locatario_id |  |
| `motorista_id` | id |  | Infrator (dados pessoais só na planilha restrita) |
| `como_identificado` | enum `COMO_IDENTIFICADO` |  |  |
| `decisao_condutor` | enum `DECISAO_CONDUTOR` |  |  |
| `decidido_por` | email |  |  |
| `data_decisao` | data |  |  |
| `motivo_decisao` | texto_longo |  |  |
| `indicacao_status` | enum `INDICACAO_STATUS` |  |  |
| `data_indicacao` | data |  |  |
| `protocolo_indicacao` | texto |  |  |
| `pontos_no_motorista` | sn |  |  |
| `custo_nic_estimado` | moeda |  |  |
| `custo_assumido_por` | enum `CUSTO_ASSUMIDO_POR` |  |  |
| `pct_motorista` | pct |  |  |
| `inclui_nic_no_desconto` | sn |  |  |
| `forma_ressarcimento` | enum `FORMA_RESSARCIMENTO` |  |  |
| `n_parcelas` | inteiro |  |  |
| `valor_a_ressarcir` | moeda |  |  |
| `valor_ressarcido` | moeda | calc. |  |
| `doc_autorizacao_id` | id |  |  |
| `defesa_status` | enum `DEFESA_STATUS` |  |  |
| `protocolo` | texto |  |  |
| `resultado` | enum `RESULTADO_DEFESA` |  |  |
| `pgto_status` | enum `PGTO_STATUS` |  |  |
| `data_pgto` | data |  |  |
| `valor_pago` | moeda |  |  |
| `desconto_aproveitado` | moeda |  |  |
| `pago_via` | enum `PAGO_VIA` |  |  |
| `obrigacao_licenciamento_id` | id | → OBRIGACOES.obrigacao_id | Quando paga junto com o licenciamento |
| `nr_lancamento_erp` | texto |  |  |
| `reembolso_status` | enum `REEMBOLSO_STATUS` |  |  |
| `reembolso_valor` | moeda |  |  |
| `data_cobranca` | data |  |  |
| `data_recebimento` | data |  |  |
| `status_geral` | enum `STATUS_GERAL_MULTA` | calc. |  |
| `prazo_situacao` | enum `PRAZO_MULTA` | calc. |  |
| `flags` | lista | calc. |  |
| `doc_ids` | lista |  |  |
| `confianca_extracao` | numero |  |  |
| `origem` | enum `ORIGEM_REGISTRO` |  |  |
| `observacoes` | texto_longo |  |  |
| `criado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_por` | email | calc. | E-mail de quem fez a última alteração |

## FILIAIS

CNPJs da Gobor (matriz e filiais). Planilha: **BASE** · chave: `cnpj`.

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `cnpj` | cnpj | obr. · chave |  |
| `nome_curto` | texto | obr. |  |
| `razao_social` | texto |  |  |
| `uf` | enum `UF` | obr. |  |
| `municipio` | texto |  |  |
| `ativo` | sn | obr. |  |
| `observacoes` | texto_longo |  |  |
| `criado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_por` | email | calc. | E-mail de quem fez a última alteração |

## LOCATARIOS

Clientes que alugam veículos da Gobor. Planilha: **BASE** · chave: `locatario_id`.

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `locatario_id` | id | obr. · chave |  |
| `nome` | texto | obr. |  |
| `cnpj_cpf` | documento |  |  |
| `contato` | texto |  |  |
| `email` | emails |  |  |
| `telefone` | texto |  |  |
| `ativo` | sn |  |  |
| `observacoes` | texto_longo |  |  |
| `ref_painel` | texto |  | Id do locatário no painel "Locação de Carretas Gobor" (decisão N9) |
| `criado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_por` | email | calc. | E-mail de quem fez a última alteração |

## LOCACOES

Vigência veículo ↔ locatário (fim vazio = vigente). Planilha: **BASE** · chave: `locacao_id`.

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `locacao_id` | id | obr. · chave |  |
| `veiculo_id` | id | obr. · → VEICULOS.veiculo_id |  |
| `locatario_id` | id | obr. · → LOCATARIOS.locatario_id |  |
| `inicio` | data | obr. |  |
| `fim` | data |  |  |
| `contrato_ref` | texto |  |  |
| `repassa_multas` | sn |  | Padrão S |
| `repassa_licenciamento` | sn |  |  |
| `repassa_ipva` | sn |  |  |
| `observacoes` | texto_longo |  |  |
| `ref_painel` | texto |  | Contrato#item no painel "Locação de Carretas Gobor" (decisão N9) |
| `criado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_por` | email | calc. | E-mail de quem fez a última alteração |

## CALENDARIO_VENCIMENTOS

Vencimentos oficiais por exercício, UF, grupo e final de placa (sempre com fonte). Planilha: **BASE** · chave: `exercicio + uf + tributo + grupo_veiculo + final_placa + parcela`.

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `exercicio` | inteiro | obr. · chave |  |
| `uf` | enum `UF` | obr. · chave |  |
| `tributo` | enum `TRIBUTO` | obr. · chave |  |
| `grupo_veiculo` | enum `GRUPO_VEICULO` | obr. · chave |  |
| `final_placa` | enum `FINAL_PLACA` | obr. · chave |  |
| `parcela` | enum `PARCELA` | obr. · chave |  |
| `vencimento` | data | obr. |  |
| `desconto_pct` | pct |  |  |
| `provisorio` | sn |  | S = projetado do calendário oficial do ano anterior (decisão D-10) |
| `fonte` | texto | obr. | Norma ou página oficial (link) |
| `observacoes` | texto_longo |  |  |
| `criado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_por` | email | calc. | E-mail de quem fez a última alteração |

## ALIQUOTAS_IPVA

Se o tipo paga IPVA na UF e com qual alíquota (sempre com fonte). Planilha: **BASE** · chave: `exercicio + uf + tipo_ou_categoria`.

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `exercicio` | inteiro | obr. · chave |  |
| `uf` | enum `UF` | obr. · chave |  |
| `tipo_ou_categoria` | texto | obr. · chave | Um TIPO_VEICULO, uma CATEGORIA_VEICULO ou um GRUPO_VEICULO |
| `tributado` | sn | obr. |  |
| `aliquota_pct` | pct |  | Em pontos percentuais: 1,9 = 1,9% |
| `fonte` | texto | obr. |  |
| `observacoes` | texto_longo |  |  |
| `criado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_por` | email | calc. | E-mail de quem fez a última alteração |

## TAXAS_LICENCIAMENTO

Taxa anual de licenciamento do DETRAN de cada UF (sempre com fonte). Planilha: **BASE** · chave: `exercicio + uf + grupo_veiculo`.

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `exercicio` | inteiro | obr. · chave |  |
| `uf` | enum `UF` | obr. · chave |  |
| `grupo_veiculo` | enum `GRUPO_VEICULO` | obr. · chave |  |
| `valor` | moeda | obr. |  |
| `fonte` | texto | obr. |  |
| `observacoes` | texto_longo |  |  |
| `criado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_por` | email | calc. | E-mail de quem fez a última alteração |

## VALORES_VENAIS

Valor venal por veículo e exercício, com a origem do dado. Planilha: **BASE** · chave: `veiculo_id + exercicio`.

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `veiculo_id` | id | obr. · chave · → VEICULOS.veiculo_id |  |
| `exercicio` | inteiro | obr. · chave |  |
| `valor_venal` | moeda | obr. |  |
| `origem` | enum `ORIGEM_VENAL` | obr. |  |
| `fonte` | texto |  |  |
| `observacoes` | texto_longo |  |  |
| `criado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_por` | email | calc. | E-mail de quem fez a última alteração |

## DOCUMENTOS

Todo arquivo que entrou pela pasta de Entrada. Planilha: **BASE** · chave: `doc_id` · aba de sistema (protegida).

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `doc_id` | id | obr. · chave | fileId do Drive |
| `nome_original` | texto |  |  |
| `nome_padronizado` | texto |  |  |
| `md5` | texto |  |  |
| `mime` | texto |  |  |
| `paginas` | inteiro |  |  |
| `tipo_documento` | enum `TIPO_DOCUMENTO` |  |  |
| `placa_extraida` | texto |  |  |
| `renavam_extraido` | texto |  |  |
| `entidade` | enum `ENTIDADE_DOC` |  |  |
| `entidade_id` | texto |  |  |
| `confianca` | numero |  |  |
| `status` | enum `STATUS_DOCUMENTO` |  |  |
| `motivo_revisao` | texto_longo |  |  |
| `json_extraido_id` | id |  |  |
| `modelo` | texto |  |  |
| `tokens_entrada` | inteiro |  |  |
| `tokens_saida` | inteiro |  |  |
| `custo_estimado_usd` | numero |  |  |
| `processado_em` | datahora |  |  |
| `erro` | texto_longo |  |  |
| `criado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_por` | email | calc. | E-mail de quem fez a última alteração |

## USUARIOS

Quem acessa o painel e com qual perfil. Planilha: **BASE** · chave: `email`.

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `email` | email | obr. · chave |  |
| `nome` | texto |  |  |
| `perfil` | enum `PERFIL` | obr. |  |
| `ativo` | sn | obr. |  |
| `observacoes` | texto_longo |  |  |
| `criado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_por` | email | calc. | E-mail de quem fez a última alteração |

## CONFIG

Parâmetros do sistema (chave/valor). Planilha: **BASE** · chave: `chave`.

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `chave` | texto | obr. · chave |  |
| `valor` | texto |  |  |
| `tipo` | enum `TIPO_CONFIG` |  |  |
| `descricao` | texto_longo |  |  |
| `criado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_por` | email | calc. | E-mail de quem fez a última alteração |

## AUDITORIA

Quem, quando e o que mudou (antes/depois). Planilha: **BASE** · aba de sistema (protegida).

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `quando` | datahora | obr. |  |
| `quem` | email | obr. |  |
| `origem` | enum `ORIGEM_ACAO` |  |  |
| `acao` | texto | obr. |  |
| `entidade` | texto | obr. |  |
| `entidade_id` | texto |  |  |
| `antes_json` | json |  |  |
| `depois_json` | json |  |  |
| `detalhe` | texto_longo |  |  |

## LOG_EXECUCAO

Execuções de rotinas e gatilhos. Planilha: **BASE** · chave: `execucao_id` · aba de sistema (protegida).

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `execucao_id` | id | obr. · chave |  |
| `rotina` | texto | obr. |  |
| `inicio` | datahora | obr. |  |
| `fim` | datahora |  |  |
| `duracao_seg` | numero |  |  |
| `status` | enum `STATUS_EXECUCAO` |  |  |
| `contagens_json` | json |  |  |
| `erro` | texto_longo |  |  |
| `usuario` | email |  |  |

## SNAPSHOT_KPI

Foto diária dos indicadores (para gráficos de tendência). Planilha: **BASE** · chave: `data + kpi + dimensao` · aba de sistema (protegida).

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `data` | data | obr. · chave |  |
| `kpi` | texto | obr. · chave |  |
| `dimensao` | texto | chave | Ex.: TOTAL, UF=PR, FILIAL=Matriz |
| `valor` | numero |  |  |
| `observacao` | texto |  |  |

## MOTORISTAS

Dados pessoais dos motoristas (acesso restrito). Planilha: **MOTORISTAS** · chave: `motorista_id`.

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `motorista_id` | id | obr. · chave |  |
| `nome` | texto | obr. |  |
| `cpf` | cpf |  |  |
| `matricula` | texto |  |  |
| `filial` | cnpj | → FILIAIS.cnpj |  |
| `cnh_numero` | texto |  |  |
| `cnh_categoria` | enum `CNH_CATEGORIA` |  |  |
| `cnh_validade` | data |  |  |
| `exerce_atividade_remunerada` | sn |  | EAR na CNH |
| `situacao` | enum `SITUACAO_MOTORISTA` | obr. |  |
| `data_admissao` | data |  |  |
| `data_desligamento` | data |  |  |
| `termo_desconto_assinado` | sn |  |  |
| `doc_termo_id` | id |  |  |
| `observacoes` | texto_longo |  |  |
| `criado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_por` | email | calc. | E-mail de quem fez a última alteração |

## DESCONTOS_FOLHA

Uma linha por parcela de desconto em folha. Planilha: **MOTORISTAS** · chave: `desconto_id`.

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `desconto_id` | id | obr. · chave |  |
| `multa_id` | id | obr. · → MULTAS.multa_id |  |
| `motorista_id` | id | obr. · → MOTORISTAS.motorista_id |  |
| `parcela` | inteiro | obr. |  |
| `total_parcelas` | inteiro | obr. |  |
| `competencia` | competencia | obr. |  |
| `valor` | moeda | obr. |  |
| `status` | enum `STATUS_DESCONTO` | obr. |  |
| `data_envio_dp` | data |  |  |
| `data_confirmacao` | data |  |  |
| `observacoes` | texto_longo |  |  |
| `criado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_em` | datahora | calc. | Preenchido pelo sistema |
| `atualizado_por` | email | calc. | E-mail de quem fez a última alteração |

## AUDITORIA_RESTRITA

Auditoria das tabelas restritas (os dados pessoais não vão para a AUDITORIA da base). Planilha: **MOTORISTAS** · aba de sistema (protegida).

| Coluna | Tipo | Regras | Descrição |
|---|---|---|---|
| `quando` | datahora | obr. |  |
| `quem` | email | obr. |  |
| `origem` | enum `ORIGEM_ACAO` |  |  |
| `acao` | texto | obr. |  |
| `entidade` | texto | obr. |  |
| `entidade_id` | texto |  |  |
| `antes_json` | json |  |  |
| `depois_json` | json |  |  |
| `detalhe` | texto_longo |  |  |

## Listas (enums)

- **SN**: S, N
- **UF**: AC, AL, AM, AP, BA, CE, DF, ES, GO, MA, MG, MS, MT, PA, PB, PE, PI, PR, RJ, RN, RO, RR, RS, SC, SE, SP, TO
- **PERFIL**: ADMIN, FINANCEIRO, DP, CONSULTA
- **TIPO_CONFIG**: TEXTO, NUMERO, SN, EMAILS, ID_DRIVE, URL, JSON
- **TIPO_VEICULO**: CAVALO, CARRETA, BITREM, TRUCK, TOCO, AUTOMOVEL, VAN, UTILITARIO, CARRETINHA
- **CATEGORIA_VEICULO**: TRACAO, IMPLEMENTO, LEVE
- **SITUACAO_VEICULO**: OPERACAO_PROPRIA, LOCADO_TERCEIRO, PARADO, A_VENDA, VENDIDO, BAIXADO, EM_TRANSFERENCIA, HISTORICO
- **FORMA_PGTO_IPVA**: COTA_UNICA, PARCELADO
- **TRIBUTO**: IPVA, LICENCIAMENTO, OUTRO
- **GRUPO_VEICULO**: TODOS, CAMINHAO, IMPLEMENTO, AUTOMOVEL, UTILITARIO
- **FINAL_PLACA**: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, *
- **PARCELA**: U, 1, 2, 3, 4, 5
- **ORIGEM_VENAL**: GUIA, CSV_SEFAZ, MANUAL, PROJECAO
- **FORMA_OBRIGACAO**: COTA_UNICA, PARCELADO, ISENTO, NAO_APLICA
- **STATUS_OBRIGACAO**: PREVISTO, GUIA_DISPONIVEL, LANCADO_ERP, PAGO, PAGO_SEM_LANCAMENTO, ISENTO, NAO_APLICA, CANCELADO, BLOQUEADO
- **SITUACAO_PRAZO**: EM_DIA, VENCE_EM_7_DIAS, VENCE_HOJE, VENCIDO
- **RESPONSAVEL_PGTO**: GOBOR, LOCATARIO
- **REPASSE_STATUS**: NAO_APLICA, A_COBRAR, COBRADO, RECEBIDO
- **ORIGEM_REGISTRO**: CARGA_INICIAL, GERADO, PDF, CSV, MANUAL, MIGRACAO
- **GRAVIDADE**: LEVE, MEDIA, GRAVE, GRAVISSIMA
- **RESPONSAVEL_INFRACAO**: CONDUTOR, PROPRIETARIO, EMBARCADOR, TRANSPORTADOR
- **FASE_MULTA**: AUTUACAO, PENALIDADE, NIC
- **RESPONSAVEL_MULTA**: OPERACAO_PROPRIA, LOCATARIO
- **COMO_IDENTIFICADO**: ESCALA, RASTREADOR, TACOGRAFO, DECLARACAO, OUTRO
- **DECISAO_CONDUTOR**: PENDENTE, INDICAR, NAO_INDICAR_PAGAR_NIC, LOCATARIO_INDICA, NAO_APLICA
- **INDICACAO_STATUS**: NAO_APLICA, AGUARDANDO_ASSINATURA, ENVIADA, CONFIRMADA, RECUSADA
- **CUSTO_ASSUMIDO_POR**: MOTORISTA, EMPRESA, LOCATARIO, DIVIDIDO
- **FORMA_RESSARCIMENTO**: DESCONTO_FOLHA_A_VISTA, DESCONTO_FOLHA_PARCELADO, PAGAMENTO_DIRETO, EMPRESA_ASSUME, LOCATARIO_REEMBOLSA
- **DEFESA_STATUS**: NAO, DEFESA_PREVIA, RECURSO_JARI, RECURSO_CETRAN
- **RESULTADO_DEFESA**: PENDENTE, DEFERIDO, INDEFERIDO
- **PGTO_STATUS**: PENDENTE, PAGO, NAO_PAGAR
- **PAGO_VIA**: BOLETO, LICENCIAMENTO
- **REEMBOLSO_STATUS**: NAO_APLICA, A_COBRAR, COBRADO, RECEBIDO, PERDIDO
- **STATUS_GERAL_MULTA**: NOVA, IDENTIFICAR_MOTORISTA, DECIDIR_INDICACAO, AGUARDANDO_PAGAMENTO, EM_DEFESA, PAGA, A_RESSARCIR, ENCERRADA, CANCELADA, DEFERIDA
- **PRAZO_MULTA**: EM_DIA, URGENTE, VENCIDA
- **SITUACAO_MOTORISTA**: ATIVO, AFASTADO, DESLIGADO
- **CNH_CATEGORIA**: A, B, C, D, E, AB, AC, AD, AE
- **STATUS_DESCONTO**: PROGRAMADO, ENVIADO_DP, DESCONTADO, NAO_DESCONTADO, CANCELADO, A_DESCONTAR_NA_RESCISAO
- **TIPO_DOCUMENTO**: MULTA_NA, MULTA_NP, NIC, GUIA_IPVA, GUIA_LICENCIAMENTO, COMPROVANTE_PAGAMENTO, CRLV, EXTRATO_DEBITOS, OUTRO
- **ENTIDADE_DOC**: MULTA, OBRIGACAO, VEICULO, MOTORISTA
- **STATUS_DOCUMENTO**: PROCESSADO, REVISAO, ERRO, DUPLICADO, IGNORADO
- **ORIGEM_ACAO**: WEBAPP, MENU, GATILHO, SCRIPT, IMPORTACAO
- **STATUS_EXECUCAO**: EM_ANDAMENTO, OK, PARCIAL, ERRO
