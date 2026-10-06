// QUE05: a qualidade do audio, segundo os ouvintes, e a mesma entre as variedades?
// Referencia D3: https://observablehq.com/@d3/grouped-bar-chart/2
// Barras agrupadas: um grupo por tipo de problema marcado pelos ouvintes; dentro do
// grupo, uma barra por sotaque, com altura = % dos segmentos que receberam esse voto.
// Barras de alturas diferentes no mesmo grupo = a qualidade NAO e a mesma entre sotaques.
// Nao da para empilhar: um segmento pode receber varios votos, as partes nao somam 100%.
// SP interior e TEDx nao foram anotados, por isso nao aparecem (dito na legenda).
// Dados: dados/q05_anotacao.json (DTS01; DAT05 a DAT08)

d3.json("dados/q05_anotacao.json").then(D => {
  const GRUPOS = [
    ["votes_for_noise_or_low_voice", "Ruído ou voz baixa"],
    ["votes_for_hesitation", "Hesitação"],
    ["votes_for_filled_pause", "Pausa preenchida"],
    ["votes_for_second_voice", "Segunda voz"],
    ["votes_for_no_identified_problem", "Nenhum problema"],
  ];
  const SOTAQUES = [["São Paulo (cap.)", "SP capital"], ["Minas Gerais", "Minas Gerais"], ["Recife", "Recife"]];

  const L = 900, A = 440, m = { top: 80, right: 20, bottom: 40, left: 50 };
  const x0 = d3.scaleBand().domain(GRUPOS.map(g => g[0])).rangeRound([m.left, L - m.right]).paddingInner(0.2);
  const x1 = d3.scaleBand().domain(SOTAQUES.map(s => s[1])).rangeRound([0, x0.bandwidth()]).padding(0.08);
  const y = d3.scaleLinear().domain([0, 0.8]).range([A - m.bottom, m.top]);
  const svg = novoSvg("#g05", L, A);

  svg.append("g").attr("transform", `translate(${m.left},0)`)
    .call(d3.axisLeft(y).ticks(4, "%"))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone().attr("x2", L - m.left - m.right).attr("stroke-opacity", 0.1))
    .call(g => g.append("text").attr("x", -m.left).attr("y", 16).attr("text-anchor", "start")
      .attr("fill", COR.tinta).attr("font-size", 12)
      .text("% dos segmentos em que ao menos um ouvinte marcou o problema"));

  const grupo = svg.append("g").selectAll("g").data(GRUPOS).join("g")
    .attr("transform", g => `translate(${x0(g[0])},0)`);
  grupo.selectAll("rect").data(([chave, rotulo]) => SOTAQUES.map(([s, nome]) => ({ nome, rotulo, v: D.proporcao[s][chave] })))
    .join("rect")
    .attr("x", d => x1(d.nome)).attr("width", x1.bandwidth())
    .attr("y", d => y(d.v)).attr("height", d => y(0) - y(d.v))
    .attr("fill", d => COR.sotaque[d.nome])
    .on("mousemove", (e, d) => mostrar(e, `<strong>${d.nome}</strong><br>${d.rotulo}: ${dec(100 * d.v)}% dos segmentos`))
    .on("mouseleave", esconder);
  grupo.selectAll("text").data(([chave]) => SOTAQUES.map(([s, nome]) => ({ nome, v: D.proporcao[s][chave] })))
    .join("text")
    .attr("x", d => x1(d.nome) + x1.bandwidth() / 2).attr("y", d => y(d.v) - 5).attr("text-anchor", "middle")
    .attr("font-size", 11.5).attr("fill", COR.tinta).text(d => dec(100 * d.v, 0) + "%");

  svg.append("g").attr("transform", `translate(0,${A - m.bottom})`)
    .call(d3.axisBottom(x0).tickSizeOuter(0).tickFormat(c => GRUPOS.find(g => g[0] === c)[1]))
    .call(g => g.selectAll("text").attr("font-size", 13).attr("fill", COR.tinta));

  // legenda: cor = sotaque (a mesma do Sankey)
  const leg = svg.append("g").attr("transform", `translate(${L - m.right - 330},12)`);
  SOTAQUES.forEach(([, nome], i) => {
    leg.append("rect").attr("x", i * 110).attr("y", -7).attr("width", 14).attr("height", 14).attr("fill", COR.sotaque[nome]);
    leg.append("text").attr("x", i * 110 + 20).attr("dy", "0.35em").attr("font-size", 12.5).attr("fill", COR.tinta).text(nome);
  });
  leg.append("text").attr("y", 22).attr("font-size", 11.5).attr("fill", COR.tinta)
    .text("SP interior e TEDx não têm essa anotação");
});
