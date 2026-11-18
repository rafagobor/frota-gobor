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
| N1 | Repositório `rafagobor/frota-gobor` | ✅ Conectado e com o código enviado em 18/11 (`main` e `fase-1-fundacao`) |
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
| 77.505.550/0014-01 | Goiânia | GO | ativa | 21 carretas na prévia |
| 77.505.550/0015-92 | Itajaí | SC | ativa | Os 25 veículos SC da prévia, inclusive o RDV8D51, que portanto **não** é ex-Araquari (Anexo A, item 5, resolvido) |
| 39.247.088/0001-86 | Gobor Seminovos | PR | ativa | Outra empresa do grupo. Dona de RHS1D66 e JBB1F79; é a locadora em 3 contratos do painel de locação |

Todos os 9 CNPJs têm DV válido (testado em `core/tests/identificacao.test.js`).

**Consequência para N3:** como todas as placas de Araquari foram para a Matriz, os 5 veículos do bloco sem a observação (RLH0A26, RLH0E56, RLI4H26, RLI7D86, RLF7J46) já estão corretos em PR/0001-97. A observação "ex-Araquari" fica como conferência no saneamento: confirmar no CRLV que a transferência para o DETRAN-PR foi concluída.

### Pendências que continuam abertas

1. ~~Escrita no GitHub (N1)~~: resolvido em 18/11.
2. ~~Nome da filial 77.505.550/0014-01~~: **Goiânia** (18/11).
3. ~~CNPJ 39.247.088/0001-86~~: **Gobor Seminovos** (18/11).
4. ~~N6~~: **resolvido** (18/11). A automação de multas está ativa: hoje é a tarefa agendada do Claude "Leitura de multas e contratos – Locação Gobor", que roda todo dia às 7h47 e grava no painel "Locação de Carretas Gobor". A planilha "Multas Frotas Alugadas" parou em agosto porque foi substituída por esse painel. O alerta A9 fica retirado. Ver seção 11.
5. Itens que dependem do CRLV, tratados no Relatório de Saneamento (Fase 2): RDV8D31/51, tipo de BEK3H54. RLI4H26, EAL8193 e NCK4696 foram esclarecidos pelo painel de locação (seção 11).

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

---

## 11. Descoberta: o painel "Locação de Carretas Gobor" (18/11/2026)

O protocolo de multas descrito no §2.2 do prompt (Apps Script + planilha) já evoluiu. Hoje ele funciona assim:
- **Tarefa agendada do Claude** "Leitura de multas e contratos – Locação Gobor": roda todo dia às 7h47 e lê duas pastas do Drive, a de multas ("[base claude] Multas Alugadas") e a de contratos.
- **Painel (artefato do Claude) com banco próprio**, com as coleções `contratos` (54), `implementos` (52), `locatarios` (34, todos com CNPJ/CPF), `multas`, `boletos` e `config`. As locadoras são Transportadora Gobor (51 contratos) e Gobor Seminovos (3).

**Cruzamento com a prévia (só leitura, nada foi alterado):**

| Achado | Efeito |
|---|---|
| RENAVAM: 51 de 52 implementos batem com a prévia | Confirma a qualidade das duas fontes |
| **RLI4H26**: o painel tem **01272808014** (DV válido) | É o candidato "faltou o último dígito" do achado A5. Pendência 1 do Anexo A resolvida, a confirmar no saneamento |
| EAL8193: "Caminhão baú" VW 8.150E Delivery 2008/2009 | Tipo sugerido: TOCO (confirmar) |
| NCK4696: "Caminhão baú" Ford Cargo 815 2003, locado | Tipo sugerido: TOCO; CNPJ sugerido: Porto Velho (RO, /0003-59) |
| Dos 35 "alugada" da prévia, 30 estão no painel. **EWU0879, FEF7011, FFD6062, FOQ7799 e FPY3304 não estão** | Conferir no saneamento: devolvidos? contratos antigos fora do painel? |
| **22 placas têm contrato no painel, mas não estão marcadas "alugada" na prévia** (ex.: ASX8D02, BAO2485/2486, BAO3786/3787, EWU2193/2194/2204, RLF7J46, RLH0A26, RLI4H26, TPP9C06…) | A coluna "alugada" da prévia está desatualizada. A situação LOCADO_TERCEIRO deve vir dos contratos vigentes |

**Proposta para a Fase 2 (N10, a confirmar):**
- LOCATARIOS e LOCACOES saem do painel de locação: locatário com CNPJ/CPF e, por placa, início e fim de cada contrato.
- A situação do veículo vem do contrato vigente em 18/11/2026.
- Assim você não precisa informar as datas das locações à mão, e a responsabilidade por multa na data da infração (§4.3) usa os mesmos contratos que o faturamento.

**Questão de arquitetura para decidir antes da Fase 5 (N9):** o painel de locação já cobre locatários, contratos, boletos e multas dos veículos locados. Recomendação:
- O painel de locação continua dono de **contratos, locatários e boletos**. A base da frota importa os contratos dele (um sentido só) e usa esses dados nos repasses e na responsabilidade por multas.
- **Multas:** a base da frota é a fonte única da frota inteira (Q2 = sim, como no prompt). A rotina diária passa a gravar também na base da frota, ou é substituída pela ingestão da Fase 5. Até lá, os dois sistemas rodam em paralelo, sem desligar nada do que funciona.

**Local da planilha base:** a "🚛 Frota Gobor — Base" (ID `1N4uITsqpREVmrBbDbJSmD9_QYBsQm8-olbXkYTi9mMk`) está na raiz do Meu Drive. A conta não mostra nenhum Drive compartilhado. Antes do setup, mova a planilha para a pasta onde a frota deve ficar, porque o setup cria a pasta de documentos ao lado dela.

---

## 12. Fase 2 (Carga inicial): em andamento desde 18/11/2026

**Decisões aprovadas em 18/11:**
- **N9**: o painel de locação continua dono de contratos, locatários e boletos. A base da frota importa os contratos dele e passa a ser a fonte única das multas da frota inteira. Os dois sistemas rodam em paralelo até a validação.
- **N10**: LOCATARIOS e LOCACOES saem do painel de locação. A situação do veículo vem do contrato vigente na data de referência.

**Novas decisões técnicas:**

| # | Decisão | Motivo |
|---|---|---|
| D-18 | O script de carga é em Python (como pede o prompt) e repete as regras de placa, RENAVAM e CNPJ do núcleo. **Quem decide é o importador do Apps Script**, que revalida tudo com o núcleo JS antes de gravar | A carga roda local, com openpyxl, mas a base só aceita o que passar no mesmo validador usado no resto do sistema |
| D-19 | Locações calculadas com a mesma regra do painel de locação. O fim de cada item é o primeiro entre: devolução, substituição, encerramento, véspera do próximo contrato da placa ou, sem renovação automática, o fim do contrato. A cessão de contrato divide a locação por locatário responsável | Responsabilidade por multa na data da infração (§4.3) coerente com o faturamento |
| D-20 | LOCATARIOS e LOCACOES ganharam a coluna `ref_painel` (id do locatário; contrato#item) | Permite sincronizar com o painel depois (N9) sem duplicar |
| D-21 | Importação por CSV da pasta "📤 Importação" é tudo ou nada, com confirmação e reimportação idempotente | Uma carga parcial deixaria a base inconsistente |
| D-22 | `.clasp.json` versionado (um único script, o da planilha base) | Simplifica o runbook |

**Relatório de Saneamento (dados reais, data de referência 18/11/2026):**
- 212 veículos, 34 locatários, 85 locações, 9 filiais.
- Pendências: **7 BLOQUEIA**, 49 CONFERIR e 14 INFO.

| BLOQUEIA (decisão obrigatória) | Sugestão |
|---|---|
| RLI4H26: DV do RENAVAM inválido | 01272808014 (painel de locação) |
| RDV8D31 / RDV8D51: RENAVAMs possivelmente trocados | Conferir no CRLV |
| EAL8193: sem tipo | TOCO (painel: caminhão baú VW 8.150E) |
| BEK3H54: sem tipo | (sem fonte: informar) |
| NCK4696: sem tipo e sem CNPJ | TOCO; 77.505.550/0003-59 (Porto Velho) |

**CONFERIR** (sem decisão, vale a sugestão):
- 21 placas com contrato no painel, mas sem "alugada" na prévia → LOCADO_TERCEIRO;
- 9 placas "alugada" sem contrato vigente → OPERACAO_PROPRIA. São elas:
  - EWJ9230 e EWU4057: o contrato 028/2025 terminou em 05/07/2026;
  - EWJ9801 e EWJ9802: o contrato 015/2025 terminou em 15/07/2026;
  - EWU0879, FEF7011, FFD6062, FOQ7799 e FPY3304: nunca estiveram no painel;
- 18 ex-Araquari: confirmar a transferência no CRLV;
- RHD0D44: SAVEIRO → UTILITARIO.

**Teste de integração (simulado, com os dados reais, fora do repositório):** a aplicação com decisões de exemplo gerou CSVs que o importador validou com 0 erro e 0 aviso. Foram 211 veículos (1 excluído na simulação), 85 locações e 34 locatários. A multa do DER-SP de 03/10/2025 da FFK8022 aponta para a MND Serviços, o mesmo locatário da planilha antiga.

**Decisões recebidas em 18/11 (aplicadas):**

| Placa | Decisão |
|---|---|
| RLI4H26 | Aceitar o RENAVAM do painel: 01272808014 |
| RDV8D31 / RDV8D51 | Manter os RENAVAMs da prévia |
| BEK3H54 | TOCO; VOLKSWAGEN DELIVERY 9.170; fabricação 2021 (ano de modelo a confirmar no CRLV); Matriz |
| NCK4696 | TOCO (Ford Cargo 815); Porto Velho (77.505.550/0003-59) |
| EAL8193 | TOCO, alugado (conforme o painel) |
| 9 "alugada" sem contrato vigente | **Continuam LOCADO_TERCEIRO**. Os contratos serão cadastrados no painel de locação. Até lá, multas dessas placas ficam sem locatário definido (aviso na carga) |
| Demais CONFERIR | Sugestão aceita por padrão |

**Resultado:**
- 212 veículos: 156 em operação própria e 56 locados;
- 34 locatários, 85 locações e 9 filiais;
- 0 erro; 9 avisos esperados (as placas sem contrato).

A validação no importador simulado também passou sem erros. CSVs em `dados/carga/importar/` (fora do git).

**Para registrar (fora do escopo deste projeto):** a tarefa diária do painel de locação já tem uma parte que lê contratos de uma pasta do Drive ("PARTE 2 – CONTRATOS"). O que falta para as 9 placas é colocar os contratos nessa pasta, ou ajustar a rotina para alguma variação de documento que ela não reconhece.

**Critério de pronto da Fase 2:** decisões ✅ (18/11). Importação na base ⏳: depende do setup na sua conta (runbook, passos 3 a 5 e 8.1).

---

## 13. Fase 3 (Exercício 2027): parte 1 entregue em 18/11/2026

**Decisões do usuário (18/11):**
- **Q6:** a forma de pagamento do IPVA será decidida em janeiro de 2027. Até lá, a geração usa **COTA_UNICA** (CONFIG `FORMA_PGTO_IPVA_PADRAO`).
  - No PR, a cota única e a 1ª parcela vencem no mesmo dia, então as datas de alerta não mudam.
  - Para trocar depois, basta mudar o padrão ou a forma do veículo e gerar de novo: as parcelas não pagas são refeitas.
- **Q7/Q8:** não há exportação do ERP. As estimativas de IPVA dependem de valores venais (VALORES_VENAIS, importável por placa) ou das guias. Por isso a leitura de guias (Fase 7) passa a ser a fonte principal.

**Novas decisões técnicas:**

| # | Decisão |
|---|---|
| D-23 | O motor de geração (`core/exercicio.js`) é guiado só pelas tabelas. Faltou regra, faltou estimativa: entra em **pendência** (SEM_ALIQUOTA, SEM_CALENDARIO, SEM_TAXA, SEM_VALOR_VENAL, CONFLITO). Sem regra de alíquota, não gera IPVA |
| D-24 | Idempotência: obrigação **travada** (paga, lançada no ERP, com guia, isenta, cancelada, bloqueada) nunca é alterada. As outras têm vencimento e estimativa recalculados. Parcelas que deixaram de existir são **canceladas**, ou viram CONFLITO se estiverem travadas. A observação "provisório" é a única que o sistema troca sozinho |
| D-25 | Implementos com `tributado = N` não geram IPVA (nenhuma linha), só licenciamento |
| D-26 | Responsável pelo pagamento: locatário quando há locação vigente no vencimento com repasse marcado (`repassa_ipva` / `repassa_licenciamento`); senão, a Gobor |
| D-27 | Tabelas de referência públicas versionadas em `referencias/AAAA/` e geradas por script. Feriados para projeção: nacionais e calendário bancário de 2027 |
| D-28 | Ambiente "frota-gobor" (pessoal) com acesso aos sites oficiais (SEFAZ, DETRAN e legislação de SP, PR, SC, GO e RO; Planalto e gov.br) e `npm ci` no setup |

**Prévia com a frota real (simulada, 18/11):**
- 295 obrigações: **83 de IPVA**, todas sem estimativa por falta de valor venal, e **212 de licenciamento**, estimadas em R$ 24.351,51 (22 sem taxa: GO e RO).
- 129 implementos não tributados (regra a confirmar).
- Pendências: 2 de calendário (RO).

**Perguntas abertas:**
1. **Carretas e semirreboques pagam IPVA** em alguma UF da frota? (hoje: não)
2. **Alíquota do cavalo no PR:** 1% ou 1,9%? Basta ver uma guia de IPVA 2026 de um cavalo do PR.
3. **GO e RO:** valor da taxa de licenciamento (um boleto de 2026 serve) e calendário de RO (NCK4696).

---

## 14. Instalação sem terminal (18/11/2026)

O usuário não usa terminal, então a instalação passou a ser só pelo navegador:

| # | Decisão |
|---|---|
| D-29 | **Arquivo único `dist/Frota.gs`**, gerado no build e versionado: núcleo, servidor e painel (o HTML numa constante). É colado uma vez no Apps Script da planilha. Não precisa de `appsscript.json`: o Apps Script detecta os escopos, e o fuso é explícito no código |
| D-30 | O arquivo é **100% ASCII**: o que não é ASCII vira `\\uXXXX`. Na primeira tentativa, a conversão para documento Google corrompeu os emojis. Há um teste que simula copiar e colar (recuo perdido, linhas em branco dobradas) |
| D-31 | Com autorização do usuário ("preciso que fique mais fácil"), o Claude criou no Drive, pelo conector, a pasta "🚛 Frota Gobor — Documentos", com "📤 Importação" e os 7 CSVs (carga e referências 2027), e o documento "Frota.gs — copiar e colar no Apps Script". O setup reaproveita essas pastas pelo nome. O primeiro documento, com os emojis corrompidos, foi para a lixeira |

---

## 15. Fase 3 (parte 2): telas de operação, entregue em 18/11/2026 (versão 0.3.0)

**O que foi entregue:**
- **Veículos:**
  - lista com filtros (placa em qualquer formato, UF, filial, tipo, situação e alertas) e selos de IPVA e licenciamento do exercício;
  - ficha com cadastro, obrigações e locações;
  - **novo veículo** com validação ao vivo (formato e equivalência Mercosul, DV do RENAVAM, duplicidade inclusive com vendidos, com "reativar?") e escolha do exercício corrente (gerar, já quitado ou deixar para depois);
  - edição, transferência de filial/UF (retrato antigo preservado) e venda/baixa (obrigações futuras não pagas passam a NAO_APLICA).
- **IPVA & Licenciamento:**
  - abas Todas, A lançar no ERP, Pagos sem lançamento, Vencidos, Bloqueados e Sem estimativa;
  - filtros e totais nas três camadas (estimado, devido e pago);
  - edição de cada obrigação: guia, MTO, pagamento (valor e data obrigatórios), encargos, CRLV, bloqueio com motivo, isenção e reabertura, com transições validadas;
  - **colagem em lote** (guias, MTO e pagamentos, direto do Excel/Sheets, com prévia linha a linha);
  - **exportação CSV**, com a fila do ERP no histórico padrão ("IPVA 2027 – cota única – BEU1D91").
- Toda alteração feita pelo painel é auditada (origem WEBAPP). O perfil CONSULTA só lê.

**Decisões técnicas:**

| # | Decisão |
|---|---|
| D-32 | Valor e data do pagamento só são aceitos juntos (regra do núcleo, vale para tela, lote e importação) |
| D-33 | Pagamento acima do valor da guia registra a diferença como `encargos` |
| D-34 | O painel embute um núcleo enxuto e minificado (`core/cliente.js`: placa, RENAVAM, moeda, datas) para validar no navegador com as mesmas regras do servidor |
| D-35 | O HTML do painel é servido pronto com `createHtmlOutput`, sem motor de template, e a versão é gravada no build |
| D-36 | "Abrir painel" usa `URL_WEBAPP` da CONFIG ou, se vazio, `ScriptApp.getService().getUrl()` |
