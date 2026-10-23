// So na apresentacao: duas versoes mais diretas de graficos do site, no mesmo estilo do #g10e
// (barra clara = referencia, barra escura = o que esta nos dados, lado a lado).
//  #g02p  no lugar do cartograma (#g02): a parte de cada estado na populacao do Brasil e nos trechos
//         do CORAA, com a razao entre as duas
//  #g06p  no lugar das barras divergentes de idade (#g06b): a parte de cada faixa na populacao adulta
//         e entre quem grava no Common Voice
// No site e na planilha continuam o cartograma e as barras divergentes.
// Referencias D3: https://observablehq.com/@d3/grouped-bar-chart/2
//                 https://observablehq.com/@d3/horizontal-bar-chart/2
// Dados: dados/q02_estados.json (DTS01, DTS04), dados/q06_genero_idade.json (DTS02, DTS13)

Promise.all([d3.json("dados/q02_estados.json"), d3.json("dados/q06_genero_idade.json")]).then(([E, G]) => {
  // estados: os tres com trechos e os outros 24 juntos. Os trechos do TEDx nao tem estado e ficam de fora da conta
  const pop = d3.sum(E, d => d.populacao), trechos = d3.sum(E, d => d.segmentos);
  const comDado = E.filter(d => d.segmentos > 0).sort((a, b) => d3.descending(a.segmentos, b.segmentos));
  const semDado = E.filter(d => d.segmentos === 0);
  paresHorizontais("#g02p", [
    ...comDado.map(d => ({ nome: d.nome, a: 100 * d.populacao / pop, b: 100 * d.segmentos / trechos })),
    { nome: `Outros ${semDado.length} estados`, a: 100 * d3.sum(semDado, d => d.populacao) / pop, b: 0 },
  ], { rotulos: [" da população do Brasil", " dos trechos do CORAA"], maximo: 100, razao: "fala ÷ população",
       nota: "trechos com estado conhecido (os do TEDx não informam o estado)" });

  // idade: so adultos de 19 anos ou mais que declararam a faixa, como no grafico do site
  const faixas = ["19 a 29", "30 a 39", "40 a 49", "50 a 59", "60 a 69", "70 ou mais"];
  const cv = Object.fromEntries(G.idade.map(d => [d.cat, d.falantes]));
  const totalCv = d3.sum(faixas, f => cv[f]), totalCenso = d3.sum(faixas, f => G.censo.idade[f]);
  paresHorizontais("#g06p", faixas.map(f => ({
    nome: f === "70 ou mais" ? "70 anos ou mais" : `${f} anos`,
    a: 100 * G.censo.idade[f] / totalCenso, b: 100 * cv[f] / totalCv,
  })), { rotulos: [" da população adulta do Brasil", " de quem grava no Common Voice"], maximo: 60 });
});

function paresHorizontais(seletor, linhas, { rotulos, maximo, razao, nota }) {
  const L = 900, m = { top: 46, right: razao ? 200 : 150, left: 190 }, PASSO = 46, BARRA = 15;
  const A = m.top + linhas.length * PASSO + (nota ? 34 : 10);
  const x = d3.scaleLinear().domain([0, maximo]).range([m.left, L - m.right]);
  const svg = novoSvg(seletor, L, A);
  const pct = v => (v === 0 ? "0%" : dec(v, v < 10 ? 1 : 0) + "%");

  svg.append("g").attr("transform", `translate(0,${m.top - 6})`)
    .call(d3.axisTop(x).ticks(5).tickFormat(d => d + "%"))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick text").attr("fill", COR.tinta))
    .call(g => g.selectAll(".tick line").clone().attr("y2", linhas.length * PASSO + 6).attr("stroke-opacity", 0.1));

  const g = svg.append("g").selectAll("g").data(linhas).join("g")
    .attr("transform", (d, i) => `translate(0,${m.top + i * PASSO})`)
    .on("mousemove", (e, d) => mostrar(e, `<strong>${d.nome}</strong><br>${dec(d.a)}%${rotulos[0]}<br>${dec(d.b)}%${rotulos[1]}`))
    .on("mouseleave", esconder);
  g.append("text").attr("x", m.left - 12).attr("y", 4 + BARRA + 1).attr("dy", "0.35em").attr("text-anchor", "end")
    .attr("font-size", 13).attr("fill", COR.tinta).text(d => d.nome);
  // barra clara = referencia (populacao); barra escura = o que esta nos dados. No primeiro grupo o rotulo diz qual e qual.
  [["a", 4, 0.3, rotulos[0]], ["b", 4 + BARRA + 3, 1, rotulos[1]]].forEach(([chave, y0, opac, rotulo]) => {
    g.append("rect").attr("x", x(0)).attr("y", y0).attr("height", BARRA)
      .attr("width", d => x(d[chave]) - x(0)).attr("fill", COR.presente).attr("fill-opacity", opac);
    g.append("text").attr("x", d => x(d[chave]) + 6).attr("y", y0 + BARRA / 2).attr("dy", "0.35em")
      .attr("font-size", 12).attr("font-weight", "bold").attr("fill", COR.tinta)
      .text((d, i) => pct(d[chave]) + (i === 0 ? rotulo : ""));
  });

  if (razao) {
    // quantas vezes a parte da fala e maior (ou menor) que a parte da populacao
    const xr = L - 20;
    svg.append("text").attr("x", xr).attr("y", m.top - 22).attr("text-anchor", "middle")
      .attr("font-size", 12).attr("font-weight", "bold").attr("fill", COR.tinta).text(razao);
    g.append("text").attr("x", xr).attr("y", 4 + BARRA + 1).attr("dy", "0.35em").attr("text-anchor", "middle")
      .attr("font-size", 15).attr("font-weight", "bold").attr("fill", COR.tinta)
      .text(d => (d.b === 0 ? "0" : dec(d.b / d.a, d.b / d.a < 10 ? 1 : 0) + "×"));
  }
  if (nota) svg.append("text").attr("x", m.left).attr("y", A - 8).attr("font-size", 11).attr("fill", COR.tinta).text(nota);
}
