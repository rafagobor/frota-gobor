# Decisões e premissas: Fase 0 (Descoberta)

**Projeto:** Painel de Frota Gobor (IPVA · Licenciamento · Multas · Motoristas)
**Data:** 18/11/2026
**Status:** ✅ APROVADO em 18/11/2026. Respostas e pendências na seção 9; o que não foi respondido segue o padrão.

Como ler este documento: a seção 1 resume tudo. As seções 5 e 6 trazem as perguntas que precisam de resposta. As demais registram o que verifiquei e o que vou assumir se você não disser o contrário.

---

## 1. Resumo

- **Arquitetura padrão mantida**: Google Sheets + Apps Script + Web App + Drive + API do Claude. Custo fixo zero.
- **O Anexo A está correto**: todas as contagens e inconsistências conferem com a aba "previa 2027". Encontrei **mais 8 pontos** que o anexo não cita (seção 3).
- **Dois ajustes obrigatórios na chamada à API do Claude** em relação ao que o prompt descreve (seção 4, D-09):
  - no `claude-sonnet-5-5`, `tool_choice` forçado devolve **erro 400**, então a saída estruturada usa `output_config.format` (JSON Schema);
  - `temperature` também dá erro 400 nesse modelo, então não é enviada.
- **Risco operacional que já existe hoje**: há sinais de que a automação antiga de multas está parada desde agosto (seção 3, A9). Se isso for verdade, pode haver prazos de indicação de condutor de veículos locados vencendo agora. **Vale conferir já**, independentemente deste projeto.
- **Dados de motoristas precisam de uma planilha separada**: a proteção de aba do Google Sheets impede edição, mas **não impede leitura**. Proposta em D-15.
- **O que trava a Fase 1**:
  - N1: repositório GitHub (este ambiente é temporário e apaga os arquivos);
  - Q4: onde ficam a base e as pastas no Drive;
  - Q15: quem é ADMIN.

---

## 2. O que foi verificado

### 2.1 Aba "previa 2027" (arquivo `dados/Controle_IPVA_LICENCIAMENTO_2026.xlsx`)

| Item do Anexo A | Resultado |
|---|---|
| 212 veículos, linhas 2–213, 7 colunas, sem células mescladas | ✅ confere |
| Tipos: CARRETA 125 · CAVALO 69 (2 com espaço) · AUTOMOVEL 6 · BI TREM 3 · TOCO 2 · VAN 1 · SAVEIRO 1 · CARRETINHA 1 · TRUCK 1 · sem tipo 3 | ✅ confere |
| UF: PR 102 · SP 63 · SC 25 · GO 21 · RO 1 | ✅ confere |
| CNPJ × UF (87 / 63 / 25 / 21 / 13 / 2 / 1 sem CNPJ) | ✅ confere |
| RLI4H26 com DV inválido (único RENAVAM inválido dos 212) | ✅ confere (ver A5) |
| Nenhum RENAVAM e nenhuma placa duplicados após normalização (inclusive pela equivalência Mercosul) | ✅ confere |
| Placas: 130 Mercosul e 82 no formato antigo, todas válidas | ✅ |
| RENAVAM gravado como número: 179 com 10 dígitos e **33 com 9 dígitos** (séries antigas) | ✅ completar com zeros resolve todos |
| Coluna F: PR por final de placa (o final 7 com o ano 2025), SP com o mês por extenso, GO em 2025, RO vazio | ✅ confere |
| 18 com "obs: era Araquari…", todos hoje em PR/0001-97 | ✅ confere (ver A2) |

### 2.2 Google Drive (somente leitura, pelo conector disponível nesta sessão)

Nada foi alterado no seu Drive. Apenas li metadados e uma amostra da planilha "Multas Frotas Alugadas". Detalhes nos itens A9 e A10.

### 2.3 API do Claude (documentação atual conferida em 18/11/2026)

- `claude-sonnet-5-5` existe e é o Sonnet atual: US$ 2 por milhão de tokens de entrada e US$ 10 por milhão de saída.
- Limites para PDF: **32 MB por requisição e 600 páginas**.
- Saída estruturada com `output_config.format` (`type: "json_schema"`) é suportada no Sonnet 5.5.

---

## 3. Achados novos (fora do Anexo A)

**A1. SP: cavalos e caminhões seguem outro calendário de licenciamento.**
Na coluna F de SP, as 50 carretas e bitrens seguem o calendário geral por final de placa:
- 1–2 → julho;
- 3–4 → agosto;
- 5–6 → setembro;
- 7–8 → outubro;
- 9 → novembro;
- 0 → dezembro.

Já os **13 desvios são justamente os 11 cavalos, o truck e o toco**:
- 1–2 → setembro;
- 3–4 → outubro;
- 5 a 8 → novembro;
- 9 → dezembro.

Isso bate com o calendário próprio de caminhões do DETRAN-SP. Por isso, `CALENDARIO_VENCIMENTOS.grupo_veiculo` precisa distinguir CAMINHAO de TODOS já em 2027 (o modelo já prevê isso). Os valores entram com a fonte oficial na Fase 3, não de memória.

**A2. Mais 5 veículos no bloco ex-Araquari sem a observação.**
As linhas 93–97 estão no bloco 81–128, em PR/0001-97, com datas típicas de SC (31/08/2024), mas sem "era Araquari":
- RLH0A26
- RLH0E56
- RLI4H26
- RLI7D86
- RLF7J46

Provavelmente também foram transferidos para a Matriz (pergunta N3).

**A3. Há um 7º CNPJ que não aparece na prévia: 77.505.550/0012-40 (SC).**
Ele aparece nas abas antigas IPVA e LICENCIAMENTO (no RDV8D31). Pode ser a filial de Araquari. Se for, entra em FILIAIS como inativa, para o histórico (pergunta N2).

**A4. "alugada" = 35 veículos no total**, já incluindo os 6 citados no anexo. Distribuição:
- 29 em SP/0002-78;
- 3 em PR/0001-97 (SEN1D04, SEN3G17, EAL8193);
- 2 em PR/39.247.088 (RHS1D66, JBB1F79);
- 1 em RO (NCK4696).

**A5. RLI4H26 (RENAVAM 127280801).**
As abas antigas trazem o mesmo número inválido. Se faltar um só dígito, há 10 combinações válidas, e 5 delas começam com 12728 como os vizinhos da série:
- 01272806801
- 01272808014
- 01272808081
- 01272808901
- 01272870801

Não dá para escolher sem o CRLV. Fica como pendência no Relatório de Saneamento.

**A6. RDV8D31 × RDV8D51.**
As duas abas antigas concordam entre si, e o contrário da prévia:
- RDV8D31 = 01227474323;
- RDV8D51 = 01227472029.

Os dois DVs são válidos. A confirmação tem que vir do CRLV (pergunta N4).

**A7. EAL8193 e BEK3H54.**
As abas antigas também têm a data 03/04/2023 no lugar do tipo, então não dá para inferir. O tipo precisa ser informado no saneamento.

**A8. NCK4696 (RO).**
As abas antigas têm só o RENAVAM e um nº MTO, sem tipo nem CNPJ. Continua como pendência 4 do Anexo A.

**A9. Sinais de que a automação antiga de multas está parada.**
- A planilha "Multas Frotas Alugadas" não é alterada desde **04/08/2026**.
- A pasta "[base claude] Multas Alugadas" foi alterada em **04/11/2026**. Arquivos novos podem ter entrado sem processamento.
- A planilha tem 104 linhas, mas o Dashboard ainda mostra 85 documentos (desatualizado).
- Na amostra lida, todas as linhas estão com "Informado ao Locatário = Pendente", "Pago = Não" e "🔴 Atrasado".
- Há várias **NICs (500-2) do DNIT** em veículos locados. Isso indica que os locatários não estão indicando condutor e o custo dobrado está caindo sobre a Gobor.
- O script vinculado à planilha não aparece na busca do Drive, então não consegui confirmar se o gatilho está ativo (pergunta N6).

**A10. Outras planilhas relacionadas encontradas no Drive:**
- "MULTAS MOTORISTAS" (da Regiane, atualizada em 06/11/2026): parece ser o controle atual de multas de motoristas e descontos. É candidata a migração na Fase 6 (pergunta N5).
- "Planilha Frota_Multas_Tacógrafos" (08/2025), "MULTAS 2023" e "MULTAS 2024": histórico.
- "Controle Boletos e Notas - Captura Gmail": a automação de contas a pagar citada em 2.3 do prompt.

---

## 4. Decisões técnicas (premissas que sigo se você não objetar)

| # | Decisão | Motivo |
|---|---|---|
| D-01 | Sheets + Apps Script (V8) + Web App (HtmlService) + Drive + Gmail + API do Claude | Padrão do prompt. Custo zero, controle de acesso pelo domínio gobor.com.br |
| D-02 | **JavaScript (ES2020) com JSDoc, sem TypeScript.** A lógica de negócio fica em `core/` (módulos ES puros), testada com `node --test` (sem dependências) e empacotada com **esbuild** num único arquivo para o Apps Script, que expõe o objeto global `Core` | Menos ferramentas para uma equipe pequena manter. Os mesmos módulos rodam no Node (testes) e no Apps Script |
| D-03 | `clasp` + git, com repositório **privado** no GitHub | Versionamento e reimplantação. Ver N1 |
| D-04 | Base nova "🚛 Frota Gobor — Base" e pastas novas, de preferência num **Drive compartilhado** | Os arquivos não ficam presos à conta de uma pessoa. Ver Q4 |
| D-05 | IDs estáveis: `V0001`, `M000001` (multa), `D…` (motorista), `L…` (locatário/locação). `obrigacao_id` composto (`2027-IPVA-V0001-U`). Nunca a posição da linha | Prompt §4 |
| D-06 | O esquema das abas fica declarado em código (`schema.js`): cria e valida abas, cabeçalhos, dropdowns e proteções. O acesso é sempre por **nome de cabeçalho** | Reordenar colunas não quebra nada. A Fase 1 já cria a base pronta |
| D-07 | Fuso `America/Sao_Paulo` no `appsscript.json`. Datas como Date, valores como número, exibição em pt-BR | Prompt §4 |
| D-08 | Web App com "Executar como: proprietário" e "Acesso: domínio". O perfil vem de `Session.getActiveUser()` × aba USUARIOS. A AUDITORIA registra o e-mail de quem usa, não o do proprietário | Prompt §10 |
| D-09 | **Integração com o Claude** (detalhes abaixo) | Documentação atual da API |
| D-10 | **Calendário provisório** (*precisa da sua aprovação*, N7): enquanto o calendário oficial 2027 de uma UF não sai, o assistente pode gerar as obrigações com vencimento **projetado a partir do calendário oficial 2026**, que carrego com a fonte citada. Essas linhas ficam marcadas `fonte = PROVISORIO` e com selo no painel. Quando o oficial for carregado, a regeneração (idempotente) corrige os vencimentos das obrigações não pagas | A SEFAZ-PR e outras costumam publicar o calendário de IPVA em dezembro, perto do prazo de 15/12. Não é dado "de memória": vem do calendário oficial do ano anterior e fica sinalizado |
| D-11 | O calendário diferencia `grupo_veiculo` (CAMINHAO, AUTOMOVEL, TODOS…) desde a carga | Achado A1 |
| D-12 | Estimativa de custo **nunca inventada**: sem regra ou sem valor venal, a obrigação entra em "Sem estimativa" | Prompt §5.4 |
| D-13 | Migração das multas antigas é literal: nada vira "informado", "pago" ou "reembolsado" sem evidência na planilha de origem | Achado A9 |
| D-14 | O modelo de dados já aceita `tributo = OUTRO` (tacógrafo, RNTRC, seguro, AET), sem telas específicas | Padrão da Q16 |
| D-15 | **Dados de motoristas numa planilha separada**, "🔒 Frota Gobor — Motoristas" (abas MOTORISTAS e DESCONTOS_FOLHA), compartilhada só com ADMIN/DP. O Web App lê essa planilha como proprietário e aplica o perfil (*precisa da sua aprovação*, N8) | A proteção de aba no Sheets **bloqueia edição, não leitura**, e aba oculta pode ser reexibida por qualquer pessoa com acesso. É a forma de cumprir a LGPD (§10 do prompt) sem servidor |
| D-16 | Carga inicial em Python 3.11 + openpyxl, rodando localmente ou neste ambiente | Prompt §3 |
| D-17 | Planilha antiga e planilha nova rodam em paralelo por 1–2 semanas, com pastas de entrada diferentes | Prompt §6.7 |

### D-09: chamada à API do Claude (o que muda em relação ao prompt)

1. **HTTP direto com `UrlFetchApp`**, porque o Apps Script não tem SDK oficial. A chave fica em `PropertiesService` (`ANTHROPIC_API_KEY`) e nunca é registrada em log.
2. **Modelo** guardado em CONFIG, com padrão `claude-sonnet-5-5`.
3. **Saída estruturada com `output_config.format` (`json_schema`)**, e não com `tool_choice` forçado. No Sonnet 5.5, `tool_choice` do tipo `any`/`tool` devolve **erro 400**.
   O esquema do Anexo B vai ser adaptado às regras do JSON Schema da API:
   - `additionalProperties: false` em todos os objetos;
   - campos anuláveis via `anyOf`/`null`;
   - sem `minimum`/`maximum`, por isso a faixa 0–1 de `confianca` é validada no código.
4. **Sem `temperature`/`top_p`**, que dão erro 400 nesse modelo. A profundidade do raciocínio é ajustada por `output_config.effort`, configurável no CONFIG. O padrão inicial é `low`, a calibrar com os PDFs de teste na Fase 5.
5. **Recusas e cortes**: `stop_reason = refusal` ou `max_tokens` → o documento vai para Revisão.
   Também ligo o *fallback* do lado do servidor (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`): se o modelo recusar, a API tenta outro modelo automaticamente. Dá para desligar no CONFIG.
6. **Limite de tamanho**: a API aceita 32 MB e 600 páginas. No Apps Script, o base64 aumenta o arquivo em cerca de 33% e o `UrlFetch` limita a carga a 50 MB. Arquivos acima de **20 MB** (valor em CONFIG) vão para Revisão.
7. **Cabeçalho** `anthropic-version: 2023-06-01`, o mesmo do script atual. A versão mais nova (`2026-10-21`) será avaliada na Fase 5.
8. **Custo estimado**: cerca de US$ 0,01 a 0,03 por documento de 1 a 3 páginas. Com algumas centenas de documentos por mês, dá poucos dólares. O valor real será medido e registrado por documento na Fase 5.
9. **Só o documento vai para a API**: nenhum dado da planilha é enviado.

---

## 5. Perguntas da seção 13 (com o padrão que adoto se você não souber)

Responda pelo número. Exemplo: "Q6: cota única para todos; Q9: segue lista…". Se não quiser responder alguma agora, vale o padrão.

| # | Pergunta | Padrão / recomendação | Trava a fase |
|---|---|---|---|
| Q1 | Confirma a arquitetura Sheets + Apps Script + Web App? | **Sim** | 1 |
| Q2 | Unificar as multas da frota inteira numa base só, migrando "Multas Frotas Alugadas"? | **Sim** | 5 |
| Q3 | Nomes das filiais por CNPJ. Quem é o CNPJ 39.247.088/0001-86 (dono de RHS1D66 e JBB1F79)? | Sem padrão. Uso "Filial PR-0001" etc. até você informar | 2 |
| Q4 | Drive: estrutura nova ou reaproveitar a de multas? Mesma chave da API das automações existentes? | Estrutura **nova**, num **Drive compartilhado** (se houver). **Chave nova e dedicada**: custo medido à parte e revogação independente da automação antiga | 1 e 5 |
| Q5 | Carretas e semirreboques pagam IPVA em PR, SP, SC e GO? | Pesquiso na legislação de cada UF na Fase 3 e registro em ALIQUOTAS_IPVA **com a fonte**, para você validar | 3 |
| Q6 | Forma padrão de pagamento do IPVA (cota única ou parcelado), por UF ou por tipo? | Sem padrão seguro. Sugestão: cota única onde o desconto for relevante; decisão sua | 3 |
| Q7 | De onde vêm os valores venais 2027? O financeiro exporta do ERP os pagos de 2026 por placa? | Até chegar a guia: projeção (venal 2026 × fator de depreciação em CONFIG, origem PROJECAO). Peço o CSV de pagos 2026 se existir | 3 |
| Q8 | Qual é o ERP e ele exporta lançamentos (MTO, valor, data)? | A fila "A lançar no ERP" funciona sem exportação. O importador só é feito se houver arquivo | 3 |
| Q9 | Cada contrato de locação: locatário, datas, quem paga IPVA, licenciamento e multas | Locatários vistos na planilha de multas: **MND LOGÍSTICA** e **EDSON LUIS RIBEIRO** (pode haver outros). Padrão: repassa multas = S; IPVA e licenciamento = N | 2 (locações) e 5 |
| Q10 | Quem decide indicar ou não indicar (pagar NIC)? Há política, por exemplo um limite de pontos? | Decisão pelo perfil ADMIN, com motivo obrigatório. Sem limite automático | 6 |
| Q11 | Sem indicação, a NIC é descontada do motorista ou a empresa assume? | **Empresa assume a NIC; motorista ressarce a multa original** | 6 |
| Q12 | Motoristas já assinaram termo de autorização de desconto? Há limite mensal na convenção coletiva? | Desconto bloqueado sem termo (CLT art. 462 §1º). Limite mensal vazio até o DP informar | 6 |
| Q13 | Dia de fechamento da folha, e-mail do DP e formato preferido? | Sem padrão. Sugestão: CSV + PDF por e-mail | 6 |
| Q14 | Como se descobre qual motorista estava com o veículo? Dá para exportar escala ou viagens? | Seleção manual com busca. Importador de escala só se houver exportação | 6 |
| Q15 | Quem usa o painel, com qual perfil, e quem recebe cada alerta? | **Você = ADMIN** e destinatário de todos os alertas, até a lista chegar | 1 (ADMIN) e 8 |
| Q16 | Incluir depois outros vencimentos (tacógrafo, RNTRC/ANTT, seguro, AET)? | Modelo preparado (`tributo = OUTRO`), sem telas por enquanto | — |

## 6. Perguntas novas (surgiram na descoberta)

| # | Pergunta | Padrão / recomendação | Trava a fase |
|---|---|---|---|
| **N1** | **Qual repositório GitHub uso?** Este ambiente é temporário: o que não for enviado a um repositório se perde quando a sessão termina. | Você cria um repositório **privado** vazio (ex.: `frota-gobor`) e eu o anexo à sessão | **1** |
| N2 | O CNPJ 77.505.550/0012-40 (SC), que aparece nas abas antigas, é a filial de Araquari? Está ativo? | Entra em FILIAIS como **inativo**, só para o histórico | 2 |
| N3 | RLH0A26, RLH0E56, RLI4H26, RLI7D86 e RLF7J46 também vieram de Araquari? | Tratar como transferidos (PR/0001-97, calendário PR em 2027) e marcar para conferência no saneamento | 2 |
| N4 | RDV8D31 e RDV8D51: qual RENAVAM é de qual? (ver A6) | Pendência no saneamento, a resolver pelo CRLV | 2 |
| N5 | A planilha "MULTAS MOTORISTAS" é o controle atual de multas de motoristas e descontos? Migrar na Fase 6? | Sim, migrar na Fase 6, depois de ver a estrutura com você | 6 |
| N6 | **A automação antiga de multas está ativa?** (ver A9) Se estiver parada, reativamos já ou processamos os PDFs pendentes manualmente até a Fase 5? | Conferir **esta semana**: abra a planilha, vá em Extensões → Apps Script → Acionadores e veja as "Execuções" recentes. Posso ajudar a diagnosticar | — (risco atual) |
| N7 | Aprova o **calendário provisório** (D-10)? | Sim | 3 |
| N8 | Aprova a **planilha separada para dados de motoristas** (D-15)? | Sim | 1 |

---

## 7. Prazo e riscos

**Cronograma proposto até o marco de 15/12/2026:**

| Fase | Janela | Depende de |
|---|---|---|
| 1. Fundação | 19/11 – 25/11 | N1, Q4, Q15 e você executar `clasp login` e autorizar os escopos (eu guio passo a passo) |
| 2. Carga inicial | 26/11 – 03/12 | Q3, N2–N4 e suas decisões no Relatório de Saneamento (idealmente devolvido em até 2 dias úteis) |
| 3. Exercício 2027 | 04/12 – 15/12 | Q5–Q7; publicação dos calendários e tabelas oficiais 2027 (D-10 reduz esse risco) |

**Riscos:**

1. **Calendários e alíquotas 2027** podem ser publicados tarde. Mitigação: D-10, mais um checklist de fontes oficiais por UF.
2. **Valores venais 2027** só chegam com as guias, entre dezembro e janeiro. Mitigação: projeção sinalizada e leitura de guias antecipada (Fase 7), se sobrar tempo.
3. **Respostas e decisões do saneamento** são o caminho crítico da Fase 2.
4. **Automação antiga parada** (A9 / N6): risco de prazos de multas perdidos **agora**.
5. **Ambiente temporário**: sem repositório (N1), o código se perde entre sessões.

---

## 8. O que faço logo depois da sua aprovação (Fase 1)

1. Estrutura do repositório (§11 do prompt), `appsscript.json` (V8, fuso, escopos mínimos) e `.clasp.json`.
2. Módulos `core` com testes, usando os casos reais do Anexo A:
   - placa e equivalência Mercosul;
   - RENAVAM (DV módulo 11);
   - CNPJ numérico e alfanumérico;
   - datas e moeda em pt-BR;
   - máquinas de estado e situação de prazo;
   - responsável por data;
   - deduplicação NA→NP.
3. `schema.js` com todas as tabelas da seção 4 e a rotina "Criar/validar base": abas, cabeçalhos congelados, dropdowns e proteções.
4. Camada de acesso por cabeçalho (leitura e escrita em bloco, LockService), mais AUDITORIA, LOG_EXECUCAO, CONFIG e USUARIOS.
5. Menu "🚛 Frota" (esqueleto) e Web App "olá + perfil", para validar implantação e permissões.
6. Runbook inicial com o passo a passo de `clasp login`, criação da base na sua conta e implantação.

**Critério de pronto da Fase 1:** testes passando e a base criada na sua conta.

---

## 9. Respostas recebidas em 18/11/2026

| # | Resposta | Efeito |
|---|---|---|
| N1 | Repositório `frota-gobor` criado (`rafagobor/frota-gobor`) | ⚠️ A conta do GitHub ligada às sessões do Claude ainda não tem permissão de escrita nele (ver "Pendências") |
| Q4 | Pastas num **Drive compartilhado**; **chave nova** da API | D-04 confirmada. A chave vai em Propriedades do Script na Fase 5 |
| Q15 | rafael@gobor.com.br é ADMIN por enquanto | O setup cadastra quem o roda como primeiro ADMIN |
| Q1, Q2, Q5–Q14, Q16, N5, N7, N8 | Sem objeção | Valem os padrões das seções 5 e 6. D-10 (calendário provisório) e D-15 (planilha restrita) aprovadas |

### FILIAIS (Q3 / N2)

| CNPJ | Nome curto | UF | Situação | Observação |
|---|---|---|---|---|
| 77.505.550/0001-97 | Matriz | PR | ativa | |
| 77.505.550/0002-78 | Guarulhos | SP | ativa | |
| 77.505.550/0003-59 | Porto Velho | RO | ativa | Provável CNPJ do NCK4696 (RO, sem CNPJ na prévia): sugestão no saneamento |
| 77.505.550/0008-63 | Cuiabá | MT | ativa | Sem veículos na prévia. MT entra nas tabelas de referência só se surgir veículo lá |
| 77.505.550/0009-44 | Campo Largo | PR | ativa | |
| 77.505.550/0012-40 | Araquari | SC | **encerrada** | Todas as placas passaram para a Matriz. Entra como inativa, para o histórico |
| 77.505.550/0014-01 | *(a informar)* | GO | ativa | 21 carretas na prévia |
| 77.505.550/0015-92 | Itajaí | SC | ativa | Os 25 veículos SC da prévia, inclusive o RDV8D51, que portanto **não** é ex-Araquari (Anexo A, item 5, resolvido) |
| 39.247.088/0001-86 | *(a informar)* | PR | — | Dono de RHS1D66 e JBB1F79 (alugadas) |

Todos os 9 CNPJs têm DV válido (testado em `core/tests/identificacao.test.js`).

**Consequência para N3:** como todas as placas de Araquari foram para a Matriz, os 5 veículos do bloco sem a observação (RLH0A26, RLH0E56, RLI4H26, RLI7D86, RLF7J46) já estão corretos em PR/0001-97. A observação "ex-Araquari" fica como conferência no saneamento: confirmar no CRLV que a transferência para o DETRAN-PR foi concluída.

### Pendências que continuam abertas

1. **Escrita no GitHub (N1).** O código da Fase 1 está pronto e com commit local, mas não consegui enviá-lo. A conta do GitHub conectada ao Claude não tem permissão de escrita em `rafagobor/frota-gobor`. Para resolver, escolha uma das opções:
   - instalar o app do Claude no GitHub na conta `rafagobor`, com acesso a esse repositório, em claude.ai/connect-github;
   - ou adicionar como colaboradora, com permissão de escrita, a conta do GitHub ligada ao Claude.
2. **Nome da filial 77.505.550/0014-01 (GO).**
3. **Quem é o CNPJ 39.247.088/0001-86.**
4. **N6:** a automação antiga de multas está ativa? (risco atual, seção 3, A9)
5. Itens que dependem do CRLV, tratados no Relatório de Saneamento (Fase 2): RLI4H26, RDV8D31/51, tipos de EAL8193/BEK3H54, dados do NCK4696.

---

## 10. Fase 1 (Fundação): entregue em 18/11/2026

| Item | Onde |
|---|---|
| Estrutura do repositório, `clasp` 3.4.1, manifesto (V8, fuso, escopos mínimos, Web App no domínio) | `apps-script/appsscript.json`, `.clasp.json.exemplo`, `package.json` |
| Núcleo com regras puras: placa/Mercosul, RENAVAM, CNPJ (inclusive alfanumérico)/CPF, datas e moeda pt-BR, status e prazo das obrigações, nº MTO, responsável por data, chave e mescla NA→NP, flags de multa, IDs, cadastro de veículos | `core/*.js` |
| Esquema de **todas** as tabelas do §4 (fonte única: setup, validação e documentação) | `core/schema.js` → `docs/modelo-dados.md` |
| Camada de acesso por cabeçalho (leitura/escrita em bloco, validação, colunas de controle, trava reentrante) | `apps-script/server/Db.js` |
| AUDITORIA (dados restritos auditados na planilha restrita), LOG_EXECUCAO, CONFIG (com cache), USUARIOS/perfis | `Auditoria.js`, `LogExec.js`, `Config.js`, `Auth.js` |
| Setup idempotente: abas, colunas, formatos (RENAVAM/CNPJ como texto), listas, proteções, planilha restrita, pastas | `Setup.js` |
| Menu "🚛 Frota" e painel com as 11 telas (esqueleto), perfil e status da base | `Menu.js`, `WebApp.js`, `Api.js`, `ui/` |
| 52 testes: 43 do núcleo + 9 de ponta a ponta do servidor num Google simulado | `core/tests/`, `tests/` |
| Runbook de implantação | `docs/runbook.md` |

**Ajuste no modelo de dados** em relação ao prompt (registrado aqui):
- MULTAS ganhou `data_expedicao_penalidade` (a `data_expedicao` da autuação é preservada para o alerta de expedição fora do prazo), `suspensao_cnh`, `chave_dedupe`, `placa_norm` e `obrigacao_licenciamento_id` (para a baixa via licenciamento, §5.7);
- CALENDARIO_VENCIMENTOS ganhou `provisorio` (D-10);
- a planilha restrita tem a própria `AUDITORIA_RESTRITA` (D-15).

**Critério de pronto:** testes passando ✅. Base criada na sua conta ⏳: siga `docs/runbook.md`, passos 0 a 7.
