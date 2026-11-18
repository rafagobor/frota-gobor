# Tabelas de referência: exercício 2027

Geradas por `python3 scripts/referencias/gerar_2027.py`. Cada linha tem `fonte`. Importe pela pasta **📤 Importação** (🚛 Frota → Admin → Importar CSVs…).

## Situação em 18/11/2026

| Tabela | UF | Situação |
|---|---|---|
| Calendário IPVA | PR | **Provisório:** 2026 projetado (o calendário 2027 da Sefa-PR sai em dezembro) |
| Calendário IPVA | SP (caminhões) | Decreto 70.960/2026, conforme a imprensa: cota única sem desconto em 22/04 e parcelas no dia 22 (mar, mai, jul, ago, set). Desconto de 3% em janeiro com datas por final **a conferir** no texto oficial |
| Calendário IPVA | SC | **Provisório:** 2026 projetado; finais 5, 6, 9 e 0 inferidos |
| Calendário IPVA | GO | Não carregado: só há carretas, consideradas não tributadas (a confirmar) |
| Calendário IPVA | RO | **Falta** (1 veículo: NCK4696) |
| Calendário licenciamento | PR, SP, SC, GO | **Provisório:** 2026 projetado (SP: dia = último dia útil, a confirmar; SC e GO: alguns finais inferidos) |
| Calendário licenciamento | RO | **Falta** |
| Alíquotas | PR | Truck/toco 1% e automóvel 1,9% (Lei 14.260/2003, art. 4º). **Cavalo, van e utilitária: a confirmar** |
| Alíquotas | SP, SC, RO | Tributação marcada; **alíquotas a confirmar** (só afetam a estimativa) |
| Tributação de carretas | todas | **A confirmar.** Marcadas como não tributadas: o controle de IPVA 2026 da Gobor não tem nenhuma carreta |
| Taxa de licenciamento | PR, SP, SC | Valores de 2026 como provisório (SP com divergência entre fontes; SC com projeto de extinção da taxa) |
| Taxa de licenciamento | GO, RO | **Falta:** fontes divergentes, nada foi inventado |

## Como atualizar quando sair o calendário oficial

1. Edite as linhas em `scripts/referencias/gerar_2027.py` (fonte oficial e `provisorio = N`).
2. Rode o script e importe os CSVs.
3. Rode **🚛 Frota → Gerar exercício…**: os vencimentos das obrigações ainda não pagas são atualizados e a marca de provisório sai.
