// QUE04: sotaque e estilo de fala andam juntos no dataset?
// Referencia D3: https://observablehq.com/@d3/sankey/2
// Diagrama de Sankey (galeria do D3): a esquerda os sotaques, a direita os estilos
// de fala; a espessura de cada faixa e a quantidade de segmentos.
// Se cada sotaque manda toda a sua fala para um estilo so, nao da para separar
// o efeito do sotaque do efeito do estilo (e por isso o erro da QUE03 e ambiguo).
// Dados: dados/q04_estilo.json (DTS01; DAT03, DAT04)

d3.json("dados/q04_estilo.json").then(BRUTO => {
  const NOME_SOTAQUE = { "Recife": "Recife", "São Paulo (cap.)": "SP capital", "São Paulo (int.)": "SP interior",
    "Minas Gerais": "Minas Gerais", "Misc.": "TEDx" };
  const NOME_ESTILO = { "Spontaneous Speech": "Fala espontânea", "Spontaneous and Read Speech": "Espontânea e lida",
    "Prepared Speech": "Fala preparada" };

  const nos = [], links = [];
  const idx = {};
  const no = nome => (idx[nome] ??= nos.push({ name: nome }) - 1);
  Object.entries(BRUTO).forEach(([s, estilos]) => Object.entries(estilos).forEach(([e, n]) => {
    if (n > 0) links.push({ source: no(NOME_SOTAQUE[s]), target: no(NOME_ESTILO[e]), value: n, sotaque: NOME_SOTAQUE[s] });
  }));

  const L = 900, A = 500;
  // sem nodeSort: o D3 ordena os nos para cruzar o minimo de faixas
  const sankey = d3.sankey().nodeWidth(16).nodePadding(26)
    .extent([[150, 20], [L - 200, A - 70]]);
  const grafo = sankey({ nodes: nos.map(d => ({ ...d })), links: links.map(d => ({ ...d })) });

  const svg = novoSvg("#g04", L, A);
  const corNo = d => COR.sotaque[d.name] || COR.ausenteEscuro;

  svg.append("g").attr("fill", "none").selectAll("path").data(grafo.links).join("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", d => COR.sotaque[d.sotaque]).attr("stroke-opacity", 0.55)
    .attr("stroke-width", d => Math.max(1.5, d.width))
    .on("mousemove", (e, d) => mostrar(e, `<strong>${d.source.name}: ${d.target.name}</strong><br>${br(d.value)} segmentos<br>` +
      `${dec((100 * d.value) / d.source.value)}% da fala de ${d.source.name}`))
    .on("mouseleave", esconder);

  svg.append("g").selectAll("rect").data(grafo.nodes).join("rect")
    .attr("x", d => d.x0).attr("y", d => d.y0).attr("width", d => d.x1 - d.x0).attr("height", d => Math.max(2, d.y1 - d.y0))
    .attr("fill", corNo);

  svg.append("g").selectAll("text").data(grafo.nodes).join("text")
    .attr("x", d => (d.x0 < L / 2 ? d.x0 - 10 : d.x1 + 10))
    .attr("y", d => (d.y0 + d.y1) / 2).attr("dy", "0.35em")
    .attr("text-anchor", d => (d.x0 < L / 2 ? "end" : "start"))
    .attr("font-size", 13).attr("fill", COR.tinta)
    .call(t => t.append("tspan").attr("font-weight", "bold").text(d => d.name))
    .call(t => t.append("tspan").attr("fill", COR.tinta).attr("font-size", 11.5).text(d => "  " + br(d.value)));

  svg.append("text").attr("x", 150).attr("y", A - 40).attr("font-size", 11.5).attr("fill", COR.tinta)
    .text("espessura = quantidade de segmentos");
  svg.append("text").attr("x", 150).attr("y", A - 12).attr("font-size", 13).attr("font-weight", "bold")
    .attr("fill", COR.tinta)
    .text("4 dos 5 sotaques vão inteiros para um único estilo de fala: no CORAA, sotaque e estilo não se separam.");
});
