"""
Testes do script de carga (dados sintéticos; nenhum dado real da empresa).
Rodar: python3 -m unittest discover -s scripts/carga_inicial
"""
import csv
import datetime as dt
import json
import sys
import tempfile
import unittest
from pathlib import Path

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parent))
import carga_previa as C  # noqa: E402

DATA_REF = "2026-11-18"


def ler_csv(caminho: Path):
    with caminho.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def criar_previa(pasta: Path, linhas):
    wb = openpyxl.Workbook()
    wb.active.title = "IPVA"
    ws = wb.create_sheet(C.ABA_PREVIA)
    ws.append(["PLACA", "RENAVAM", "CNPJ", None, None, "VENCIMENTO", "LANCAMENTOS 2026"])
    for l in linhas:
        ws.append(l)
    caminho = pasta / "previa.xlsx"
    wb.save(caminho)
    return caminho


def criar_painel(pasta: Path, contratos, implementos, locatarios):
    for nome, docs in (("contratos", contratos), ("implementos", implementos), ("locatarios", locatarios)):
        (pasta / nome).mkdir(parents=True, exist_ok=True)
        for d in docs:
            (pasta / nome / f"{d['id']}.json").write_text(json.dumps(d), encoding="utf-8")
    return pasta


PREVIA = [
    ["BEU1D91", 1251100403.0, "77.505.550/0001-97", "PR", "CAVALO", dt.datetime(2026, 8, 14), None],      # ok
    ["RLI4H26", 127280801.0, "77.505.550/0001-97", "PR", "CARRETA", dt.datetime(2024, 8, 31), None],      # DV inválido; painel corrige
    ["EAL8193", 983106606.0, "77.505.550/0001-97", "PR", dt.datetime(2023, 4, 3), None, "alugada"],       # sem tipo; painel sugere TOCO
    ["NCK4696", 808688731.0, None, "RO", None, None, "alugada"],                                          # sem CNPJ e sem tipo
    ["FFD6062", 1219574594.0, "77.505.550/0002-78", "SP", "CARRETA", "setembro", "alugada"],              # alugada sem contrato
    ["QJP4B37", 1174057170.0, "77.505.550/0001-97", "PR", "CAVALO ", dt.datetime(2024, 9, 30), "obs: era Araquari e passou pra Matriz em 2026"],
    ["CUC6766", 501868984.0, "77.505.550/0002-78", "SP", "BI TREM", "setembro", "alugada"],
    ["RHD0D44", 1263578036.0, "77.505.550/0001-97", "PR", "SAVEIRO", dt.datetime(2026, 9, 18), None],
]

CONTRATOS = [
    # RLI4H26: contrato com renovação automática (vigente), sem marcação "alugada" na prévia
    {"id": "c031-2026", "numero": "031/2026", "inicio": "2026-01-15", "fim": "2026-07-14", "renovacaoAuto": True,
     "locatarioId": "andre", "locadora": "Transportadora Gobor Ltda", "itens": [{"placa": "RLI4H26", "valor": 3000}]},
    # EAL8193: contrato antigo substituído por outro (sucessor) do mesmo locatário
    {"id": "c010-2025", "numero": "010/2025", "inicio": "2025-08-01", "fim": "2026-01-31", "renovacaoAuto": True,
     "locatarioId": "mnd", "locadora": "Transportadora Gobor Ltda", "itens": [{"placa": "EAL8193", "valor": 2000}]},
    {"id": "c040-2026", "numero": "040/2026", "inicio": "2026-05-01", "fim": "2026-10-31", "renovacaoAuto": False,
     "locatarioId": "mnd", "locadora": "Transportadora Gobor Ltda", "itens": [{"placa": "EAL8193", "valor": 2100}],
     "cessao": {"ate": "2026-06-30", "locatarioId": "otto"}},
    # NCK4696: vigente
    {"id": "c050-2026", "numero": "050/2026", "inicio": "2026-10-01", "fim": "2027-03-31", "renovacaoAuto": False,
     "locatarioId": "otto", "locadora": "Transportadora Gobor Ltda", "itens": [{"placa": "NCK4696", "valor": 1800}]},
    # CUC6766: devolvido
    {"id": "c012-2025", "numero": "012/2025", "inicio": "2025-08-10", "fim": "2026-02-09", "renovacaoAuto": True,
     "locatarioId": "otto", "locadora": "Transportadora Gobor Ltda",
     "itens": [{"placa": "CUC6766", "valor": 2500, "devolucao": {"data": "2026-06-30"}}]},
]
IMPLEMENTOS = [
    {"id": "RLI4H26", "placa": "RLI4H26", "renavam": "01272808014", "tipo": "Baú", "marca": "LIBRELATO", "modelo": "SR BTF", "ano": "2021/2021", "chassi": "9XYZ"},
    {"id": "EAL8193", "placa": "EAL8193", "renavam": "00983106606", "tipo": "Caminhão baú", "marca": "VOLKSWAGEN", "modelo": "8.150E", "ano": "2008/2009"},
    {"id": "NCK4696", "placa": "NCK4696", "renavam": "00808688731", "tipo": "Caminhão baú", "marca": "FORD", "modelo": "CARGO 815", "ano": "2003/2003"},
    {"id": "CUC6766", "placa": "CUC6766", "renavam": "00501868984", "tipo": "Bitrem", "marca": "RANDON", "modelo": "BT", "ano": "2010"},
]
LOCATARIOS = [
    {"id": "andre", "nome": "ANDRE TESTE TRANSPORTES", "doc": "77505550000197", "telefone": "41 9999-0000"},
    {"id": "mnd", "nome": "MND SERVICOS LTDA", "doc": "39247088000186"},
    {"id": "otto", "nome": "OTTO LOGISTICA", "doc": "529.982.247-25"},
]


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        self.previa = criar_previa(self.dir, PREVIA)
        self.painel = criar_painel(self.dir / "painel", CONTRATOS, IMPLEMENTOS, LOCATARIOS)
        self.saida = self.dir / "saida"
        self.P = C.montar(C.ler_previa(self.previa), C.ler_painel(self.painel), DATA_REF)

    def tearDown(self):
        self.tmp.cleanup()

    def pend(self, placa, campo):
        return [p for p in self.P.pendencias if p["placa"] == placa and p["campo"] == campo]

    def veic(self, placa):
        return next(v for v in self.P.veiculos if v["placa"] == placa)


class TestRegras(unittest.TestCase):
    def test_placa_mercosul(self):
        self.assertEqual(C.normalizar_placa("CUC6H59"), "CUC6759")
        self.assertEqual(C.normalizar_placa("ftd-2e29"), "FTD2429")
        self.assertIsNone(C.normalizar_placa("AB123"))

    def test_renavam(self):
        self.assertEqual(C.normalizar_renavam(229498353.0), "00229498353")
        self.assertTrue(C.renavam_valido(1251100403))
        self.assertFalse(C.renavam_valido(127280801))
        self.assertTrue(C.renavam_valido("01272808014"))
        self.assertIsNone(C.normalizar_renavam("123456789012"))

    def test_cnpj_cpf(self):
        for c in [f[0] for f in C.FILIAIS] + ["12.ABC.345/01DE-35"]:
            self.assertTrue(C.cnpj_valido(c), c)
        self.assertFalse(C.cnpj_valido("77.505.550/0001-98"))
        self.assertTrue(C.cpf_valido("52998224725"))
        self.assertEqual(C.formatar_documento("52998224725"), "529.982.247-25")

    def test_tipo(self):
        self.assertEqual(C.normalizar_tipo("BI TREM")[0], "BITREM")
        self.assertEqual(C.normalizar_tipo("CAVALO ")[0], "CAVALO")
        self.assertEqual(C.normalizar_tipo("SAVEIRO"), ("UTILITARIO", True, '"SAVEIRO" é modelo, não tipo'))
        self.assertIsNone(C.normalizar_tipo(dt.datetime(2023, 4, 3))[0])


class TestMontagem(Base):
    def test_veiculos_e_ids_estaveis(self):
        self.assertEqual([v["veiculo_id"] for v in self.P.veiculos][:3], ["V0001", "V0002", "V0003"])
        v = self.veic("BEU1D91")
        self.assertEqual(v["renavam"], "01251100403")
        self.assertEqual(v["situacao"], "OPERACAO_PROPRIA")
        self.assertEqual(self.pend("BEU1D91", "renavam"), [])

    def test_renavam_corrigido_pelo_painel(self):
        p = self.pend("RLI4H26", "renavam")[0]
        self.assertEqual(p["gravidade"], "BLOQUEIA")
        self.assertEqual(p["valor_atual"], "00127280801")
        self.assertEqual(p["sugestao"], "01272808014")
        v = self.veic("RLI4H26")
        self.assertEqual((v["chassi"], v["ano_fabricacao"], v["ano_modelo"]), ("9XYZ", 2021, 2021))

    def test_situacao_pelo_contrato(self):
        self.assertEqual(self.veic("RLI4H26")["situacao"], "LOCADO_TERCEIRO")
        self.assertTrue(any(p["sugestao"] == "LOCADO_TERCEIRO" for p in self.pend("RLI4H26", "situacao")))
        # alugada na prévia, sem contrato no painel
        p = self.pend("FFD6062", "situacao")[0]
        self.assertEqual((p["gravidade"], p["sugestao"]), ("CONFERIR", "OPERACAO_PROPRIA"))
        # alugada na prévia, devolvida no painel
        self.assertEqual(self.pend("CUC6766", "situacao")[0]["sugestao"], "OPERACAO_PROPRIA")

    def test_tipo_e_cnpj_ausentes(self):
        self.assertEqual(self.pend("EAL8193", "tipo")[0]["sugestao"], "TOCO")
        self.assertEqual(self.pend("NCK4696", "cnpj_proprietario")[0]["sugestao"], "77.505.550/0003-59")
        self.assertEqual(self.pend("RHD0D44", "tipo")[0]["sugestao"], "UTILITARIO")
        self.assertEqual(self.pend("CUC6766", "tipo")[0]["gravidade"], "INFO")

    def test_araquari(self):
        self.assertIn("Ex-Araquari", self.veic("QJP4B37")["observacoes"])
        self.assertEqual(self.pend("QJP4B37", "observacoes")[0]["gravidade"], "CONFERIR")

    def test_locacoes_sucessor_cessao_devolucao(self):
        ls = {(l["placa"], l["inicio"]): l for l in self.P.locacoes}
        loc = {l["ref_painel"]: l["locatario_id"] for l in self.P.locatarios}
        # contrato antigo termina na véspera do sucessor
        self.assertEqual(ls[("EAL8193", "2025-08-01")]["fim"], "2026-04-30")
        # cessão: até 30/06 o responsável é o cessionário; depois, o titular; sem renovação, termina no fim
        self.assertEqual(ls[("EAL8193", "2026-05-01")]["locatario_id"], loc["otto"])
        self.assertEqual(ls[("EAL8193", "2026-05-01")]["fim"], "2026-06-30")
        self.assertEqual(ls[("EAL8193", "2026-07-01")]["locatario_id"], loc["mnd"])
        self.assertEqual(ls[("EAL8193", "2026-07-01")]["fim"], "2026-10-31")
        # devolução registrada encerra a locação
        self.assertEqual(ls[("CUC6766", "2025-08-10")]["fim"], "2026-06-30")
        # renovação automática sem outro fim: vigente (fim vazio)
        self.assertIsNone(ls[("RLI4H26", "2026-01-15")]["fim"])
        # EAL8193: contrato sem renovação venceu em 31/10 sem devolução → conferir
        self.assertTrue(any("venceu" in p["problema"] for p in self.pend("EAL8193", "situacao")))

    def test_locatarios(self):
        self.assertEqual(len(self.P.locatarios), 3)
        self.assertEqual({l["cnpj_cpf"] for l in self.P.locatarios}, {"77.505.550/0001-97", "39.247.088/0001-86", "529.982.247-25"})


class TestRelatorioEAplicacao(Base):
    def decidir(self, regras):
        caminho = self.saida / C.NOME_RELATORIO
        wb = openpyxl.load_workbook(caminho)
        ws = wb["Pendências"]
        cab = [c.value for c in ws[1]]
        for r in range(2, ws.max_row + 1):
            chave = (ws.cell(r, cab.index("placa") + 1).value, ws.cell(r, cab.index("campo") + 1).value)
            if chave in regras:
                dec, val = regras[chave]
                ws.cell(r, cab.index("decisao") + 1).value = dec
                ws.cell(r, cab.index("valor_corrigido") + 1).value = val
        wb.save(caminho)

    def rodar(self, comando):
        return C.main([comando, "--entrada", str(self.previa), "--painel", str(self.painel), "--saida", str(self.saida), "--data-ref", DATA_REF])

    def test_bloqueia_sem_decisao(self):
        self.assertEqual(self.rodar("relatorio"), 0)
        self.assertTrue((self.saida / "relatorio_saneamento.md").exists())
        self.assertEqual(self.rodar("aplicar"), 1)
        self.assertFalse((self.saida / "importar").exists())
        self.assertIn("BLOQUEIA sem decisão", (self.saida / "relatorio_aplicacao.md").read_text())

    def test_aplicar_gera_csvs(self):
        self.rodar("relatorio")
        self.decidir({
            ("RLI4H26", "renavam"): ("ACEITAR", None),
            ("EAL8193", "tipo"): ("ACEITAR", None),
            ("NCK4696", "tipo"): ("CORRIGIR", "truck"),
            ("NCK4696", "cnpj_proprietario"): ("ACEITAR", None),
            ("FFD6062", "situacao"): ("EXCLUIR", None),
        })
        self.assertEqual(self.rodar("aplicar"), 0)
        pasta = self.saida / "importar"
        veic = ler_csv(pasta / "VEICULOS.csv")
        self.assertEqual(len(veic), len(PREVIA) - 1, "FFD6062 excluído")
        por = {v["placa"]: v for v in veic}
        self.assertEqual(por["RLI4H26"]["renavam"], "01272808014")
        self.assertEqual(por["NCK4696"]["tipo"], "TRUCK")
        self.assertEqual(por["NCK4696"]["cnpj_proprietario"], "77.505.550/0003-59")
        self.assertEqual(por["RHD0D44"]["tipo"], "UTILITARIO", "CONFERIR sem decisão = sugestão")
        self.assertEqual(por["BEU1D91"]["renavam"], "01251100403", "zeros preservados no CSV")
        self.assertEqual(len(ler_csv(pasta / "FILIAIS.csv")), 9)
        locs = ler_csv(pasta / "LOCACOES.csv")
        self.assertTrue(all(l["veiculo_id"].startswith("V") and l["locatario_id"].startswith("LT") for l in locs))
        self.assertNotIn("placa", locs[0], "LOCACOES.csv só com colunas da tabela")

    def test_locacao_incluida_a_mao_e_sobreposicao(self):
        self.rodar("relatorio")
        self.decidir({("RLI4H26", "renavam"): ("ACEITAR", None), ("EAL8193", "tipo"): ("ACEITAR", None),
                      ("NCK4696", "tipo"): ("ACEITAR", None), ("NCK4696", "cnpj_proprietario"): ("ACEITAR", None),
                      ("FFD6062", "situacao"): ("MANTER", None)})
        caminho = self.saida / C.NOME_RELATORIO
        wb = openpyxl.load_workbook(caminho)
        ws = wb["Locações"]
        cab = [c.value for c in ws[1]]
        nova = {k: "" for k in cab}
        nova.update(placa="FFD6062", locatario_id="LT0001", inicio="2025-06-01")
        ws.append([nova[k] for k in cab])
        wb.save(caminho)
        self.assertEqual(self.rodar("aplicar"), 0)
        locs = ler_csv(self.saida / "importar" / "LOCACOES.csv")
        self.assertTrue(any(l["inicio"] == "2025-06-01" and l["locacao_id"] for l in locs))
        # agora uma locação sobreposta
        ws.append([{**nova, "inicio": "2025-07-01"}[k] for k in cab])
        wb.save(caminho)
        self.assertEqual(self.rodar("aplicar"), 1)
        self.assertIn("se sobrepõem", (self.saida / "relatorio_aplicacao.md").read_text())


if __name__ == "__main__":
    unittest.main()
