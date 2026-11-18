#!/usr/bin/env python3
"""
Carga inicial da frota (Fase 2).

Fontes:
  * aba "previa 2027" de dados/Controle_IPVA_LICENCIAMENTO_2026.xlsx (ÚNICA aba usada);
  * exportação do painel "Locação de Carretas Gobor" (contratos, implementos e
    locatários em JSON, um arquivo por documento), para locatários, locações e
    conferência de RENAVAM e tipo (decisão N10).

Uso:
  1) Gerar o Relatório de Saneamento:
       python3 scripts/carga_inicial/carga_previa.py relatorio
  2) Preencher a coluna "decisao" da aba Pendências (e, se quiser, ajustar as abas
     Locatários e Locações) e salvar.
  3) Aplicar as decisões e gerar os CSVs finais para o importador do Apps Script:
       python3 scripts/carga_inicial/carga_previa.py aplicar

Os arquivos de saída ficam em dados/carga/ (fora do git: têm dados da empresa).
"""
from __future__ import annotations

import argparse
import collections
import csv
import datetime as dt
import json
import re
import sys
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

ABA_PREVIA = "previa 2027"
RAIZ = Path(__file__).resolve().parents[2]
ENTRADA_PADRAO = RAIZ / "dados" / "Controle_IPVA_LICENCIAMENTO_2026.xlsx"
PAINEL_PADRAO = RAIZ / "dados" / "painel_locacao"
SAIDA_PADRAO = RAIZ / "dados" / "carga"
NOME_RELATORIO = "Relatorio_Saneamento.xlsx"

# --------------------------------------------------------------------------------------
# Dados de referência confirmados na Fase 0 (docs/decisoes.md, seção 9)
# --------------------------------------------------------------------------------------
FILIAIS = [
    # cnpj, nome_curto, uf, ativo, observacoes
    ("77.505.550/0001-97", "Matriz", "PR", "S", ""),
    ("77.505.550/0002-78", "Guarulhos", "SP", "S", ""),
    ("77.505.550/0003-59", "Porto Velho", "RO", "S", ""),
    ("77.505.550/0008-63", "Cuiabá", "MT", "S", ""),
    ("77.505.550/0009-44", "Campo Largo", "PR", "S", ""),
    ("77.505.550/0012-40", "Araquari", "SC", "N", "Filial encerrada; todas as placas passaram para a Matriz"),
    ("77.505.550/0014-01", "Goiânia", "GO", "S", ""),
    ("77.505.550/0015-92", "Itajaí", "SC", "S", ""),
    ("39.247.088/0001-86", "Gobor Seminovos", "PR", "S", "Outra empresa do grupo"),
]

TIPOS = ["CAVALO", "CARRETA", "BITREM", "TRUCK", "TOCO", "AUTOMOVEL", "VAN", "UTILITARIO", "CARRETINHA"]
SINONIMOS_TIPO = {"BI TREM": "BITREM", "BI-TREM": "BITREM", "CAVALO MECANICO": "CAVALO", "SEMIRREBOQUE": "CARRETA"}
MODELOS_NO_LUGAR_DO_TIPO = {"SAVEIRO": "UTILITARIO", "STRADA": "UTILITARIO", "MONTANA": "UTILITARIO"}
CATEGORIA = {"CAVALO": "TRACAO", "TRUCK": "TRACAO", "TOCO": "TRACAO", "CARRETA": "IMPLEMENTO", "BITREM": "IMPLEMENTO",
             "CARRETINHA": "IMPLEMENTO", "AUTOMOVEL": "LEVE", "VAN": "LEVE", "UTILITARIO": "LEVE"}

# Tipo do painel de locação → tipos compatíveis no cadastro (o primeiro é a sugestão).
TIPO_PAINEL = {
    "Caminhão baú": ["TOCO", "TRUCK"],
    "Bitrem": ["BITREM", "CARRETA"],
}
TIPOS_IMPLEMENTO = ["CARRETA", "BITREM", "CARRETINHA"]

# Conferências conhecidas antes da carga (Anexo A do prompt; abas antigas da planilha).
CONFERENCIAS_CONHECIDAS = {
    "RDV8D31": ("renavam", "01227474323", "As abas antigas (IPVA e LICENCIAMENTO) trazem os RENAVAMs de RDV8D31 e RDV8D51 trocados em relação à prévia; os dois DVs são válidos. Conferir no CRLV."),
    "RDV8D51": ("renavam", "01227472029", "As abas antigas (IPVA e LICENCIAMENTO) trazem os RENAVAMs de RDV8D31 e RDV8D51 trocados em relação à prévia; os dois DVs são válidos. Conferir no CRLV."),
}
OBS_ARAQUARI = "obs: era Araquari"
CNPJ_RO = "77.505.550/0003-59"

GRAVIDADES = ["BLOQUEIA", "CONFERIR", "INFO"]
DECISOES = ["ACEITAR", "CORRIGIR", "MANTER", "EXCLUIR"]

# --------------------------------------------------------------------------------------
# Regras de identificação (mesmas de core/placa.js, core/renavam.js, core/documentos-fiscais.js)
# --------------------------------------------------------------------------------------
LETRAS = "ABCDEFGHIJ"


def limpar_placa(v) -> str:
    return re.sub(r"[^A-Z0-9]", "", str(v or "").upper())


def formato_placa(v):
    p = limpar_placa(v)
    if re.fullmatch(r"[A-Z]{3}\d{4}", p):
        return "ANTIGO"
    if re.fullmatch(r"[A-Z]{3}\d[A-Z]\d{2}", p):
        return "MERCOSUL"
    return None


def normalizar_placa(v):
    p = limpar_placa(v)
    f = formato_placa(p)
    if not f:
        return None
    if f == "MERCOSUL" and p[4] in LETRAS:
        return p[:4] + str(LETRAS.index(p[4])) + p[5:]
    return p


def normalizar_renavam(v):
    if v is None or v == "":
        return None
    if isinstance(v, float):
        if not v.is_integer():
            return None
        v = int(v)
    s = re.sub(r"\D", "", re.sub(r"\.0+$", "", str(v).strip()))
    if not s or len(s) > 11:
        return None
    return s.zfill(11)


def renavam_valido(v) -> bool:
    r = normalizar_renavam(v)
    if not r or set(r) == {"0"}:
        return False
    pesos = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3]
    soma = sum(int(d) * pesos[i] for i, d in enumerate(r[:10][::-1]))
    dv = (soma * 10) % 11
    return (0 if dv == 10 else dv) == int(r[10])


def limpar_cnpj(v) -> str:
    return re.sub(r"[^0-9A-Z]", "", str(v or "").upper())


def cnpj_valido(v) -> bool:
    c = limpar_cnpj(v)
    if not re.fullmatch(r"[0-9A-Z]{12}\d{2}", c) or re.fullmatch(r"(\d)\1{13}", c):
        return False

    def dv(base, pesos):
        r = sum((ord(ch) - 48) * p for ch, p in zip(base, pesos)) % 11
        return 0 if r < 2 else 11 - r

    d1 = dv(c[:12], [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    d2 = dv(c[:12] + str(d1), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    return c[12:] == f"{d1}{d2}"


def formatar_cnpj(v) -> str:
    c = limpar_cnpj(v)
    return f"{c[:2]}.{c[2:5]}.{c[5:8]}/{c[8:12]}-{c[12:]}" if len(c) == 14 else str(v or "")


def cpf_valido(v) -> bool:
    c = re.sub(r"\D", "", str(v or "")).zfill(11)
    if len(c) != 11 or len(set(c)) == 1:
        return False
    for n in (9, 10):
        r = (sum(int(c[i]) * (n + 1 - i) for i in range(n)) * 10) % 11
        if (0 if r == 10 else r) != int(c[n]):
            return False
    return True


def documento_valido(v) -> bool:
    c = limpar_cnpj(v)
    if len(c) == 14:
        return cnpj_valido(c)
    return bool(re.fullmatch(r"\d{11}", c)) and cpf_valido(c)


def formatar_documento(v) -> str:
    c = limpar_cnpj(v)
    if len(c) == 14:
        return formatar_cnpj(c)
    if re.fullmatch(r"\d{11}", c):
        return f"{c[:3]}.{c[3:6]}.{c[6:9]}-{c[9:]}"
    return str(v or "")


def normalizar_tipo(valor):
    """(tipo | None, precisa_confirmar, motivo)"""
    if valor is None or isinstance(valor, (dt.date, dt.datetime, int, float)):
        motivo = "Tipo vazio" if valor in (None, "") else f"Valor não é um tipo: {valor}"
        return None, True, motivo
    s = re.sub(r"\s+", " ", str(valor).upper()).strip()
    if not s:
        return None, True, "Tipo vazio"
    if s in TIPOS:
        return s, False, None if s == str(valor) else f'Grafia "{valor}" padronizada'
    if s in SINONIMOS_TIPO:
        return SINONIMOS_TIPO[s], False, f'Grafia "{valor}" padronizada'
    if s in MODELOS_NO_LUGAR_DO_TIPO:
        return MODELOS_NO_LUGAR_DO_TIPO[s], True, f'"{valor}" é modelo, não tipo'
    return None, True, f'Tipo desconhecido: "{valor}"'


def marca_modelo(im):
    """Marca + modelo do painel, sem repetir a marca quando o modelo já começa com ela."""
    if not im:
        return None
    marca, modelo = (im.get("marca") or "").strip(), (im.get("modelo") or "").strip()
    if marca and modelo.upper().startswith(marca.upper()):
        return modelo
    return " ".join(x for x in [marca, modelo] if x) or None


def iso(d):
    if isinstance(d, dt.datetime):
        d = d.date()
    return d.isoformat() if isinstance(d, dt.date) else (d or None)


def menos_um_dia(s: str) -> str:
    return (dt.date.fromisoformat(s) - dt.timedelta(days=1)).isoformat()


# --------------------------------------------------------------------------------------
# Leitura
# --------------------------------------------------------------------------------------
def ler_previa(caminho: Path):
    wb = openpyxl.load_workbook(caminho, data_only=True)
    if ABA_PREVIA not in wb.sheetnames:
        raise SystemExit(f'Aba "{ABA_PREVIA}" não encontrada em {caminho}')
    ws = wb[ABA_PREVIA]
    linhas = []
    for n, r in enumerate(ws.iter_rows(min_row=2, max_col=7, values_only=True), start=2):
        if all(v in (None, "") for v in r):
            continue
        placa, renavam, cnpj, uf, tipo, venc, obs = r
        linhas.append({"linha": n, "placa": str(placa or "").strip(), "renavam_bruto": renavam, "cnpj": cnpj,
                       "uf": str(uf or "").strip().upper(), "tipo_bruto": tipo, "vencimento": venc,
                       "obs": str(obs or "").strip()})
    return linhas


def ler_colecao(pasta: Path, nome: str):
    docs = []
    for f in sorted((pasta / nome).glob("*.json")):
        d = json.loads(f.read_text(encoding="utf-8"))
        docs.append(d.get("data", d) if isinstance(d, dict) and set(d) <= {"id", "version", "data"} else d)
    return docs


def ler_painel(pasta: Path | None):
    if not pasta or not pasta.exists():
        return {"contratos": [], "implementos": [], "locatarios": []}
    return {c: ler_colecao(pasta, c) for c in ("contratos", "implementos", "locatarios")}


# --------------------------------------------------------------------------------------
# Locações a partir dos contratos (mesma regra do painel de locação)
# --------------------------------------------------------------------------------------
def periodos_por_placa(contratos, data_ref: str):
    """
    Para cada item de contrato: início = item.desde ou início do contrato; fim = o
    primeiro entre devolução, substituição (item.ate), encerramento, véspera do próximo
    contrato da mesma placa e, sem renovação automática, o fim do contrato. Sem nenhum
    desses, a locação segue vigente (fim vazio). "pendente" = venceu sem renovação, sem
    devolução e sem novo contrato.
    """
    itens = []
    for c in contratos:
        for idx, it in enumerate(c.get("itens") or []):
            p = normalizar_placa(it.get("placa"))
            if p:
                itens.append({"c": c, "it": it, "idx": idx, "placa": p, "ini": it.get("desde") or c.get("inicio")})
    por_placa = collections.defaultdict(list)
    for i in itens:
        por_placa[i["placa"]].append(i)
    for lista in por_placa.values():
        lista.sort(key=lambda i: (i["ini"] or "", i["c"].get("inicio") or ""))
        for n, i in enumerate(lista):
            suc = next((j for j in lista[n + 1:] if j["ini"] > i["ini"]), None)
            cand = []
            if (i["it"].get("devolucao") or {}).get("data"):
                cand.append((i["it"]["devolucao"]["data"], "devolucao"))
            if i["it"].get("ate"):
                cand.append((i["it"]["ate"], "substituicao"))
            if (i["c"].get("encerramento") or {}).get("data"):
                cand.append((i["c"]["encerramento"]["data"], "encerramento"))
            if suc:
                cand.append((menos_um_dia(suc["ini"]), "sucessor"))
            if not i["c"].get("renovacaoAuto"):
                cand.append((i["c"].get("fim"), "natural"))
            cand = sorted(x for x in cand if x[0])
            i["fim"], i["motivo_fim"] = (cand[0] if cand else (None, None))
            i["pendente"] = i["motivo_fim"] == "natural" and i["fim"] < data_ref and not suc
    return por_placa


def segmentos_locatario(i):
    """Divide o período pelo locatário responsável (cessão de contrato)."""
    c = i["c"]
    ces = c.get("cessao")
    if ces and ces.get("ate") and ces.get("locatarioId") and i["ini"] <= ces["ate"]:
        fim_ces = ces["ate"] if not i["fim"] or ces["ate"] < i["fim"] else i["fim"]
        segs = [(i["ini"], fim_ces, ces["locatarioId"], "cessão do contrato")]
        if not i["fim"] or fim_ces < i["fim"]:
            segs.append(((dt.date.fromisoformat(fim_ces) + dt.timedelta(days=1)).isoformat(), i["fim"], c.get("locatarioId"), ""))
        return segs
    return [(i["ini"], i["fim"], c.get("locatarioId"), "")]


def vigente_em(ini, fim, data):
    return ini and ini <= data and (not fim or data <= fim)


# --------------------------------------------------------------------------------------
# Montagem da proposta
# --------------------------------------------------------------------------------------
class Proposta:
    def __init__(self):
        self.veiculos = []
        self.pendencias = []
        self.locatarios = []
        self.locacoes = []
        self.filiais = [dict(cnpj=c, nome_curto=n, uf=u, ativo=a, observacoes=o) for c, n, u, a, o in FILIAIS]
        self.info = collections.OrderedDict()

    def pendencia(self, v, gravidade, campo, problema, valor_atual, sugestao, fonte, codigo):
        self.pendencias.append({
            "chave": f"{v['placa']}|{campo}|{codigo}", "gravidade": gravidade, "placa": v["placa"],
            "linha_previa": v["_linha"], "veiculo_id": v["veiculo_id"], "campo": campo, "problema": problema,
            "valor_atual": "" if valor_atual is None else str(valor_atual),
            "sugestao": "" if sugestao is None else str(sugestao), "fonte_sugestao": fonte,
        })


def montar(previa, painel, data_ref: str) -> Proposta:
    P = Proposta()
    impl = {normalizar_placa(i.get("placa")): i for i in painel["implementos"] if normalizar_placa(i.get("placa"))}
    periodos = periodos_por_placa(painel["contratos"], data_ref)
    contratos_por_id = {c.get("id"): c for c in painel["contratos"]}

    # ---- veículos
    vistos_renavam, vistos_placa = {}, {}
    for n, r in enumerate(previa, start=1):
        placa = limpar_placa(r["placa"])
        pn = normalizar_placa(placa)
        v = {"veiculo_id": f"V{n:04d}", "_linha": r["linha"], "placa": placa, "placa_norm": pn}
        ren = normalizar_renavam(r["renavam_bruto"])
        tipo, confirmar_tipo, motivo_tipo = normalizar_tipo(r["tipo_bruto"])
        cnpj = formatar_cnpj(r["cnpj"]) if r["cnpj"] else None
        im = impl.get(pn)
        lista = periodos.get(pn, [])
        vig = [i for i in lista if vigente_em(i["ini"], i["fim"], data_ref)]
        pend = [i for i in lista if i["pendente"]]
        v.update({
            "renavam": ren, "chassi": (im or {}).get("chassi") or None, "tipo": tipo, "categoria": CATEGORIA.get(tipo),
            "marca_modelo": marca_modelo(im),
            "ano_fabricacao": None, "ano_modelo": None, "cnpj_proprietario": cnpj, "uf_registro": r["uf"] or None,
            "municipio_registro": None, "situacao": "OPERACAO_PROPRIA", "data_aquisicao": None, "data_venda": None,
            "isento_ipva": None, "motivo_isencao": None, "forma_pgto_ipva_padrao": None, "pasta_drive_id": None,
            "observacoes": None,
            "_obs_previa": r["obs"], "_venc_previa": iso(r["vencimento"]) if not isinstance(r["vencimento"], str) else r["vencimento"],
            "_tipo_previa": r["tipo_bruto"], "_painel_tipo": (im or {}).get("tipo"),
        })
        anos = re.findall(r"\d{4}", str((im or {}).get("ano") or ""))
        if anos:
            v["ano_fabricacao"] = int(anos[0])
            v["ano_modelo"] = int(anos[1] if len(anos) > 1 else anos[0])

        if not pn:
            P.pendencia(v, "BLOQUEIA", "placa", "Placa em formato inválido", placa, None, "", "formato")

        # RENAVAM
        if not ren:
            P.pendencia(v, "BLOQUEIA", "renavam", "RENAVAM vazio ou com mais de 11 dígitos", r["renavam_bruto"], None, "", "vazio")
        elif not renavam_valido(ren):
            sug = normalizar_renavam((im or {}).get("renavam"))
            if sug and renavam_valido(sug):
                P.pendencia(v, "BLOQUEIA", "renavam", "Dígito verificador inválido na prévia; o painel de locação tem um RENAVAM válido",
                            ren, sug, "Painel de locação (implemento / Anexo I do contrato)", "dv")
            else:
                P.pendencia(v, "BLOQUEIA", "renavam", "Dígito verificador inválido; conferir no CRLV", ren, None, "", "dv")
        elif im and normalizar_renavam(im.get("renavam")) and normalizar_renavam(im.get("renavam")) != ren:
            P.pendencia(v, "BLOQUEIA", "renavam", "RENAVAM diferente do painel de locação", ren,
                        normalizar_renavam(im.get("renavam")), "Painel de locação", "divergente")
        if placa in CONFERENCIAS_CONHECIDAS:
            campo, sug, texto = CONFERENCIAS_CONHECIDAS[placa]
            P.pendencia(v, "BLOQUEIA", campo, texto, ren, sug, "Anexo A / abas antigas da planilha", "conhecida")

        # Tipo
        sug_painel = TIPO_PAINEL.get((im or {}).get("tipo"))
        if tipo is None:
            sug = sug_painel[0] if sug_painel else None
            P.pendencia(v, "BLOQUEIA", "tipo", motivo_tipo + ("" if not im else f'; o painel de locação diz "{im.get("tipo")}" ({im.get("marca", "")} {im.get("modelo", "")})'.rstrip()),
                        r["tipo_bruto"], sug, "Painel de locação" if sug else "", "vazio")
        else:
            if confirmar_tipo:
                P.pendencia(v, "CONFERIR", "tipo", motivo_tipo, r["tipo_bruto"], tipo, "Regra de padronização", "modelo")
            elif motivo_tipo:
                P.pendencia(v, "INFO", "tipo", motivo_tipo, r["tipo_bruto"], tipo, "Regra de padronização", "grafia")
            if im and im.get("tipo"):
                compat = sug_painel or TIPOS_IMPLEMENTO
                if tipo not in compat:
                    P.pendencia(v, "CONFERIR", "tipo", f'Tipo divergente: o painel de locação diz "{im["tipo"]}"', tipo,
                                compat[0], "Painel de locação", "divergente")
                elif im["tipo"] == "Bitrem" and tipo != "BITREM":
                    P.pendencia(v, "INFO", "tipo", 'O painel de locação classifica como "Bitrem" (composição); na base, cada placa é um semirreboque',
                                tipo, tipo, "Painel de locação", "bitrem")
        v["categoria"] = CATEGORIA.get(v["tipo"])

        # CNPJ / filial
        if not cnpj:
            sug = CNPJ_RO if r["uf"] == "RO" else None
            P.pendencia(v, "BLOQUEIA", "cnpj_proprietario", "Sem CNPJ na prévia" + (" (veículo de RO: sugerida a filial Porto Velho)" if sug else ""),
                        None, sug, "UF do veículo" if sug else "", "vazio")
        elif not cnpj_valido(cnpj):
            P.pendencia(v, "BLOQUEIA", "cnpj_proprietario", "CNPJ inválido", cnpj, None, "", "invalido")
        elif cnpj not in {f[0] for f in FILIAIS}:
            P.pendencia(v, "BLOQUEIA", "cnpj_proprietario", "CNPJ não está na lista de filiais", cnpj, None, "", "desconhecido")

        # Situação e locação
        alugada = r["obs"].lower() == "alugada"
        if vig or pend:
            v["situacao"] = "LOCADO_TERCEIRO"
            if pend and not vig:
                i = pend[-1]
                P.pendencia(v, "CONFERIR", "situacao", f'Contrato {i["c"].get("numero")} venceu em {i["fim"]} sem renovação nem devolução registrada no painel de locação',
                            "LOCADO_TERCEIRO", "LOCADO_TERCEIRO", "Painel de locação", "contrato_vencido")
            if not alugada:
                i = (vig or pend)[-1]
                P.pendencia(v, "CONFERIR", "situacao", f'A prévia não marca "alugada", mas há contrato no painel ({i["c"].get("numero")}, desde {i["ini"]})',
                            "OPERACAO_PROPRIA", "LOCADO_TERCEIRO", "Painel de locação", "previa_desatualizada")
        elif alugada:
            ult = lista[-1] if lista else None
            texto = "Marcada \"alugada\" na prévia, mas sem contrato vigente no painel de locação"
            texto += f' (último contrato {ult["c"].get("numero")}, até {ult["fim"]})' if ult else " (nenhum contrato no painel)"
            texto += ". MANTER = continua locado (cadastre o contrato no painel de locação ou na aba Locações); ACEITAR = volta para operação própria"
            v["situacao"] = "LOCADO_TERCEIRO"
            P.pendencia(v, "CONFERIR", "situacao", texto, "LOCADO_TERCEIRO", "OPERACAO_PROPRIA", "Painel de locação", "sem_contrato")

        # Observações da prévia
        obs = []
        if r["obs"].startswith(OBS_ARAQUARI):
            obs.append("Ex-Araquari (SC, 77.505.550/0012-40): transferido para a Matriz em 2026")
            P.pendencia(v, "CONFERIR", "observacoes", "Ex-Araquari: confirmar no CRLV que a transferência para o DETRAN-PR foi concluída",
                        r["obs"], obs[0], "Prévia", "araquari")
        elif r["obs"] and not alugada:
            obs.append(r["obs"])
        v["observacoes"] = "; ".join(obs) or None

        # Unicidade
        if ren and ren in vistos_renavam:
            P.pendencia(v, "BLOQUEIA", "renavam", f"RENAVAM repetido (também em {vistos_renavam[ren]})", ren, None, "", "duplicado")
        if pn and pn in vistos_placa:
            P.pendencia(v, "BLOQUEIA", "placa", f"Placa equivalente a {vistos_placa[pn]}", placa, None, "", "duplicada")
        vistos_renavam.setdefault(ren, placa)
        vistos_placa.setdefault(pn, placa)
        P.veiculos.append(v)

    # ---- locatários (só os que têm contrato com placas da prévia)
    por_placa_v = {v["placa_norm"]: v for v in P.veiculos if v["placa_norm"]}
    usados = []
    for pn, lista in periodos.items():
        if pn not in por_placa_v:
            continue
        for i in lista:
            for seg in segmentos_locatario(i):
                if seg[2] and seg[2] not in usados:
                    usados.append(seg[2])
    loc_painel = {l.get("id"): l for l in painel["locatarios"]}
    ids_loc = {}
    for n, lid in enumerate(sorted(usados, key=lambda x: (loc_painel.get(x, {}).get("nome") or x).upper()), start=1):
        l = loc_painel.get(lid, {})
        ids_loc[lid] = f"LT{n:04d}"
        doc = formatar_documento(l.get("doc"))
        cidade = " / ".join(x for x in [l.get("cidade"), l.get("uf")] if x)
        P.locatarios.append({
            "locatario_id": ids_loc[lid], "nome": l.get("nome") or lid, "cnpj_cpf": doc or None,
            "contato": l.get("contato") or None, "email": l.get("email") or None, "telefone": l.get("telefone") or None,
            "ativo": "S", "observacoes": "; ".join(x for x in [l.get("apelido"), cidade] if x) or None, "ref_painel": lid,
            "_doc_ok": documento_valido(doc) if doc else False,
        })

    # ---- locações
    n = 0
    for pn, lista in sorted(periodos.items()):
        v = por_placa_v.get(pn)
        if not v:
            continue
        for i in lista:
            for ini, fim, lid, nota in segmentos_locatario(i):
                n += 1
                c = i["c"]
                obs = [c.get("locadora") or "", "renovação automática" if c.get("renovacaoAuto") else "sem renovação automática"]
                if nota:
                    obs.append(nota)
                if i["pendente"]:
                    obs.append("venceu sem renovação nem devolução registrada")
                P.locacoes.append({
                    "locacao_id": f"LC{n:05d}", "veiculo_id": v["veiculo_id"], "placa": v["placa"],
                    "locatario_id": ids_loc.get(lid, ""), "locatario_nome": loc_painel.get(lid, {}).get("nome", lid),
                    "inicio": ini, "fim": fim, "contrato_ref": f'Contrato {c.get("numero")}',
                    "repassa_multas": "S", "repassa_licenciamento": "N", "repassa_ipva": "N",
                    "observacoes": "; ".join(x for x in obs if x), "ref_painel": f'{c.get("id")}#{i["idx"]}',
                })

    # ---- informações para o resumo
    P.info["Veículos na prévia"] = len(P.veiculos)
    P.info["Formatos de placa"] = dict(collections.Counter(formato_placa(v["placa"]) for v in P.veiculos))
    P.info["RENAVAMs completados com zeros à esquerda"] = sum(1 for r in previa if normalizar_renavam(r["renavam_bruto"]) and len(re.sub(r"\D", "", str(int(r["renavam_bruto"])) if isinstance(r["renavam_bruto"], float) else str(r["renavam_bruto"]))) < 11)
    P.info["Veículos com dados do painel de locação (chassi, marca, ano)"] = sum(1 for v in P.veiculos if v["_painel_tipo"])
    P.info["RENAVAM igual ao do painel"] = sum(1 for v in P.veiculos if impl.get(v["placa_norm"]) and normalizar_renavam(impl[v["placa_norm"]].get("renavam")) == v["renavam"])
    P.info["Implementos do painel fora da prévia"] = sorted(set(impl) - set(por_placa_v))
    P.info["Coluna VENCIMENTO (ignorada como vencimento 2027)"] = analisar_vencimentos(P.veiculos)
    return P


def analisar_vencimentos(veiculos):
    """Só para conferência com o calendário 2027 (Fase 3): padrões por UF e final de placa."""
    pr = collections.defaultdict(collections.Counter)
    sp = collections.defaultdict(collections.Counter)
    for v in veiculos:
        final = (v["placa_norm"] or " ")[-1]
        if v["uf_registro"] == "PR" and v["_venc_previa"] and str(v["_venc_previa"]).startswith(("2025", "2026")):
            pr[final][str(v["_venc_previa"])[5:]] += 1
        if v["uf_registro"] == "SP":
            grupo = "CAMINHAO" if v["tipo"] in ("CAVALO", "TRUCK", "TOCO") else "DEMAIS"
            sp[(grupo, final)][str(v["_venc_previa"])] += 1
    return {
        "PR (dia/mês por final; ano ignorado)": {k: dict(c) for k, c in sorted(pr.items())},
        "SP (mês por grupo e final)": {f"{g} final {f}": dict(c) for (g, f), c in sorted(sp.items())},
    }


# --------------------------------------------------------------------------------------
# Relatório de Saneamento
# --------------------------------------------------------------------------------------
CAB_PENDENCIAS = ["id", "gravidade", "placa", "linha_previa", "veiculo_id", "campo", "problema", "valor_atual",
                  "sugestao", "fonte_sugestao", "decisao", "valor_corrigido", "observacao_decisao", "chave"]
COLS_VEICULOS = ["veiculo_id", "renavam", "placa", "chassi", "tipo", "marca_modelo", "ano_fabricacao", "ano_modelo",
                 "cnpj_proprietario", "uf_registro", "municipio_registro", "situacao", "data_aquisicao", "data_venda",
                 "isento_ipva", "motivo_isencao", "forma_pgto_ipva_padrao", "pasta_drive_id", "observacoes"]
COLS_LOCATARIOS = ["locatario_id", "nome", "cnpj_cpf", "contato", "email", "telefone", "ativo", "observacoes", "ref_painel"]
COLS_LOCACOES = ["locacao_id", "veiculo_id", "placa", "locatario_id", "locatario_nome", "inicio", "fim", "contrato_ref",
                 "repassa_multas", "repassa_licenciamento", "repassa_ipva", "observacoes", "ref_painel"]
COLS_FILIAIS = ["cnpj", "nome_curto", "razao_social", "uf", "municipio", "ativo", "observacoes"]
COLS_AJUSTES = ["placa", "campo", "valor", "observacao"]
CAMPOS_AJUSTAVEIS = [c for c in COLS_VEICULOS if c != "veiculo_id"]

AZUL = PatternFill("solid", fgColor="1F3A5F")
CORES = {"BLOQUEIA": "FBE3E1", "CONFERIR": "FAEED3", "INFO": "E8EEF6"}


def _aba(wb, titulo, cabecalho, linhas, larguras=None):
    ws = wb.create_sheet(titulo)
    ws.append(cabecalho)
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = AZUL
        c.alignment = Alignment(vertical="center", wrap_text=True)
    for l in linhas:
        ws.append([l.get(k) if isinstance(l, dict) else l[i] for i, k in enumerate(cabecalho)])
    ws.freeze_panes = "B2"
    ws.auto_filter.ref = ws.dimensions
    for i, k in enumerate(cabecalho, start=1):
        ws.column_dimensions[get_column_letter(i)].width = (larguras or {}).get(k, max(12, min(45, len(k) + 4)))
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.number_format = "@"
    return ws


def escrever_relatorio(P: Proposta, saida: Path, data_ref: str, fontes: dict):
    saida.mkdir(parents=True, exist_ok=True)
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    ordem = {g: i for i, g in enumerate(GRAVIDADES)}
    pend = sorted(P.pendencias, key=lambda p: (ordem[p["gravidade"]], p["linha_previa"], p["campo"]))
    for n, p in enumerate(pend, start=1):
        p["id"] = f"S{n:03d}"

    leia = wb.create_sheet("LEIA-ME")
    cont = collections.Counter(p["gravidade"] for p in P.pendencias)
    textos = [
        ("Relatório de Saneamento: carga inicial da frota", True),
        (f"Gerado em {dt.datetime.now():%d/%m/%Y %H:%M} · data de referência das locações: {dt.date.fromisoformat(data_ref):%d/%m/%Y}", False),
        (f"Fontes: {fontes['previa']} (só a aba \"{ABA_PREVIA}\") e painel \"Locação de Carretas Gobor\" ({fontes['painel']}).", False),
        ("", False),
        ("Como preencher", True),
        ("1. Aba Pendências: preencha a coluna \"decisao\" de cada linha BLOQUEIA (obrigatório) e, se quiser, das CONFERIR.", False),
        ("   ACEITAR = usar a sugestão · CORRIGIR = usar o que você escrever em \"valor_corrigido\" · MANTER = manter o valor atual · EXCLUIR = o veículo não entra na base.", False),
        ("   CONFERIR sem decisão = vale a sugestão (fica listado como \"aceito por padrão\"). INFO não precisa de decisão.", False),
        ("2. Abas Locatários e Locações: vieram do painel de locação. Pode corrigir células ou incluir linhas (ex.: contrato que não está no painel).", False),
        ("   Para incluir uma locação: placa, locatario_id (da aba Locatários), inicio (AAAA-MM-DD) e, se já terminou, fim.", False),
        ("3. A aba Veículos é só a prévia normalizada, para consulta: alterações nela são ignoradas. Corrija pelas Pendências.", False),
        ("4. Aba Ajustes (opcional): correções livres de campos do veículo, uma linha por campo. Ex.: placa BEK3H54 · campo marca_modelo · valor VOLKSWAGEN DELIVERY 9.170.", False),
        (f"   Campos aceitos: {', '.join(CAMPOS_AJUSTAVEIS)}.", False),
        ("5. Salve este arquivo com o mesmo nome e rode: python3 scripts/carga_inicial/carga_previa.py aplicar", False),
        ("", False),
        (f"Pendências: {cont['BLOQUEIA']} BLOQUEIA · {cont['CONFERIR']} CONFERIR · {cont['INFO']} INFO", True),
        (f"Veículos: {len(P.veiculos)} · Locatários: {len(P.locatarios)} · Locações: {len(P.locacoes)} · Filiais: {len(P.filiais)}", False),
    ]
    for t, negrito in textos:
        leia.append([t])
        if negrito:
            leia.cell(leia.max_row, 1).font = Font(bold=True, size=12)
    leia.column_dimensions["A"].width = 150

    ws = _aba(wb, "Pendências", CAB_PENDENCIAS, pend,
              {"problema": 70, "sugestao": 28, "valor_atual": 22, "fonte_sugestao": 26, "observacao_decisao": 30, "valor_corrigido": 22, "chave": 30})
    for row in ws.iter_rows(min_row=2):
        cor = CORES.get(row[1].value)
        if cor:
            for c in row[:2]:
                c.fill = PatternFill("solid", fgColor=cor)
        row[6].alignment = Alignment(wrap_text=True, vertical="top")
    dv = DataValidation(type="list", formula1='"' + ",".join(DECISOES) + '"', allow_blank=True)
    ws.add_data_validation(dv)
    col_dec = get_column_letter(CAB_PENDENCIAS.index("decisao") + 1)
    dv.add(f"{col_dec}2:{col_dec}{max(2, len(pend) + 1)}")
    ws.column_dimensions[get_column_letter(len(CAB_PENDENCIAS))].hidden = True

    cab_v = COLS_VEICULOS + ["_obs_previa", "_tipo_previa", "_painel_tipo", "_venc_previa"]
    _aba(wb, "Veículos", cab_v, [{**v, "_tipo_previa": str(v["_tipo_previa"] or ""), "_venc_previa": str(v["_venc_previa"] or "")} for v in P.veiculos],
         {"marca_modelo": 34, "observacoes": 40})
    _aba(wb, "Locatários", COLS_LOCATARIOS, P.locatarios, {"nome": 40, "observacoes": 30})
    _aba(wb, "Locações", COLS_LOCACOES, P.locacoes, {"locatario_nome": 36, "observacoes": 50})
    _aba(wb, "Filiais", COLS_FILIAIS, P.filiais, {"observacoes": 50})
    _aba(wb, "Ajustes", COLS_AJUSTES, [], {"valor": 40, "observacao": 40})
    caminho = saida / NOME_RELATORIO
    wb.save(caminho)

    md = [f"# Relatório de Saneamento: resumo", "", f"Gerado em {dt.datetime.now():%d/%m/%Y %H:%M}. Planilha completa: `{caminho.name}`.", "",
          f"**Pendências:** {cont['BLOQUEIA']} BLOQUEIA · {cont['CONFERIR']} CONFERIR · {cont['INFO']} INFO", ""]
    for g in GRAVIDADES:
        itens = [p for p in pend if p["gravidade"] == g]
        if not itens:
            continue
        md += [f"## {g}", "", "| id | placa | campo | problema | atual | sugestão |", "|---|---|---|---|---|---|"]
        agrupar = g == "INFO" or len(itens) > 40
        if agrupar:
            por = collections.defaultdict(list)
            for p in itens:
                chave_txt = re.sub(r"\s*\([^)]*\)", "", p["problema"]).split(":")[0].split(". ")[0]
                por[(p["campo"], chave_txt)].append(p["placa"])
            md = md[:-2] + ["| campo | problema | placas |", "|---|---|---|"]
            md += [f"| {c} | {pr} | {len(pl)}: {', '.join(pl[:12])}{'…' if len(pl) > 12 else ''} |" for (c, pr), pl in por.items()]
        else:
            md += [f"| {p['id']} | {p['placa']} | {p['campo']} | {p['problema'].replace('|', '/')} | {p['valor_atual']} | {p['sugestao']} |" for p in itens]
        md.append("")
    md += ["## Informações", ""]
    for k, v in P.info.items():
        md.append(f"- **{k}:** `{json.dumps(v, ensure_ascii=False)}`" if isinstance(v, (dict, list)) else f"- **{k}:** {v}")
    (saida / "relatorio_saneamento.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    return caminho


# --------------------------------------------------------------------------------------
# Aplicação das decisões
# --------------------------------------------------------------------------------------
def ler_relatorio(caminho: Path):
    wb = openpyxl.load_workbook(caminho, data_only=True)

    def linhas(aba):
        ws = wb[aba]
        cab = [str(c.value or "").strip() for c in ws[1]]
        out = []
        for r in ws.iter_rows(min_row=2, values_only=True):
            if all(v in (None, "") for v in r):
                continue
            out.append({k: (iso(v) if isinstance(v, (dt.date, dt.datetime)) else (str(v).strip() if v is not None else None)) for k, v in zip(cab, r) if k})
        return out

    return {"pendencias": linhas("Pendências"), "locatarios": linhas("Locatários"), "locacoes": linhas("Locações"),
            "ajustes": linhas("Ajustes") if "Ajustes" in wb.sheetnames else []}


def aplicar(P: Proposta, rel: dict, data_ref: str):
    erros, avisos, log = [], [], collections.Counter()
    decisoes = {d["chave"]: d for d in rel["pendencias"] if d.get("chave")}
    por_id = {v["veiculo_id"]: v for v in P.veiculos}
    excluir = set()
    for p in P.pendencias:
        d = decisoes.get(p["chave"])
        dec = ((d or {}).get("decisao") or "").upper()
        if p["gravidade"] == "INFO":
            continue
        if not d:
            (erros if p["gravidade"] == "BLOQUEIA" else avisos).append(f'{p["placa"]} {p["campo"]}: pendência nova, não está no relatório devolvido (gere o relatório de novo)')
            continue
        if dec and dec not in DECISOES:
            erros.append(f'{d.get("id")} {p["placa"]}: decisão "{dec}" inválida (use {", ".join(DECISOES)})')
            continue
        if not dec:
            if p["gravidade"] == "BLOQUEIA":
                erros.append(f'{d.get("id")} {p["placa"]} {p["campo"]}: BLOQUEIA sem decisão ({p["problema"][:80]})')
                continue
            dec = "ACEITAR"
            log["aceito por padrão"] += 1
        v = por_id[p["veiculo_id"]]
        if dec == "EXCLUIR":
            excluir.add(v["veiculo_id"])
        elif dec == "MANTER":
            if p["campo"] in v and p["valor_atual"] != "":
                v[p["campo"]] = p["valor_atual"]
        else:
            valor = p["sugestao"] if dec == "ACEITAR" else (d.get("valor_corrigido") or "")
            if dec == "ACEITAR" and not valor:
                erros.append(f'{d.get("id")} {p["placa"]} {p["campo"]}: não há sugestão para ACEITAR; use CORRIGIR com valor_corrigido')
                continue
            if dec == "CORRIGIR" and not valor:
                erros.append(f'{d.get("id")} {p["placa"]} {p["campo"]}: CORRIGIR sem valor_corrigido')
                continue
            if p["campo"] == "renavam":
                valor = normalizar_renavam(valor)
            elif p["campo"] == "cnpj_proprietario":
                valor = formatar_cnpj(valor)
            elif p["campo"] in ("tipo", "situacao"):
                valor = valor.upper().strip()
            elif p["campo"] == "placa":
                valor = limpar_placa(valor)
            v[p["campo"]] = valor
        log[dec] += 1

    veiculos = [v for v in P.veiculos if v["veiculo_id"] not in excluir]
    por_placa_aj = {v["placa_norm"]: v for v in veiculos if v["placa_norm"]}
    for a in rel.get("ajustes", []):
        v = por_placa_aj.get(normalizar_placa(a.get("placa")))
        campo = (a.get("campo") or "").strip()
        rot = f'Ajuste {a.get("placa")} {campo}'
        if not v:
            erros.append(f"{rot}: placa não está na carga")
            continue
        if campo not in CAMPOS_AJUSTAVEIS:
            erros.append(f"{rot}: campo não ajustável (use um de: {', '.join(CAMPOS_AJUSTAVEIS)})")
            continue
        valor = a.get("valor")
        if campo in ("ano_fabricacao", "ano_modelo") and valor not in (None, ""):
            try:
                valor = int(float(valor))
            except ValueError:
                erros.append(f"{rot}: ano inválido ({valor})")
                continue
        elif campo == "renavam":
            valor = normalizar_renavam(valor)
        elif campo == "cnpj_proprietario":
            valor = formatar_cnpj(valor)
        elif campo in ("tipo", "situacao", "uf_registro", "isento_ipva", "forma_pgto_ipva_padrao"):
            valor = (valor or "").upper().strip() or None
        elif campo == "placa":
            valor = limpar_placa(valor)
        v[campo] = valor if valor != "" else None
        log["ajustes"] += 1
    for v in veiculos:
        v["categoria"] = CATEGORIA.get(v["tipo"])
        v["placa_norm"] = normalizar_placa(v["placa"])
    # validação final dos veículos
    filiais = {f["cnpj"] for f in P.filiais}
    ren_vistos, placa_vistas = {}, {}
    for v in veiculos:
        rot = f'{v["veiculo_id"]} {v["placa"]}'
        if not v["placa_norm"]:
            erros.append(f"{rot}: placa inválida")
        if not renavam_valido(v["renavam"]):
            erros.append(f'{rot}: RENAVAM inválido ({v["renavam"]})')
        if v["tipo"] not in TIPOS:
            erros.append(f'{rot}: tipo inválido ({v["tipo"]})')
        if v["cnpj_proprietario"] not in filiais:
            erros.append(f'{rot}: CNPJ fora da lista de filiais ({v["cnpj_proprietario"]})')
        if v["situacao"] not in ("OPERACAO_PROPRIA", "LOCADO_TERCEIRO", "PARADO", "A_VENDA", "VENDIDO", "BAIXADO", "EM_TRANSFERENCIA", "HISTORICO"):
            erros.append(f'{rot}: situação inválida ({v["situacao"]})')
        if v["renavam"] in ren_vistos:
            erros.append(f'{rot}: RENAVAM repetido com {ren_vistos[v["renavam"]]}')
        if v["placa_norm"] in placa_vistas:
            erros.append(f'{rot}: placa equivalente a {placa_vistas[v["placa_norm"]]}')
        ren_vistos.setdefault(v["renavam"], rot)
        placa_vistas.setdefault(v["placa_norm"], rot)

    # locatários (como devolvidos)
    locatarios = []
    for l in rel["locatarios"]:
        if not l.get("locatario_id") or not l.get("nome"):
            erros.append(f"Locatário sem id ou nome: {l}")
            continue
        if l.get("cnpj_cpf") and not documento_valido(l["cnpj_cpf"]):
            avisos.append(f'{l["locatario_id"]} {l["nome"]}: CNPJ/CPF inválido ({l["cnpj_cpf"]}); vai em branco')
            l["cnpj_cpf"] = None
        elif l.get("cnpj_cpf"):
            l["cnpj_cpf"] = formatar_documento(l["cnpj_cpf"])
        locatarios.append({k: l.get(k) for k in COLS_LOCATARIOS})
    ids_loc = {l["locatario_id"] for l in locatarios}

    # locações (como devolvidas)
    por_placa = {v["placa_norm"]: v for v in veiculos}
    locacoes, n_max = [], max([int(l["locacao_id"][2:]) for l in rel["locacoes"] if (l.get("locacao_id") or "").startswith("LC")] or [0])
    for l in rel["locacoes"]:
        v = por_placa.get(normalizar_placa(l.get("placa"))) or next((x for x in veiculos if x["veiculo_id"] == l.get("veiculo_id")), None)
        if not v:
            avisos.append(f'Locação {l.get("locacao_id") or "(nova)"} da placa {l.get("placa")} ignorada: veículo não está na carga')
            continue
        if not l.get("locacao_id"):
            n_max += 1
            l["locacao_id"] = f"LC{n_max:05d}"
        l["veiculo_id"] = v["veiculo_id"]
        rot = f'{l["locacao_id"]} {v["placa"]}'
        if l.get("locatario_id") not in ids_loc:
            erros.append(f'{rot}: locatário {l.get("locatario_id")} não está na aba Locatários')
        for campo in ("inicio", "fim"):
            if l.get(campo):
                try:
                    l[campo] = dt.date.fromisoformat(str(l[campo])[:10]).isoformat()
                except ValueError:
                    erros.append(f"{rot}: {campo} inválido ({l[campo]})")
        if not l.get("inicio"):
            erros.append(f"{rot}: início obrigatório")
        if l.get("inicio") and l.get("fim") and l["fim"] < l["inicio"]:
            erros.append(f"{rot}: fim antes do início")
        for campo in ("repassa_multas", "repassa_licenciamento", "repassa_ipva"):
            l[campo] = (l.get(campo) or ("S" if campo == "repassa_multas" else "N")).upper()
        locacoes.append({k: l.get(k) for k in COLS_LOCACOES if k not in ("placa", "locatario_nome")})
    # sobreposição por veículo
    por_v = collections.defaultdict(list)
    for l in locacoes:
        if l.get("inicio"):
            por_v[l["veiculo_id"]].append(l)
    for vid, lista in por_v.items():
        lista.sort(key=lambda x: x["inicio"])
        for a, b in zip(lista, lista[1:]):
            if not a.get("fim") or a["fim"] >= b["inicio"]:
                erros.append(f'{vid}: locações {a["locacao_id"]} e {b["locacao_id"]} se sobrepõem')
    # coerência situação × locação vigente
    vig = {l["veiculo_id"] for l in locacoes if vigente_em(l.get("inicio"), l.get("fim"), data_ref)}
    for v in veiculos:
        if v["situacao"] == "LOCADO_TERCEIRO" and v["veiculo_id"] not in vig:
            avisos.append(f'{v["veiculo_id"]} {v["placa"]}: LOCADO_TERCEIRO sem locação vigente em {data_ref} (multas não terão locatário definido)')
        if v["situacao"] != "LOCADO_TERCEIRO" and v["veiculo_id"] in vig:
            avisos.append(f'{v["veiculo_id"]} {v["placa"]}: tem locação vigente, mas a situação é {v["situacao"]}')
    return {"veiculos": veiculos, "locatarios": locatarios, "locacoes": locacoes, "filiais": P.filiais,
            "erros": erros, "avisos": avisos, "log": dict(log), "excluidos": sorted(excluir)}


def escrever_csv(caminho: Path, colunas, linhas):
    with caminho.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, quoting=csv.QUOTE_ALL, lineterminator="\n")
        w.writerow(colunas)
        for l in linhas:
            w.writerow(["" if l.get(c) is None else l.get(c) for c in colunas])


# --------------------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------------------
def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("comando", choices=["relatorio", "aplicar"])
    ap.add_argument("--entrada", type=Path, default=ENTRADA_PADRAO)
    ap.add_argument("--painel", type=Path, default=PAINEL_PADRAO, help="pasta com a exportação do painel de locação")
    ap.add_argument("--saida", type=Path, default=SAIDA_PADRAO)
    ap.add_argument("--data-ref", default=dt.date.today().isoformat(), help="data de referência das locações (AAAA-MM-DD)")
    a = ap.parse_args(argv)

    previa = ler_previa(a.entrada)
    painel = ler_painel(a.painel)
    P = montar(previa, painel, a.data_ref)

    if a.comando == "relatorio":
        caminho = escrever_relatorio(P, a.saida, a.data_ref, {"previa": a.entrada.name, "painel": f'{len(painel["contratos"])} contratos'})
        cont = collections.Counter(p["gravidade"] for p in P.pendencias)
        print(f"OK: {caminho}")
        print(f"Veículos {len(P.veiculos)} · Locatários {len(P.locatarios)} · Locações {len(P.locacoes)}")
        print(f"Pendências: {cont['BLOQUEIA']} BLOQUEIA · {cont['CONFERIR']} CONFERIR · {cont['INFO']} INFO")
        return 0

    rel_path = a.saida / NOME_RELATORIO
    if not rel_path.exists():
        print(f"ERRO: {rel_path} não existe. Rode primeiro o comando relatorio.", file=sys.stderr)
        return 2
    R = aplicar(P, ler_relatorio(rel_path), a.data_ref)
    md = ["# Aplicação do saneamento", "", f"Em {dt.datetime.now():%d/%m/%Y %H:%M}.", "",
          f"- Decisões: {R['log']}", f"- Excluídos: {R['excluidos'] or 'nenhum'}",
          f"- Veículos {len(R['veiculos'])} · Locatários {len(R['locatarios'])} · Locações {len(R['locacoes'])} · Filiais {len(R['filiais'])}", ""]
    if R["erros"]:
        md += ["## ❌ Erros (nada foi gerado)", ""] + [f"- {e}" for e in R["erros"]] + [""]
    if R["avisos"]:
        md += ["## ⚠️ Avisos", ""] + [f"- {e}" for e in R["avisos"]] + [""]
    a.saida.mkdir(parents=True, exist_ok=True)
    (a.saida / "relatorio_aplicacao.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    if R["erros"]:
        print(f"ERRO: {len(R['erros'])} problema(s). Veja {a.saida / 'relatorio_aplicacao.md'}", file=sys.stderr)
        for e in R["erros"][:15]:
            print("  - " + e, file=sys.stderr)
        return 1
    finais = a.saida / "importar"
    finais.mkdir(parents=True, exist_ok=True)
    escrever_csv(finais / "FILIAIS.csv", COLS_FILIAIS, R["filiais"])
    escrever_csv(finais / "LOCATARIOS.csv", COLS_LOCATARIOS, R["locatarios"])
    escrever_csv(finais / "VEICULOS.csv", COLS_VEICULOS, R["veiculos"])
    escrever_csv(finais / "LOCACOES.csv", [c for c in COLS_LOCACOES if c not in ("placa", "locatario_nome")], R["locacoes"])
    print(f"OK: CSVs em {finais} · {len(R['avisos'])} aviso(s) em relatorio_aplicacao.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
