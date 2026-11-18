# Runbook: implantação e operação

Passo a passo para colocar o sistema na conta Google da Gobor e mantê-lo atualizado.

---

## ⭐ Instalação sem terminal (recomendada)

Tudo pelo navegador. O sistema inteiro está num único arquivo, `dist/Frota.gs` (só caracteres ASCII), também disponível no Drive como o documento **"Frota.gs — copiar e colar no Apps Script"**, na pasta 🚛 Frota Gobor — Documentos.

1. **Copiar o código.** Abra o documento "Frota.gs — copiar e colar no Apps Script" e faça Ctrl+A e Ctrl+C.
2. **Colar na planilha.** Abra a planilha **🚛 Frota Gobor — Base** e vá em **Extensões → Apps Script**. No arquivo `Código.gs`, faça Ctrl+A e Ctrl+V. Salve (Ctrl+S).
3. **Recarregar a planilha.** Volte para a planilha e recarregue a página (F5). Em alguns segundos aparece o menu **🚛 Frota**.
4. **Criar a base.** Clique em **🚛 Frota → Admin → Criar/validar base**.
   - O Google pede autorização: Continuar → escolha sua conta → **Permitir**.
   - Se aparecer "o Google não verificou este app", clique em Avançado → Acessar (o app é seu, interno).
   - Depois de autorizar, clique de novo em Criar/validar base. A mensagem esperada é **"Base pronta"**.
5. **Importar.** Clique em **🚛 Frota → Admin → Importar CSVs da pasta 📤 Importação…**. Confira o resumo (212 veículos, 34 locatários, 85 locações, 9 filiais e as tabelas de 2027) e clique em **Sim**.
6. **Gerar o exercício.** Clique em **🚛 Frota → Gerar exercício…**, aperte Enter para 2027, confira e clique em **Sim**.

**Para atualizar para uma versão nova:** repita os passos 1 a 3 com o documento novo. Os dados da planilha não são afetados. Em seguida, rode Criar/validar base de novo.

O caminho com terminal (`clasp`), abaixo, fica para quem desenvolve.

---

## 0. Pré-requisitos (uma vez)

1. No seu computador: **Node.js 20 ou mais novo** e **git**.
2. Ative a API do Apps Script na sua conta Google: abra https://script.google.com/home/usersettings e ligue **"API do Google Apps Script"**.

## 1. Baixar o código

```bash
git clone https://github.com/rafagobor/frota-gobor.git
```

```bash
cd frota-gobor && npm ci
```

## 2. Criar a planilha base no Drive compartilhado

1. No Drive compartilhado da frota: **Novo → Planilhas Google**. Dê o nome **🚛 Frota Gobor — Base**.
2. Na planilha: **Extensões → Apps Script**. No editor que abrir, renomeie o projeto para **Frota Gobor**.
3. No editor: **⚙️ Configurações do projeto** → copie o **ID do script**.

## 3. Conectar o clasp

Faça login. O navegador abre: entre com **rafael@gobor.com.br** e autorize.

```bash
npx clasp login
```

O arquivo `.clasp.json` já vem no repositório apontando para o script da planilha base (ID `16sfO21GTyB9pCraFSYZq8Mj3RD7A1qppa-TrwAoSPKNFEudCMB4yRPLQ`). Não é preciso criar nada.

## 4. Enviar o código

O comando abaixo roda os testes, confere a sintaxe e envia tudo para o projeto do Apps Script:

```bash
npm run push
```

## 5. Criar a base

1. Recarregue a planilha. Em alguns segundos aparece o menu **🚛 Frota**.
2. Clique em **🚛 Frota → Admin → Criar/validar base**.
3. O Google pede autorização na primeira vez. Se aparecer "o Google não verificou este app", clique em **Avançado → Acessar Frota Gobor**: o app é seu, interno. Os acessos pedidos são:
   - **Planilhas**: ler e gravar a base e a planilha restrita de motoristas.
   - **Drive**: criar a estrutura de pastas e, a partir da Fase 5, ler os PDFs da pasta Entrada.
   - **Interface da planilha**: menu e caixas de diálogo.
   - **Seu e-mail**: identificar quem está usando, para aplicar o perfil.
4. Depois de autorizar, rode **Criar/validar base** de novo, caso a primeira tentativa tenha parado na autorização.
5. **Resultado esperado:**
   - 16 abas na planilha base;
   - a planilha **🔒 Frota Gobor — Motoristas** criada no seu Meu Drive;
   - a pasta **🚛 Frota Gobor — Documentos**, com as subpastas, criada ao lado da base no Drive compartilhado;
   - a pasta **🔒 Motoristas — documentos** criada no seu Meu Drive;
   - você cadastrado como ADMIN na aba USUARIOS.

   Se a mensagem for "Setup parcial", rode de novo: ele continua de onde parou.

## 6. Proteger os dados de motoristas

A planilha **🔒 Frota Gobor — Motoristas** e a pasta **🔒 Motoristas — documentos** ficam fora do Drive compartilhado de propósito (decisão D-15).

- Compartilhe-as **só** com quem for ADMIN ou DP.
- Se preferir, mova as duas para um Drive compartilhado restrito, que tenha só ADMIN e DP como membros. O ID não muda, então não é preciso reconfigurar nada.

## 7. Implantar o painel (Web App)

1. No editor do Apps Script: **Implantar → Nova implantação**.
2. Em ⚙️ **Selecionar tipo**, escolha **App da Web** e preencha:
   - Descrição: "Fase 1";
   - Executar como: **Eu (rafael@gobor.com.br)**;
   - Quem pode acessar: **Qualquer pessoa em gobor.com.br**.
3. Clique em **Implantar** e copie o URL (termina em `/exec`).
4. Na planilha, aba **CONFIG**: cole o URL no `valor` da chave **URL_WEBAPP**.
5. Teste com **🚛 Frota → Abrir painel**. Deve aparecer o seu e-mail com o perfil ADMIN, e a tela **⚙️ Admin** com as tabelas e as contagens.

## 8. Atualizar a cada fase

1. Baixe a versão nova e envie para o Apps Script:

   ```bash
   git pull && npm ci && npm run push
   ```

2. Na planilha: **🚛 Frota → Admin → Criar/validar base**. Ele acrescenta abas e colunas novas sem apagar nem reordenar nada.
3. Atualize o Web App sem mudar o URL: **Implantar → Gerenciar implantações → ✏️ → Versão: Nova versão → Implantar**.
   - Alternativa pelo terminal: descubra o ID da implantação.

     ```bash
     npx clasp list-deployments
     ```

   - Depois atualize a implantação com esse ID:

     ```bash
     npx clasp update-deployment ID_DA_IMPLANTACAO -d "Fase N"
     ```

## 8.1 Carga inicial (Fase 2)

1. **Relatório de Saneamento.** Gerado a partir da aba "previa 2027" e dos contratos do painel de locação:

   ```bash
   python3 scripts/carga_inicial/carga_previa.py relatorio
   ```

   Entradas: `dados/Controle_IPVA_LICENCIAMENTO_2026.xlsx` e `dados/painel_locacao/` (exportação do painel). Saída: `dados/carga/Relatorio_Saneamento.xlsx`.
2. **Decisões.** Na aba **Pendências**, preencha a coluna `decisao`. Toda linha **BLOQUEIA** precisa de decisão. Se quiser, ajuste as abas **Locatários** e **Locações**. As instruções estão na aba LEIA-ME.
3. **Aplicar.** Gera os CSVs finais em `dados/carga/importar/`, ou lista o que ainda falta decidir:

   ```bash
   python3 scripts/carga_inicial/carga_previa.py aplicar
   ```

4. **Importar na base.** Envie os 4 CSVs (FILIAIS, LOCATARIOS, VEICULOS, LOCACOES) para a pasta **📤 Importação** no Drive. Depois: **🚛 Frota → Admin → Importar CSVs da pasta 📤 Importação…**.
   - O sistema valida tudo e mostra um resumo.
   - Com qualquer erro, nada é gravado.
   - Se estiver tudo certo, você confirma e os arquivos são renomeados com "[importado AAAA-MM-DD]".
   - Repetir a importação não duplica nada.

Os testes do script rodam com:

```bash
python3 -m unittest discover -s scripts/carga_inicial
```

## 8.2 Exercício (Fase 3)

1. **Tabelas de referência.** Importe `referencias/2027/*.csv` pela pasta 📤 Importação: CALENDARIO_VENCIMENTOS, ALIQUOTAS_IPVA e TAXAS_LICENCIAMENTO. A situação de cada uma está em `referencias/2027/LEIA-ME.md`.
2. **Valores venais** (opcional): `VALORES_VENAIS.csv` com as colunas `placa`, `exercicio`, `valor_venal`, `origem` (GUIA, CSV_SEFAZ, MANUAL ou PROJECAO) e `fonte`.
3. **Gerar.** Use **🚛 Frota → Gerar exercício…** e informe o ano. O sistema mostra novas, atualizadas, canceladas, totais e pendências, e só grava depois da confirmação.
4. **Gerar de novo** quando as tabelas mudarem: completa o que falta, atualiza vencimentos e estimativas não pagas e nunca altera obrigação paga ou lançada.

## 9. Usuários e perfis

- Na aba **USUARIOS**, cada linha tem `email`, `perfil` (ADMIN, FINANCEIRO, DP ou CONSULTA) e `ativo` (S/N). A mudança vale em até 5 minutos (cache).
- Depois de incluir um novo **ADMIN**, rode **🚛 Frota → Admin → Reaplicar formatos e proteções**. Só assim ele passa a poder editar as colunas protegidas.
- **CONSULTA** não vê dados pessoais de motoristas. **DP** vê motoristas e folha.

## 10. Chave da API do Claude (Fase 5)

A chave fica **só** em Propriedades do Script, nunca na planilha nem no git:

1. Editor do Apps Script → **⚙️ Configurações do projeto → Propriedades do script → Adicionar**.
2. Nome `ANTHROPIC_API_KEY`; valor: a chave nova, dedicada a este projeto.

Para trocar a chave, edite o valor ali. Para revogá-la, use o console da Anthropic.

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| `clasp push`: "User has not enabled the Apps Script API" | Passo 0.2 e tente de novo depois de alguns minutos |
| O menu 🚛 Frota não aparece | Recarregue a planilha. Confira se o `scriptId` do `.clasp.json` é o do projeto **desta** planilha |
| "Aba X não encontrada" | 🚛 Frota → Admin → Criar/validar base |
| "Acesso negado: … não está cadastrado" | Inclua o e-mail na aba USUARIOS (perfil e ativo = S) |
| "Setup parcial" | Rode Criar/validar base de novo (continua de onde parou) |
| Alguém editou uma coluna calculada | Não é possível: elas são protegidas. Se a proteção sumiu, use Reaplicar formatos e proteções |
| Erro em uma rotina | Veja a aba **LOG_EXECUCAO** (status ERRO, com a mensagem) |
