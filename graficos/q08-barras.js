// QUE08: quanto dado aberto de fala atipica existe por idioma, e em portugues brasileiro?
// Referencia D3: https://observablehq.com/@d3/grouped-bar-chart/2 + https://observablehq.com/@d3/horizontal-bar-chart/2
// Barras horizontais agrupadas por idioma: uma barra por corpus, com comprimento = horas de audio
// de fala atipica (antes era o numero de pessoas). Escala linear comecando no zero, como toda barra
// deve ser. Cor = tipo de condicao.
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

  // A medida e horas de audio. Quando o corpus nao informa as horas, entra uma aproximacao (marcada com ~): TORGO pelos artigos que usam a base (6 a 7,3 h de fala com disartria);
  // EasyCall pelas 21.386 gravacoes curtas de comandos; NeuroVoz pelas 2.903 gravacoes curtas; SPIRA pelo
  // registro no Zenodo (cerca de 1 h). FraLusoPark nao tem base para estimar e sai, junto com o portugues
  // europeu, que so tinha ele. O SEP-28k continua de fora, como no site.
  const HORAS = true;   // false volta para o numero de pessoas
  const APROX = { "TORGO": 7, "EasyCall": 5, "NeuroVoz": 3, "SPIRA": 1 };
  const medida = c => (HORAS ? +c.horas || APROX[c.corpus] || 0 : +c.falantes_com_condicao || 0);
  const horas = v => (v >= 100 ? br(v) : dec(v, Number.isInteger(v) ? 0 : 1)) + " h";
  const linhas = [];
  ORDEM.forEach(idioma => {
    const corpora = CAT.filter(c => c.idioma === idioma && !(HORAS && c.corpus === "SEP-28k"))
      .map(c => ({ ...c, n: medida(c), aprox: HORAS && !+c.horas && c.corpus in APROX, tipo: TIPO(c) }))
      .filter(c => c.n > 0)
      .sort((a, b) => b.n - a.n);
    if (corpora.length) linhas.push({ cabecalho: idioma }, ...corpora);   // idioma sem nenhum corpus nao aparece
  });

  const PASSO = 28, m = { top: 46, left: 230, right: 250 };
  const L = 960, A = m.top + linhas.length * PASSO + 20;
  // em horas, o Project Euphonia chega a 1.400: a escala vai um pouco alem para o rotulo nao encostar na legenda
  const x = d3.scaleLinear().domain([0, HORAS ? 1600 : 1400]).range([m.left, L - m.right]);
  const svg = novoSvg("#g08", L, A);

  svg.append("g").selectAll("line").data(x.ticks(7)).join("line")
    .attr("x1", d => x(d)).attr("x2", d => x(d)).attr("y1", m.top - 8).attr("y2", A - 20).attr("stroke", COR.grade);
  svg.append("g").selectAll("text").data(x.ticks(7)).join("text")
    .attr("x", d => x(d)).attr("y", m.top - 14).attr("text-anchor", "middle").attr("font-size", 11).attr("fill", COR.tinta)
    .text(d => br(d));
  svg.append("text").attr("x", m.left).attr("y", 14).attr("font-size", 11.5).attr("fill", COR.tinta)
    .text(HORAS ? "horas de fala atípica gravadas (~ = aproximado)"
      : "pessoas com fala atípica gravadas (sem contar o grupo de controle)");

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
      .attr("font-weight", "bold").attr("fill", COR.tinta)
      .text(!HORAS ? br(d.n) : d.n ? (d.aprox ? "~" : "") + horas(d.n) : "horas não informadas");
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
