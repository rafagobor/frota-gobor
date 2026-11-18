# 🚛 Painel de Frota Gobor

Controle das obrigações documentais da frota (IPVA e licenciamento), dos custos que elas geram, das multas de trânsito e dos motoristas infratores. Tudo roda dentro do Google Workspace da Gobor: Google Sheets + Apps Script + Web App + Drive + API do Claude, sem servidor próprio e sem custo fixo.

## Instalação

Sem terminal: copie `dist/Frota.gs` (arquivo único, só ASCII) para o Apps Script da planilha. Passo a passo em [docs/runbook.md](docs/runbook.md#-instalação-sem-terminal-recomendada).

## Estrutura

```
apps-script/            raiz do clasp: o que vai para o Google
  appsscript.json       manifesto (fuso, escopos, Web App)
  server/               servidor Apps Script (00_core.js é gerado pelo build)
  ui/                   painel (HtmlService)
core/                   regras de negócio puras (rodam no Node e no Apps Script)
  tests/                testes com casos reais
tests/                  testes de ponta a ponta do servidor num Google simulado
scripts/                build, verificação de sintaxe, geração de docs
scripts/carga_inicial/  carga da aba "previa 2027" (Fase 2, Python)
prompts/                prompt e esquemas de extração de documentos (Fase 5)
docs/                   decisões, modelo de dados, runbook, manual
dados/                  arquivos reais da empresa (fora do git)
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm test` | Gera o bundle do núcleo e roda todos os testes |
| `npm run check` | Testes + verificação de sintaxe do Apps Script |
| `npm run push` | `check` + envia o código para o Apps Script (`clasp push`) |
| `npm run test:py` | Testes do script de carga inicial (Python) |
| `npm run docs:modelo` | Regenera `docs/modelo-dados.md` a partir de `core/schema.js` |

## Documentação

- [docs/decisoes.md](docs/decisoes.md): decisões de arquitetura e premissas (Fase 0)
- [docs/modelo-dados.md](docs/modelo-dados.md): todas as tabelas e colunas (gerado)
- [docs/runbook.md](docs/runbook.md): implantação, atualização e problemas comuns

## Regras do projeto

- A chave da API fica só em Propriedades do Script. Nunca no código, na planilha ou no git.
- Acesso a colunas sempre pelo nome do cabeçalho. Nunca reordenar nem apagar colunas em produção.
- Calendários, alíquotas e taxas vêm de tabelas alimentadas a partir de fontes oficiais, sempre com `fonte`. Nada escrito de memória no código.
- Dados pessoais de motoristas ficam só na planilha restrita (ADMIN/DP).
