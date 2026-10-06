// QUE08: quanto dado aberto de fala atipica existe por idioma, e em portugues brasileiro?
// Referencia D3: https://observablehq.com/@d3/grouped-bar-chart/2 + https://observablehq.com/@d3/horizontal-bar-chart/2
// Barras horizontais agrupadas por idioma: uma barra por corpus, com comprimento =
// pessoas COM a condicao gravadas (sem contar o grupo de controle, para comparar
// de forma justa). Escala linear comecando no zero, como toda barra deve ser.
// Cor = tipo de condicao. Corpus que nao informa quantas pessoas gravou (SEP-28k) fica de fora.
// Dados: dados/q08_catalogo.json (DTS10; DAT22 a DAT27)

d3.json("dados/q08_catalogo.json").then(CAT => {
  const ORDEM = ["inglês", "italiano", "espanhol", "coreano", "português europeu", "português brasileiro"];
  const TIPO = c => {
    const t = c.condicao.toLowerCase();
    if (t.includes("gagueira")) return "Gagueira";
    if (t.includes("autismo")) return "Autismo";
    if (t.includes("respirat")) return "Insuficiência respiratória";
    if (t === "parkinson") return "Parkinson";          // so Parkinson; corpus com varias condicoes vai para o grupo azul
    return "Disartria e doenças neuromotoras";
  };
  const COR_TIPO = {
    "Disartria e doenças neuromotoras": "#0E0E76",
    "Parkinson": "#8C0073",
    "Gagueira": "#F76D4D",
    "Autismo": "#D02560",
    "Insuficiência respiratória": "#FFB449",
  };

  const linhas = [];
  ORDEM.forEach(idioma => {
    linhas.push({ cabecalho: idioma });
    CAT.filter(c => c.idioma === idioma)
      .map(c => ({ ...c, n: +c.falantes_com_condicao || 0, tipo: TIPO(c) }))
      .filter(c => c.n > 0)
      .sort((a, b) => b.n - a.n)
      .forEach(c => linhas.push(c));
  });

  const PASSO = 28, m = { top: 46, left: 230, right: 250 };
  const L = 960, A = m.top + linhas.length * PASSO + 20;
  const x = d3.scaleLinear().domain([0, 1400]).range([m.left, L - m.right]);
  const svg = novoSvg("#g08", L, A);

  svg.append("g").selectAll("line").data(x.ticks(7)).join("line")
    .attr("x1", d => x(d)).attr("x2", d => x(d)).attr("y1", m.top - 8).attr("y2", A - 20).attr("stroke", COR.grade);
  svg.append("g").selectAll("text").data(x.ticks(7)).join("text")
    .attr("x", d => x(d)).attr("y", m.top - 14).attr("text-anchor", "middle").attr("font-size", 11).attr("fill", COR.tinta)
    .text(d => br(d));
  svg.append("text").attr("x", m.left).attr("y", 14).attr("font-size", 11.5).attr("fill", COR.tinta)
    .text("pessoas com fala atípica gravadas (sem contar o grupo de controle)");

  linhas.forEach((d, i) => {
    const y = m.top + i * PASSO + PASSO / 2;
    if (d.cabecalho) {
      svg.append("text").attr("x", 0).attr("y", y + 4).attr("font-size", 13).attr("font-weight", "bold")
        .attr("fill", COR.tinta).text(d.cabecalho.toUpperCase());
      return;
    }
    const g = svg.append("g")
      .on("mousemove", e => mostrar(e, `<strong>${d.corpus}</strong><br>${d.condicao}<br>` +
        `${br(d.n)} pessoas com a condição` +
        (d.falantes_total && d.falantes_total !== String(d.n) ? ` (de ${br(+d.falantes_total)} no total)` : "") +
        (d.horas ? `<br>${dec(+d.horas)} h de áudio` : "") + `<br>acesso: ${d.acesso}<br><em>${d.fonte}</em>`))
      .on("mouseleave", esconder);
    g.append("rect").attr("y", y - PASSO / 2).attr("width", L).attr("height", PASSO).attr("fill", "transparent");
    g.append("text").attr("x", 16).attr("y", y).attr("dy", "0.35em").attr("font-size", 12.5).attr("fill", COR.tinta).text(d.corpus);
    g.append("rect").attr("x", x(0)).attr("y", y - 8).attr("width", x(d.n) - x(0)).attr("height", 16).attr("rx", 2)
      .attr("fill", COR_TIPO[d.tipo]);
    g.append("text").attr("x", x(d.n) + 6).attr("y", y).attr("dy", "0.35em").attr("font-size", 11.5)
      .attr("font-weight", "bold").attr("fill", COR.tinta).text(br(d.n));
  });

  // legenda e conclusao
  const leg = svg.append("g").attr("transform", `translate(${L - m.right + 30}, ${m.top})`);
  leg.append("text").attr("font-size", 12).attr("font-weight", "bold").attr("fill", COR.tinta).text("Condição");
  Object.entries(COR_TIPO).forEach(([t, c], i) => {
    leg.append("rect").attr("y", 12 + i * 22).attr("width", 14).attr("height", 14).attr("rx", 2).attr("fill", c);
    leg.append("text").attr("x", 20).attr("y", 23 + i * 22).attr("font-size", 12).attr("fill", COR.tinta).text(t);
  });
  leg.append("text").attr("y", 162).attr("font-size", 12.5).attr("font-weight", "bold").attr("fill", COR.tinta)
    .call(t => ["Em português brasileiro, o único", "corpus encontrado é de COVID.", "Nenhum de disartria, Parkinson,", "gagueira ou autismo."]
      .forEach((s, i) => t.append("tspan").attr("x", 0).attr("dy", i ? 17 : 0).text(s)));
});
