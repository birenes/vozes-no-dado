"""Prepara os arquivos JSON que os graficos leem, a partir das fontes da planilha.

Roda uma vez (ou quando uma fonte mudar):  python preparar_dados.py
Cada bloco diz de qual fonte (DTS) e de qual dado (DAT) o numero saiu.
"""
import csv
import gzip
import json
import os
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(AQUI, "dados")


def salvar(nome, obj):
    with open(os.path.join(D, nome), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
    print("ok ->", nome)


def baixar_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8"})
    with urllib.request.urlopen(req, timeout=120) as r:
        bruto = r.read()
    if bruto[:2] == bytes([0x1F, 0x8B]):   # algumas APIs respondem em gzip
        bruto = gzip.decompress(bruto)
    return json.loads(bruto.decode("utf-8"))


# ---------------------------------------------------------------- QUE01
# DTS06 (subdialetos) + DTS01 (CORAA, campo accent). A ligacao subcorpus ->
# subdialeto e nossa, pela cidade onde cada subcorpus foi gravado.
COBERTOS = {
    "10": "NURC-Recife (Recife)",
    "12": "SP2010 (São Paulo, capital)",
    "5.1": "ALIP (interior de São Paulo)",
    "16": "C-ORAL-BRASIL I (Belo Horizonte)",
}
dialetos = {}
with open(os.path.join(D, "subdialetos-brasil.csv"), encoding="utf-8-sig") as f:
    for linha in csv.DictReader(f):
        dialetos.setdefault(linha["dialeto"], []).append({
            "name": linha["subdialeto"], "codigo": linha["codigo"],
            "coraa": COBERTOS.get(linha["codigo"]), "value": 1})
salvar("q01_subdialetos.json",
       {"name": "Brasil", "children": [{"name": k, "children": v} for k, v in dialetos.items()]})

# ---------------------------------------------------------------- QUE02
# DTS01 + DTS04 (populacao) + DTS05 (malha, so para posicionar os estados)
CODIGO_UF = {"11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO",
             "21": "MA", "22": "PI", "23": "CE", "24": "RN", "25": "PB", "26": "PE", "27": "AL",
             "28": "SE", "29": "BA", "31": "MG", "32": "ES", "33": "RJ", "35": "SP",
             "41": "PR", "42": "SC", "43": "RS", "50": "MS", "51": "MT", "52": "GO", "53": "DF"}
NOMES = {"RO": "Rondônia", "AC": "Acre", "AM": "Amazonas", "RR": "Roraima", "PA": "Pará",
         "AP": "Amapá", "TO": "Tocantins", "MA": "Maranhão", "PI": "Piauí", "CE": "Ceará",
         "RN": "Rio Grande do Norte", "PB": "Paraíba", "PE": "Pernambuco", "AL": "Alagoas",
         "SE": "Sergipe", "BA": "Bahia", "MG": "Minas Gerais", "ES": "Espírito Santo",
         "RJ": "Rio de Janeiro", "SP": "São Paulo", "PR": "Paraná", "SC": "Santa Catarina",
         "RS": "Rio Grande do Sul", "MS": "Mato Grosso do Sul", "MT": "Mato Grosso",
         "GO": "Goiás", "DF": "Distrito Federal"}
with open(os.path.join(D, "ufs.geojson"), encoding="utf-8") as f:
    malha = json.load(f)
pos = {}
for ft in malha["features"]:
    g = ft["geometry"]
    partes = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
    anel = max((p[0] for p in partes), key=len)
    pos[CODIGO_UF[ft["properties"]["codarea"]]] = [sum(p[0] for p in anel) / len(anel),
                                                   sum(p[1] for p in anel) / len(anel)]
estados = []
with open(os.path.join(D, "mapa-sotaques-por-uf.csv"), encoding="utf-8") as f:
    for l in csv.DictReader(f):
        uf = l["uf"]
        estados.append({"uf": uf, "nome": NOMES[uf], "regiao": l["regiao"],
                        "populacao": int(l["populacao"]), "segmentos": int(l["segmentos"]),
                        "lon": pos[uf][0], "lat": pos[uf][1]})
salvar("q02_estados.json", estados)

# ---------------------------------------------------------------- QUE03
# DTS07: Candido Junior et al., arXiv 2110.15731, Tabelas 6 e 7 (WER, %)
salvar("q03_wer_coraa.json", {
    "fonte": "Candido Junior et al., CORAA, arXiv 2110.15731, Tabelas 6 e 7",
    "sotaque": [
        {"nome": "Interior de SP", "sub": "ALIP", "sem": 59.30, "com": 34.06},
        {"nome": "Minas Gerais", "sub": "C-ORAL-BRASIL I", "sem": 45.9, "com": 28.88},
        {"nome": "São Paulo, capital", "sub": "SP2010", "sem": 42.44, "com": 20.00},
        {"nome": "Recife", "sub": "NURC-Recife", "sem": 42.17, "com": 22.03},
        {"nome": "Origem não declarada", "sub": "TEDx", "sem": 22.69, "com": 19.36},
    ],
    "estilo": [
        {"nome": "Fala espontânea", "sem": 49.18, "com": 26.5},
        {"nome": "Fala preparada", "sem": 15.89, "com": 18.7},
    ],
})

# ---------------------------------------------------------------- QUE04 e QUE05
# DTS01: contagens calculadas sobre os 402.456 segmentos dos tres CSVs
with open(os.path.join(D, "dados_q45.json"), encoding="utf-8") as f:
    q45 = json.load(f)
salvar("q04_estilo.json", q45["estilo"])
salvar("q05_anotacao.json", {"proporcao": q45["anot"], "segmentos_anotados": q45["nanot"],
                             "nao_anotados": ["São Paulo (int.)", "Misc."]})

# ---------------------------------------------------------------- QUE06 e QUE10
# DTS02: Common Voice 26.0, recorte pt. Falantes por categoria vem da
# datasheet oficial do dataset (mesma release); clipes vem do JSON de estatisticas.
cv = baixar_json("https://raw.githubusercontent.com/common-voice/cv-dataset/main/"
                 "datasets/scripted-speech/cv-corpus-26.0-2026-06-12.json")
pt = cv["locales"]["pt"]

# DTS13: IBGE, Censo 2022, tabela 9514 (populacao residente por sexo e idade, Brasil).
# Referencia de "equilibrado" para a QUE06: a populacao do pais. Idade so de 19 anos
# em diante, porque a faixa "menos de 19" do Common Voice inclui criancas.
censo = baixar_json("https://servicodados.ibge.gov.br/api/v3/agregados/9514/periodos/2022/variaveis/93"
                    "?localidades=N1[all]&classificacao=2[all]|287[all]|286[113635]")
pop = {}
for r in censo[0]["resultados"]:
    cl = {c["id"]: list(c["categoria"].values())[0] for c in r["classificacoes"]}
    pop[(cl["2"], cl["287"])] = int(list(r["series"][0]["serie"].values())[0])
por_idade = {int(i.split()[0]): v for (s, i), v in pop.items()
             if s == "Total" and (i.endswith(" ano") or i.endswith(" anos")) and i.split()[0].isdigit()
             and " a " not in i}
por_idade[100] = pop[("Total", "100 anos ou mais")]
FAIXAS = [("19 a 29", 19, 29), ("30 a 39", 30, 39), ("40 a 49", 40, 49),
          ("50 a 59", 50, 59), ("60 a 69", 60, 69), ("70 ou mais", 70, 100)]

salvar("q06_genero_idade.json", {
    "censo": {"homens": pop[("Homens", "Total")], "mulheres": pop[("Mulheres", "Total")],
              "idade": {n: sum(por_idade[a] for a in range(i, f + 1)) for n, i, f in FAIXAS}},
    "total_falantes": pt["users"], "total_clipes": pt["clips"],
    "genero": [
        {"cat": "Masculino", "falantes": 944, "clipes": 132776},
        {"cat": "Feminino", "falantes": 137, "clipes": 11468},
        {"cat": "Não binário", "falantes": 1, "clipes": 10},
        {"cat": "Não declarado", "falantes": 3054, "clipes": 52841},
    ],
    # faixas do Common Voice (demographics.ts): teens = menos de 19, twenties = 19 a 29
    "idade": [
        {"cat": "Menos de 19", "falantes": 101, "clipes": 4513},
        {"cat": "19 a 29", "falantes": 498, "clipes": 70544},
        {"cat": "30 a 39", "falantes": 314, "clipes": 34639},
        {"cat": "40 a 49", "falantes": 163, "clipes": 25580},
        {"cat": "50 a 59", "falantes": 71, "clipes": 5070},
        {"cat": "60 a 69", "falantes": 19, "clipes": 8775},
        {"cat": "70 ou mais", "falantes": 2, "clipes": 16},
        {"cat": "Não declarado", "falantes": 2995, "clipes": 47958},
    ],
})
dominios = pt["splits"]["sentence_domain"]
salvar("q10_dominios.json", {"frases_validadas": pt["validatedSentences"], "dominios": dominios})

# ---------------------------------------------------------------- QUE07
# DTS08: Lea et al. (Apple), arXiv 2106.11759, Tabelas 2 e 3 (isWER, %)
# DTS09: arXiv 2509.15516, Tabela 2: WER no Euphonia por gravidade,
#        modelo generico (USM) versus modelo personalizado
salvar("q07_fala_atipica.json", {
    "gagueira": [
        {"cat": "Fala fluente", "wer": 5.65},
        {"cat": "Gagueira leve", "wer": 8.39},
        {"cat": "Gagueira moderada", "wer": 16.64},
        {"cat": "Gagueira grave", "wer": 47.86},
    ],
    "euphonia": [
        {"cat": "Comprometimento leve", "generico": 7.3, "personalizado": 4.2},
        {"cat": "Comprometimento moderado", "generico": 19.6, "personalizado": 11.2},
        {"cat": "Comprometimento grave", "generico": 31.3, "personalizado": 26.7},
    ],
})

# ---------------------------------------------------------------- QUE08
# DTS10: catalogo montado neste trabalho
with open(os.path.join(D, "catalogo-fala-atipica.csv"), encoding="utf-8-sig") as f:
    salvar("q08_catalogo.json", list(csv.DictReader(f)))

# ---------------------------------------------------------------- QUE09
# DTS11: IBGE tabela 10423 (falantes por lingua) + DTS02 (idiomas no Common Voice).
# A 10423 conta todo mundo que fala a lingua no domicilio. A 10403, usada antes, conta
# so quem declarou a lingua como PRIMEIRA lingua indigena (Tikuna: 51.882 contra 51.978,
# que e o numero da publicacao oficial do IBGE).
ibge = baixar_json("https://servicodados.ibge.gov.br/api/v3/agregados/10423/periodos/2022/"
                   "variaveis/13245?localidades=N1[all]&classificacao=2105[all]|2106[80277]|1336[57961]|1440[58106]")
linguas, troncos = [], {}
for r in ibge[0]["resultados"]:
    nome0 = list(r["classificacoes"][0]["categoria"].values())[0]
    c0, _, rot0 = nome0.partition(" ")
    if c0.count(".") == 1:
        troncos[c0.rstrip(".")] = rot0
    nome = list(r["classificacoes"][0]["categoria"].values())[0]
    codigo, _, rotulo = nome.partition(" ")
    valor = r["series"][0]["serie"]["2022"]
    # nivel lingua = codigo com tres numeros (ex.: 4.1.9.)
    if codigo.count(".") == 3 and valor.isdigit():
        tronco = codigo.split(".")[0]
        linguas.append({"lingua": rotulo, "codigo": codigo, "tronco": tronco, "falantes": int(valor)})
salvar("q09_linguas_indigenas.json", {
    "linguas": sorted(linguas, key=lambda x: -x["falantes"]),
    "troncos": troncos,
    "idiomas_no_common_voice": len(cv["locales"]),
    "comparacao": {"abcazio_horas": cv["locales"]["ab"]["validHrs"], "portugues_horas": pt["validHrs"],
                   "guarani_paraguaio_horas": cv["locales"]["gn"]["validHrs"],
                   "quichua_horas": cv["locales"]["quy"]["validHrs"],
                   "nauatle_horas": cv["locales"]["nhi"]["validHrs"]},
})

# ---------------------------------------------------------------- QUE10 (conclusao)
# Tres graficos: quem fica de fora (pessoas), quanto o erro aumenta fora do treino,
# e o que isso muda em cada funcao dos modelos.
# DTS14: IBGE tabela 10145 (pessoas diagnosticadas com autismo, Censo 2022)
autismo = baixar_json("https://servicodados.ibge.gov.br/api/v3/agregados/10145/periodos/2022/variaveis/13267"
                      "?localidades=N1[all]&classificacao=2[6794]|58[95253]")
# DTS11: IBGE tabela 10392. Quem fala lingua indigena = total - "nao fala lingua indigena no domicilio"
fala = baixar_json("https://servicodados.ibge.gov.br/api/v3/agregados/10392/periodos/2022/variaveis/13245"
                   "?localidades=N1[all]&classificacao=15[201]|1168[208,57960]|1336[57961]|1440[58106]")
por_status = {list(r["classificacoes"][1]["categoria"].values())[0]: int(r["series"][0]["serie"]["2022"])
              for r in fala[0]["resultados"]}
with open(os.path.join(D, "q03_wer_coraa.json"), encoding="utf-8") as f:
    interior = next(d for d in json.load(f)["sotaque"] if d["nome"] == "Interior de SP")

salvar("q10_conclusao.json", {
    "pessoas": [
        {"grupo": "Moram em estados sem dado no CORAA",
         "pessoas": sum(e["populacao"] for e in estados if e["segmentos"] == 0), "fonte": "DTS01 + DTS04"},
        {"grupo": "Mulheres", "pessoas": pop[("Mulheres", "Total")], "fonte": "DTS13"},
        {"grupo": "Pessoas com 50 anos ou mais",
         "pessoas": sum(por_idade[a] for a in range(50, 101)), "fonte": "DTS13"},
        {"grupo": "Pessoas diagnosticadas com autismo",
         "pessoas": int(autismo[0]["resultados"][0]["series"][0]["serie"]["2022"]), "fonte": "DTS14"},
        {"grupo": "Falantes de línguas indígenas",
         "pessoas": por_status["Total"] - por_status["Não fala língua indígena no domicílio"], "fonte": "DTS11"},
    ],
    # DTS15: Park & Lee, Interspeech 2025, Tabela 2: Whisper-small na fala de 4 pessoas autistas
    # (coreano, CER). Sem a fala autista no treino 26,38%; com ajuste completo nela 7,89%.
    "autismo_treino": {"fora": 26.38, "dentro": 7.89, "metrica": "CER"},
    "funcoes": [
        # DTS16: Ashvin et al., WOCCI 2025, Tabela 3: Whisper large-v3 sem ajuste, sessoes ADOS (ingles)
        {"funcao": "Diagnóstico de autismo", "detalhe": "transcrição das sessões (Whisper large-v3, inglês)",
         "dentro": {"grupo": "adultos", "wer": 25.96}, "fora": {"grupo": "crianças", "wer": 55.78}, "fonte": "DTS16"},
        # DTS08: Lea et al. (Apple), Tabelas 2 e 3
        {"funcao": "Assistente de voz", "detalhe": "assistente comercial (Lea et al., 2021)",
         "dentro": {"grupo": "fala fluente", "wer": 5.65}, "fora": {"grupo": "gagueira grave", "wer": 47.86}, "fonte": "DTS08"},
        # DTS07: artigo do CORAA, Tabela 6: a mesma fala do interior de SP (ALIP), com um modelo
        # treinado sem o CORAA e outro treinado com ele
        {"funcao": "Transcrição em português", "detalhe": "fala do interior de SP (Candido Junior et al.)",
         "dentro": {"grupo": "com o sotaque", "wer": interior["com"]},
         "fora": {"grupo": "sem o sotaque", "wer": interior["sem"]}, "fonte": "DTS07"},
    ],
})
