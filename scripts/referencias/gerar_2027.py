#!/usr/bin/env python3
"""
Gera as tabelas de referência do exercício 2027 (CSV para o importador do Apps Script):
CALENDARIO_VENCIMENTOS, ALIQUOTAS_IPVA e TAXAS_LICENCIAMENTO.

Cada linha traz a fonte. Linhas projetadas do ano anterior (decisão D-10) saem com
provisorio = S. Itens sem confirmação ficam com "A CONFIRMAR" nas observações e, quando
o valor não é seguro, com o campo vazio: nada é inventado.

Uso: python3 scripts/referencias/gerar_2027.py   →  referencias/2027/*.csv
"""
from __future__ import annotations

import calendar
import csv
import datetime as dt
from pathlib import Path

EX = 2027
SAIDA = Path(__file__).resolve().parents[2] / "referencias" / str(EX)

# Dias sem expediente bancário em 2027 usados para empurrar datas projetadas
# (feriados nacionais: Leis 662/1949, 6.802/1980 e 14.759/2023; carnaval e Corpus Christi:
# calendário bancário).
FERIADOS_2027 = {dt.date(2027, m, d) for m, d in [(1, 1), (2, 8), (2, 9), (3, 26), (4, 21), (5, 1), (5, 27),
                                                  (9, 7), (10, 12), (11, 2), (11, 15), (11, 20), (12, 25)]}


def util(d: dt.date) -> bool:
    return d.weekday() < 5 and d not in FERIADOS_2027


def proximo_util(d: dt.date) -> dt.date:
    while not util(d):
        d += dt.timedelta(days=1)
    return d


def ultimo_util_do_mes(ano: int, mes: int) -> dt.date:
    d = dt.date(ano, mes, calendar.monthrange(ano, mes)[1])
    while not util(d):
        d -= dt.timedelta(days=1)
    return d


def projetar(dia: int, mes: int) -> str:
    """Mesmo dia/mês de 2026 em 2027, empurrado para o próximo dia útil."""
    return proximo_util(dt.date(EX, mes, dia)).isoformat()


FINAIS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]

# --------------------------------------------------------------------------------------
# Fontes
# --------------------------------------------------------------------------------------
F_PR_IPVA_2026 = ("Calendário IPVA 2026 da Sefa-PR (divulgado em 09/12/2025; 5 parcelas jan-mai; 6% à vista), "
                  "datas conferidas no controle de IPVA 2026 da Gobor. Projetado para 2027 (D-10). "
                  "https://www.fazenda.pr.gov.br")
F_SC_IPVA_2026 = ("Calendário IPVA 2026 SC (cota única no último dia do mês do final da placa; 3 parcelas no dia 10), "
                  "conferido no controle de IPVA 2026 da Gobor. Projetado para 2027 (D-10). https://www.sef.sc.gov.br")
F_SP_IPVA_2027 = ("Decreto SP 70.960, de 06/11/2026 (IPVA 2027), conforme divulgação da imprensa; texto oficial a conferir "
                  "(www.al.sp.gov.br não respondeu nesta sessão)")
F_PR_LIC_2026 = ("Calendário de licenciamento 2026 do Detran-PR (Portaria Detran-PR 907/2025), conferido na prévia 2027. "
                 "Projetado para 2027 (D-10). https://www.detran.pr.gov.br")
F_SP_LIC_2026 = ("Calendário de licenciamento 2026 do Detran-SP (mês por final; caminhões com calendário próprio), "
                 "meses conferidos na prévia 2027; dia = último dia útil do mês (a confirmar). Projetado (D-10). https://www.detran.sp.gov.br")
F_SC_LIC = ("Calendário de licenciamento do Detran-SC (último dia do mês por final), observado na prévia 2027 (ciclos 2024/2025); "
            "finais 2 e 5 inferidos. Projetado (D-10). https://www.detran.sc.gov.br")
F_GO_LIC = ("Calendário de licenciamento do Detran-GO (dia 15/09 e 15/10), observado na prévia 2027 para os finais 1, 4, 5, 7 e 9; "
            "demais finais inferidos. Projetado (D-10). https://www.detran.go.gov.br")
F_PR_LEI = ("Lei PR 14.260/2003, art. 4º (texto consolidado Sefa-PR; inciso II pela Lei 22.645/2025, efeitos a partir de 01/01/2026). "
            "https://www.sefanet.pr.gov.br/dados/sefadocumentos/12200314260.pdf")
F_CONTROLE = "Controle de IPVA 2026 da Gobor (nenhuma carreta/semirreboque no controle de IPVA)"


def calendario():
    linhas = []

    def add(uf, tributo, grupo, final, parcela, venc, fonte, desconto=None, prov="S", obs=""):
        linhas.append(dict(exercicio=EX, uf=uf, tributo=tributo, grupo_veiculo=grupo, final_placa=final, parcela=parcela,
                           vencimento=venc, desconto_pct="" if desconto is None else desconto, provisorio=prov, fonte=fonte,
                           observacoes=obs))

    # IPVA PR 2026 (por par de finais): cota única = 1ª parcela; parcelas jan..mai
    pr_dias = {("1", "2"): [(9, 1), (9, 2), (9, 3), (9, 4), (9, 5)],
               ("3", "4"): [(12, 1), (10, 2), (10, 3), (10, 4), (12, 5)],
               ("5", "6"): [(13, 1), (11, 2), (11, 3), (13, 4), (13, 5)],
               ("7", "8"): [(14, 1), (12, 2), (12, 3), (14, 4), (14, 5)],
               ("9", "0"): [(15, 1), (13, 2), (13, 3), (15, 4), (15, 5)]}
    for finais, datas in pr_dias.items():
        for f in finais:
            add("PR", "IPVA", "TODOS", f, "U", projetar(*datas[0]), F_PR_IPVA_2026, desconto=6,
                obs="Desconto de 6% é o de 2026; o de 2027 sai no calendário oficial")
            for i, (d, m) in enumerate(datas, start=1):
                add("PR", "IPVA", "TODOS", f, str(i), projetar(d, m), F_PR_IPVA_2026)

    # IPVA SC: final N → mês N (0 = outubro); cota única no último dia do mês; 3 parcelas no dia 10
    for f in FINAIS:
        mes = 10 if f == "0" else int(f)
        inferido = f in ("5", "6", "9", "0")
        obs = "Final inferido pelo padrão (não havia veículo com este final no controle de 2026)" if inferido else ""
        ultimo = calendar.monthrange(EX, mes)[1]
        add("SC", "IPVA", "TODOS", f, "U", proximo_util(dt.date(EX, mes, ultimo)).isoformat(), F_SC_IPVA_2026, obs=obs)
        for i in range(3):
            add("SC", "IPVA", "TODOS", f, str(i + 1), projetar(10, mes + i), F_SC_IPVA_2026, obs=obs)

    # IPVA SP 2027, caminhões e caminhões-tratores (Decreto 70.960/2026)
    obs_sp = ("Pagamento integral sem desconto até 22/04/2027; com 3% de desconto em janeiro, conforme o final da placa "
              "(datas por final a conferir no decreto). Parcelas sempre no dia 22, prorrogadas se não houver expediente bancário")
    add("SP", "IPVA", "CAMINHAO", "*", "U", "2027-04-22", F_SP_IPVA_2027, obs=obs_sp)
    for i, mes in enumerate([3, 5, 7, 8, 9], start=1):
        add("SP", "IPVA", "CAMINHAO", "*", str(i), dt.date(EX, mes, 22).isoformat(), F_SP_IPVA_2027, obs=obs_sp)

    # Licenciamento PR (Portaria 907/2025 → 2026)
    pr_lic = {"1": (14, 8), "2": (28, 8), "3": (9, 9), "4": (18, 9), "5": (28, 9), "6": (9, 10), "7": (20, 10), "8": (30, 10), "9": (13, 11), "0": (27, 11)}
    for f, (d, m) in pr_lic.items():
        add("PR", "LICENCIAMENTO", "TODOS", f, "U", projetar(d, m), F_PR_LIC_2026)

    # Licenciamento SP: demais veículos e caminhões
    sp_demais = {"1": 7, "2": 7, "3": 8, "4": 8, "5": 9, "6": 9, "7": 10, "8": 10, "9": 11, "0": 12}
    sp_caminhao = {"1": 9, "2": 9, "3": 10, "4": 10, "5": 11, "6": 11, "7": 11, "8": 11, "9": 12, "0": 12}
    for f in FINAIS:
        add("SP", "LICENCIAMENTO", "TODOS", f, "U", ultimo_util_do_mes(EX, sp_demais[f]).isoformat(), F_SP_LIC_2026)
        add("SP", "LICENCIAMENTO", "CAMINHAO", f, "U", ultimo_util_do_mes(EX, sp_caminhao[f]).isoformat(), F_SP_LIC_2026)

    # Licenciamento SC
    sc_lic = {"1": 4, "2": 4, "3": 5, "4": 6, "5": 7, "6": 8, "7": 9, "8": 10, "9": 11, "0": 12}
    for f in FINAIS:
        ultimo = calendar.monthrange(EX, sc_lic[f])[1]
        add("SC", "LICENCIAMENTO", "TODOS", f, "U", proximo_util(dt.date(EX, sc_lic[f], ultimo)).isoformat(), F_SC_LIC,
            obs="Final inferido" if f in ("2", "5") else "")

    # Licenciamento GO
    for f in FINAIS:
        mes = 9 if f in ("1", "2", "3") else 10
        add("GO", "LICENCIAMENTO", "TODOS", f, "U", projetar(15, mes), F_GO_LIC,
            obs="" if f in ("1", "4", "5", "7", "9") else "Final inferido")
    return linhas


def aliquotas():
    a = []

    def add(uf, tipo, tributado, aliquota, fonte, obs=""):
        a.append(dict(exercicio=EX, uf=uf, tipo_ou_categoria=tipo, tributado=tributado,
                      aliquota_pct="" if aliquota is None else aliquota, fonte=fonte, observacoes=obs))

    implementos_obs = ("A CONFIRMAR: o IPVA incide sobre veículos automotores e o controle de IPVA 2026 da Gobor não tem nenhuma "
                       "carreta/semirreboque. Se pagarem, troque para S e informe a alíquota")
    add("PR", "TRUCK", "S", 1, F_PR_LEI, "Art. 4º, I, a: caminhões")
    add("PR", "TOCO", "S", 1, F_PR_LEI, "Art. 4º, I, a: caminhões")
    add("PR", "CAVALO", "S", None, F_PR_LEI,
        "A CONFIRMAR: no CTB (art. 96) o caminhão-trator é da espécie TRAÇÃO, não carga; se não entrar em 'caminhões' (art. 4º, I, a: 1%), "
        "vale o inciso II (1,9%). Conferir numa guia de IPVA 2026 de um cavalo do PR")
    add("PR", "AUTOMOVEL", "S", 1.9, F_PR_LEI, "Art. 4º, II (Lei 22.645/2025)")
    add("PR", "VAN", "S", None, F_PR_LEI, "A CONFIRMAR: micro-ônibus/carga (1%) ou demais (1,9%), conforme o CRLV")
    add("PR", "UTILITARIO", "S", None, F_PR_LEI, "A CONFIRMAR: espécie carga (1%) ou demais (1,9%), conforme o CRLV")
    add("PR", "IMPLEMENTO", "N", None, F_CONTROLE, implementos_obs)
    for uf in ("SP", "SC", "GO"):
        add(uf, "IMPLEMENTO", "N", None, F_CONTROLE, implementos_obs)
    add("SP", "CAMINHAO", "S", None, "Lei SP 13.296/2008, art. 9º", "A CONFIRMAR: alíquota de caminhões/caminhões-tratores")
    add("SC", "CAMINHAO", "S", None, "Lei SC 7.543/1988", "A CONFIRMAR: alíquota de caminhões/caminhões-tratores")
    add("SC", "AUTOMOVEL", "S", None, "Lei SC 7.543/1988", "A CONFIRMAR: alíquota de automóveis")
    add("RO", "CAMINHAO", "S", None, "Lei RO 950/2000", "A CONFIRMAR: alíquota de caminhões; calendário de RO não carregado")
    return a


def taxas():
    t = []

    def add(uf, valor, fonte, obs=""):
        t.append(dict(exercicio=EX, uf=uf, grupo_veiculo="TODOS", valor=valor, fonte=fonte, observacoes=obs))

    add("PR", 94.61, "Taxa de licenciamento 2026 do Detran-PR (Agência Estadual de Notícias; igual a 2025)",
        "Provisório: valor de 2026 até a publicação de 2027")
    add("SP", 174.08, "Taxa de licenciamento 2026 do Detran-SP (imprensa)",
        "Provisório e A CONFIRMAR: algumas fontes citam R$ 167,74")
    add("SC", 149.37, "Taxa de licenciamento 2026 do Detran-SC (imprensa)",
        "Provisório e A CONFIRMAR: há projeto aprovado na Alesc extinguindo a taxa anual")
    return t


def escrever(nome, colunas, linhas):
    SAIDA.mkdir(parents=True, exist_ok=True)
    with (SAIDA / f"{nome}.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=colunas, quoting=csv.QUOTE_ALL, lineterminator="\n")
        w.writeheader()
        w.writerows(linhas)
    print(f"OK: {SAIDA / (nome + '.csv')} ({len(linhas)} linhas)")


if __name__ == "__main__":
    escrever("CALENDARIO_VENCIMENTOS", ["exercicio", "uf", "tributo", "grupo_veiculo", "final_placa", "parcela", "vencimento",
                                         "desconto_pct", "provisorio", "fonte", "observacoes"], calendario())
    escrever("ALIQUOTAS_IPVA", ["exercicio", "uf", "tipo_ou_categoria", "tributado", "aliquota_pct", "fonte", "observacoes"], aliquotas())
    escrever("TAXAS_LICENCIAMENTO", ["exercicio", "uf", "grupo_veiculo", "valor", "fonte", "observacoes"], taxas())
