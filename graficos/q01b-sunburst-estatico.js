// QUE01, versao estatica (para slide): sunburst com os dois aneis sempre visiveis.
// Referencia D3: https://observablehq.com/@d3/sunburst/2
// Anel interno = 16 dialetos; anel externo = 44 subdialetos. Nada precisa de clique.
// Laranja = subdialeto com registro no CORAA; azul = dialeto que tem algum
// subdialeto registrado; cinza = sem nenhum registro.
// Dados: dados/q01_subdialetos.json (DTS06 + DTS01; DAT03, DAT09, DAT10)

d3.json("dados/q01_subdialetos.json").then(BRASIL => {
  const L = 980, A = 640, RAIO = 300, MIOLO = 85;
  const raiz = d3.hierarchy(BRASIL).sum(d => d.value)
    // dialetos com registro primeiro, para ficarem juntos no topo do circulo
    .sort((a, b) => (b.leaves().some(f => f.data.coraa) - a.leaves().some(f => f.data.coraa)) || b.value - a.value);
  d3.partition().size([2 * Math.PI, 3])(raiz);

  // espessura dos aneis: o externo (subdialetos) um pouco mais largo, para caber o nome
  const r = d3.scaleLinear().domain([1, 2, 3]).range([MIOLO, MIOLO + 95, RAIO]);
  const arco = d3.arc()
    .startAngle(d => d.x0).endAngle(d => d.x1)
    .padAngle(0.004).padRadius(RAIO)
    .innerRadius(d => r(d.y0)).outerRadius(d => r(d.y1) - 1.5);

  const cor = d => {
    if (d.depth === 1) return d.leaves().some(f => f.data.coraa) ? COR.presente : COR.ausente;
    return d.data.coraa ? COR.destaque : COR.ausente;
  };

  const svg = novoSvg("#g01b", L, A);
  const g = svg.append("g").attr("transform", `translate(${RAIO + 20},${A / 2})`);

  g.selectAll("path").data(raiz.descendants().filter(d => d.depth > 0)).join("path")
    .attr("d", arco).attr("fill", cor).attr("stroke", "#fff").attr("stroke-width", 1)
    .on("mousemove", (e, d) => mostrar(e, `<strong>${d.data.name}</strong><br>` + (d.children
      ? `${d.children.length} subdialeto(s), ${d.leaves().filter(f => f.data.coraa).length} no CORAA`
      : d.data.coraa ? "No CORAA via " + d.data.coraa : "Sem registro no CORAA")))
    .on("mouseleave", esconder);

  // rotulos: radiais, so onde o arco tem espaco
  g.selectAll("text").data(raiz.descendants().filter(d => d.depth > 0 && (d.x1 - d.x0) * r(d.y1) > 11)).join("text")
    .attr("transform", d => {
      const ang = ((d.x0 + d.x1) / 2) * 180 / Math.PI;
      const rr = (r(d.y0) + r(d.y1)) / 2;
      return `rotate(${ang - 90}) translate(${rr},0) rotate(${ang < 180 ? 0 : 180})`;
    })
    .attr("dy", "0.35em").attr("text-anchor", "middle")
    .attr("font-size", d => (d.depth === 1 ? 10.5 : 10))
    .attr("font-weight", d => (cor(d) === COR.destaque ? "bold" : "normal"))
    .attr("fill", d => tintaSobre(cor(d)))
    .attr("pointer-events", "none")
    .text(d => {
      const max = d.depth === 1 ? 13 : 17;
      return d.data.name.length > max ? d.data.name.slice(0, max - 1) + "…" : d.data.name;
    });

  g.append("text").attr("text-anchor", "middle").attr("dy", "-0.2em").attr("font-size", 15)
    .attr("font-weight", "bold").attr("fill", COR.tinta).text("Brasil");
  g.append("text").attr("text-anchor", "middle").attr("dy", "1.2em").attr("font-size", 11)
    .attr("fill", COR.tinta).text("16 dialetos");
  g.append("text").attr("text-anchor", "middle").attr("dy", "2.5em").attr("font-size", 11)
    .attr("fill", COR.tinta).text("44 subdialetos");

  const lado = svg.append("g").attr("transform", `translate(${2 * RAIO + 70}, 220)`);
  lado.append("text").attr("font-size", 44).attr("font-weight", "bold").attr("fill", COR.tinta).text("4 de 44");
  lado.append("text").attr("y", 26).attr("font-size", 13).attr("fill", COR.tinta).text("subdialetos têm registro no CORAA");
  [[COR.destaque, "subdialeto com registro no CORAA"], [COR.presente, "dialeto com algum subdialeto registrado"],
   [COR.ausente, "sem nenhum registro"]].forEach(([c, t], i) => {
    const y = 70 + i * 24;
    lado.append("rect").attr("y", y - 11).attr("width", 14).attr("height", 14).attr("rx", 3).attr("fill", c);
    lado.append("text").attr("x", 22).attr("y", y).attr("font-size", 12.5).attr("fill", COR.tinta).text(t);
  });
});
