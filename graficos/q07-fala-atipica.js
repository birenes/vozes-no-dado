// QUE07: quanto o erro aumenta com a fala atipica, e quanto cai quando ela entra no treino?
// Dois graficos separados, um para cada metade da pergunta:
//  #g07a  gagueira: barras horizontais, erro por gravidade (Apple, 2021)
//         Referencia D3: https://observablehq.com/@d3/horizontal-bar-chart/2
//  #g07b  Project Euphonia: halteres, modelo generico -> personalizado (funcao halteres, comum.js)
//         Referencia D3: https://observablehq.com/@d3/dot-plot/2
// Dados: dados/q07_fala_atipica.json (DTS08, DTS09; DAT20, DAT21)

d3.json("dados/q07_fala_atipica.json").then(D => {
  barrasGagueira("#g07a", D.gagueira);
  halteres("#g07b", D.euphonia.map(d => ({ nome: d.cat, sem: d.generico, com: d.personalizado })),
    { maximo: 40, rotulos: ["modelo genérico", "modelo personalizado com fala atípica"] });
});

function barrasGagueira(seletor, dados) {
  const base = dados[0].wer;   // a primeira linha e a fala fluente
  const m = { top: 40, right: 230, bottom: 10, left: 180 }, PASSO = 42;
  const L = 860, A = m.top + dados.length * PASSO + m.bottom;
  const x = d3.scaleLinear().domain([0, 50]).range([m.left, L - m.right]);
  const y = d3.scaleBand().domain(dados.map(d => d.cat)).rangeRound([m.top, A - m.bottom]).padding(0.25);
  const svg = novoSvg(seletor, L, A);

  svg.append("g").attr("transform", `translate(0,${m.top})`)
    .call(d3.axisTop(x).ticks(5).tickFormat(d => d + "%"))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone().attr("y2", A - m.top - m.bottom).attr("stroke-opacity", 0.1))
    .call(g => g.append("text").attr("x", x(50)).attr("y", -24).attr("text-anchor", "end")
      .attr("fill", COR.tinta).attr("font-size", 11.5).text("palavras transcritas erradas (WER)"));

  svg.append("g").selectAll("rect").data(dados).join("rect")
    .attr("x", x(0)).attr("y", d => y(d.cat))
    .attr("width", d => x(d.wer) - x(0)).attr("height", y.bandwidth())
    .attr("fill", (d, i) => (i === 0 ? COR.presente : COR.piora))
    .on("mousemove", (e, d) => mostrar(e, `<strong>${d.cat}</strong><br>${dec(d.wer, 2)}% de palavras erradas`))
    .on("mouseleave", esconder);

  svg.append("g").selectAll("text").data(dados).join("text")
    .attr("x", d => x(d.wer) + 8).attr("y", d => y(d.cat) + y.bandwidth() / 2).attr("dy", "0.35em")
    .attr("font-size", 12.5).attr("font-weight", "bold").attr("fill", COR.tinta)
    .text((d, i) => (i === 0 ? `${dec(d.wer, 2)}% (referência)` : `${dec(d.wer, 2)}%: ${dec(d.wer / base)}× a fala fluente`));

  svg.append("g").attr("transform", `translate(${m.left},0)`)
    .call(d3.axisLeft(y).tickSizeOuter(0))
    .call(g => g.selectAll("text").attr("font-size", 13.5).attr("fill", COR.tinta));
}
