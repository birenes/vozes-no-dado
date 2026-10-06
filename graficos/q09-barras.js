// QUE09: quantas linguas indigenas faladas no Brasil tem dados de fala abertos?
// Referencia D3: https://observablehq.com/@d3/horizontal-bar-chart/2
// Dois graficos de barras horizontais separados, cada um com a sua unidade:
//  #g09a  as 12 linguas indigenas mais faladas do Brasil (IBGE, Censo 2022), barra = falantes
//  #g09b  horas de fala validadas no Common Voice 26.0: quem esta la, inclusive linguas
//         indigenas de outros paises das Americas, e as 295 linguas indigenas do Brasil com 0 h
// Dados: dados/q09_linguas_indigenas.json (DTS11, DTS02; DAT28 a DAT31)

d3.json("dados/q09_linguas_indigenas.json").then(D => {
  const c = D.comparacao;
  barrasQ09("#g09a", D.linguas.filter(l => +l.tronco <= 8).slice(0, 12)
    .map(l => ({ nome: l.lingua, v: l.falantes, cor: "#F76D4D" })),
    { maximo: 55000, unidade: "falantes no Brasil", formato: br });
  barrasQ09("#g09b", [
    { nome: "Abcázio (Cáucaso)", v: c.abcazio_horas, cor: COR.presente },
    { nome: "Português", v: c.portugues_horas, cor: COR.presente },
    { nome: "Guarani (Paraguai)", v: c.guarani_paraguaio_horas, cor: COR.presenteEscuro },
    { nome: "Quíchua (Andes)", v: c.quichua_horas, cor: COR.presenteEscuro },
    { nome: "Náuatle (México)", v: c.nauatle_horas, cor: COR.presenteEscuro },
    { nome: "Línguas indígenas do Brasil (295)", v: 0, cor: "#F76D4D" },
  ], { maximo: 220, unidade: "horas de fala validadas", formato: h => `${Number.isInteger(h) ? h : dec(h, h < 1 ? 2 : 1)} h`,
       legenda: [[COR.presente, "outras línguas"], [COR.presenteEscuro, "língua indígena de outro país das Américas"],
                 ["#F76D4D", "língua indígena do Brasil"]] });
});

function barrasQ09(seletor, dados, { maximo, unidade, formato, legenda }) {
  const m = { top: 40, right: 90, bottom: legenda ? 40 : 10, left: 250 }, PASSO = 30;
  const L = 860, A = m.top + dados.length * PASSO + m.bottom;
  const x = d3.scaleLinear().domain([0, maximo]).range([m.left, L - m.right]);
  const y = d3.scaleBand().domain(dados.map(d => d.nome)).rangeRound([m.top, m.top + dados.length * PASSO]).padding(0.25);
  const svg = novoSvg(seletor, L, A);

  svg.append("g").attr("transform", `translate(0,${m.top})`)
    .call(d3.axisTop(x).ticks(5).tickFormat(formato))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick text").attr("fill", COR.tinta))
    .call(g => g.selectAll(".tick line").clone().attr("y2", dados.length * PASSO).attr("stroke-opacity", 0.1))
    .call(g => g.append("text").attr("x", L - m.right).attr("y", -24).attr("text-anchor", "end")
      .attr("fill", COR.tinta).attr("font-size", 11.5).text(unidade));

  svg.append("g").selectAll("rect").data(dados).join("rect")
    .attr("x", x(0)).attr("y", d => y(d.nome))
    .attr("width", d => (d.v > 0 ? Math.max(2, x(d.v) - x(0)) : 0)).attr("height", y.bandwidth())
    .attr("fill", d => d.cor)
    .on("mousemove", (e, d) => mostrar(e, `<strong>${d.nome}</strong><br>${formato(d.v)}`))
    .on("mouseleave", esconder);

  svg.append("g").selectAll("text").data(dados).join("text")
    .attr("x", d => (d.v > 0 ? Math.max(x(0) + 2, x(d.v)) : x(0)) + 6)
    .attr("y", d => y(d.nome) + y.bandwidth() / 2).attr("dy", "0.35em")
    .attr("font-size", 12).attr("font-weight", "bold").attr("fill", COR.tinta).text(d => formato(d.v));

  svg.append("g").attr("transform", `translate(${m.left},0)`)
    .call(d3.axisLeft(y).tickSizeOuter(0))
    .call(g => g.selectAll("text").attr("font-size", 13).attr("fill", COR.tinta));

  if (legenda) {
    const leg = svg.append("g").attr("transform", `translate(${m.left},${A - 12})`);
    let xx = 0;
    legenda.forEach(([cor, t]) => {
      leg.append("rect").attr("x", xx).attr("y", -6).attr("width", 12).attr("height", 12).attr("fill", cor);
      leg.append("text").attr("x", xx + 18).attr("dy", "0.35em").attr("font-size", 12).attr("fill", COR.tinta).text(t);
      xx += 30 + t.length * 6.3;
    });
  }
}
