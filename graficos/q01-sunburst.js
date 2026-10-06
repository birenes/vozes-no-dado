// QUE01: quantas variedades sao descritas, e quantas o dataset distingue?
// Referencia D3: https://observablehq.com/@d3/zoomable-sunburst
// Sunburst interativo (correcoes 1, 2 e 3 do professor):
//  - os 16 dialetos ficam agrupados em duas classes: "com registro no CORAA"
//    e "sem registro". A classe abre ao clique e mostra seus dialetos; o
//    dialeto abre e mostra seus subdialetos.
//  - cores com contraste alto e sempre com o mesmo significado (ver comum.js).
// Dados: dados/q01_subdialetos.json (DTS06 + DTS01, DAT03, DAT09, DAT10)

d3.json("dados/q01_subdialetos.json").then(BRASIL => {
  const LARGURA = 620;
  const RAIO = LARGURA / 6;

  // agrupa os dialetos nas duas classes
  const com = { name: "Com registro", classe: "com", children: [] };
  const sem = { name: "Sem registro", classe: "sem", children: [] };
  BRASIL.children.forEach(d => (d.children.some(s => s.coraa) ? com : sem).children.push(d));

  const raiz = d3.hierarchy({ name: "Brasil", children: [com, sem] })
    .sum(d => d.value).sort((a, b) => b.value - a.value);
  d3.partition().size([2 * Math.PI, raiz.height + 1])(raiz);
  raiz.each(d => (d.atual = d));

  function cor(d) {
    if (d.depth === 1) return d.data.classe === "com" ? COR.presenteEscuro : COR.ausenteEscuro;
    if (d.depth === 2) return d.children.some(c => c.data.coraa) ? COR.presente : COR.ausente;
    return d.data.coraa ? COR.destaque : COR.ausente;
  }

  const arco = d3.arc()
    .startAngle(d => d.x0).endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005)).padRadius(RAIO * 1.5)
    .innerRadius(d => d.y0 * RAIO).outerRadius(d => Math.max(d.y0 * RAIO, d.y1 * RAIO - 2));

  const svg = novoSvg("#g01", LARGURA + 300, LARGURA);
  const g = svg.append("g").attr("transform", `translate(${LARGURA / 2},${LARGURA / 2})`);

  const fatias = g.append("g").selectAll("path").data(raiz.descendants().slice(1)).join("path")
    .attr("fill", cor).attr("stroke", COR.fundo).attr("stroke-width", 1.2)
    .attr("fill-opacity", d => (visivel(d.atual) ? 1 : 0))
    .attr("pointer-events", d => (visivel(d.atual) ? "auto" : "none"))
    .attr("d", d => arco(d.atual))
    .style("cursor", d => (d.children ? "pointer" : "default"))
    .on("mousemove", (e, d) => mostrar(e, textoTooltip(d)))
    .on("mouseleave", esconder)
    .on("click", (e, d) => d.children && abrir(d));

  const rotulos = g.append("g").attr("pointer-events", "none").attr("text-anchor", "middle")
    .selectAll("text").data(raiz.descendants().slice(1)).join("text")
    .attr("dy", "0.35em")
    .attr("font-size", d => (d.depth === 1 ? 12.5 : 11))
    .attr("font-weight", d => (d.depth === 1 ? "bold" : "normal"))
    .attr("fill", d => tintaSobre(cor(d)))
    .attr("fill-opacity", d => +rotuloVisivel(d.atual))
    .attr("transform", d => posicao(d.atual))
    .text(d => (d.data.name.length > 17 ? d.data.name.slice(0, 16) + "…" : d.data.name));

  g.append("circle").attr("r", RAIO).attr("fill", COR.fundo).style("cursor", "pointer")
    .on("click", () => abrir((raiz.foco && raiz.foco.parent) || raiz));
  const centro = g.append("text").attr("text-anchor", "middle").attr("dy", "0.35em")
    .attr("font-size", 14).attr("font-weight", "bold").attr("fill", COR.tinta)
    .attr("pointer-events", "none").text("Brasil");

  // legenda e numero-resumo ao lado
  const lado = svg.append("g").attr("transform", `translate(${LARGURA + 10}, 120)`);
  lado.append("text").attr("font-size", 44).attr("font-weight", "bold").attr("fill", COR.tinta).text("4 de 44");
  lado.append("text").attr("y", 28).attr("font-size", 13).attr("fill", COR.tinta)
    .text("subdialetos têm registro no CORAA");
  const itens = [
    [COR.destaque, "subdialeto com registro no CORAA"],
    [COR.presente, "dialeto com algum subdialeto registrado"],
    [COR.ausente, "sem nenhum registro"],
  ];
  itens.forEach(([c, t], i) => {
    const y = 70 + i * 24;
    lado.append("rect").attr("y", y - 11).attr("width", 14).attr("height", 14).attr("rx", 3).attr("fill", c);
    lado.append("text").attr("x", 22).attr("y", y).attr("font-size", 12.5).attr("fill", COR.tinta).text(t);
  });

  function textoTooltip(d) {
    const nome = `<strong>${d.data.name}</strong>`;
    if (!d.children) return `${nome}<br>${d.data.coraa ? "No CORAA via " + d.data.coraa : "Sem registro no CORAA"}`;
    const folhas = d.leaves();
    return `${nome}<br>${folhas.length} subdialeto(s), ${folhas.filter(f => f.data.coraa).length} no CORAA<br><em>clique para abrir</em>`;
  }

  function abrir(p) {
    raiz.foco = p;
    centro.text(p.depth === 0 ? "Brasil" : p.data.name.length > 14 ? p.data.name.slice(0, 13) + "…" : p.data.name);
    raiz.each(d => (d.alvo = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, d.y0 - p.depth),
      y1: Math.max(0, d.y1 - p.depth),
    }));
    const t = g.transition().duration(650);
    fatias.transition(t)
      .tween("dados", d => { const i = d3.interpolate(d.atual, d.alvo); return tt => (d.atual = i(tt)); })
      .filter(function (d) { return +this.getAttribute("fill-opacity") || visivel(d.alvo); })
      .attr("fill-opacity", d => (visivel(d.alvo) ? 1 : 0))
      .attr("pointer-events", d => (visivel(d.alvo) ? "auto" : "none"))
      .attrTween("d", d => () => arco(d.atual));
    rotulos.filter(function (d) { return +this.getAttribute("fill-opacity") || rotuloVisivel(d.alvo); })
      .transition(t)
      .attr("fill-opacity", d => +rotuloVisivel(d.alvo))
      .attrTween("transform", d => () => posicao(d.atual));
  }

  function visivel(d) { return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0; }
  function rotuloVisivel(d) { return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.06; }
  function posicao(d) {
    const x = ((d.x0 + d.x1) / 2) * 180 / Math.PI;
    const y = ((d.y0 + d.y1) / 2) * RAIO;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }
});
