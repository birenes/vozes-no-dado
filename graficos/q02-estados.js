// QUE02: quanta fala catalogada existe em cada estado, comparada a populacao?
// Referencia D3: https://observablehq.com/@d3/bubble-map/2 + https://observablehq.com/@d3/collision-detection/2
// Correcoes 3 e 4 do professor: explorar forma e cor.
//  - FORMA: um circulo por estado, com area = populacao (mostra quantas PESSOAS ficam de fora).
//    O modo "mapa em blocos" saiu (versao antiga em _descartados/q02-estados-com-grade.js).
//  - COR: segmentos por milhao de habitantes em 3 faixas, nas cores da bandeira (amarelo = pouco,
//    verde = medio, azul = muito); estado sem nenhum segmento recebe hachura cinza (difere pela
//    textura, nao so pela cor).
//  - LEGENDA: uma tabela em porcentagem com a parte de cada estado na fala do CORAA e na populacao.
// Dados: dados/q02_estados.json (DTS01, DTS04, DTS05; DAT12, DAT13, DAT14, DAT15)

d3.json("dados/q02_estados.json").then(ESTADOS => {
  const L = 900, A = 640, MAPA = 620;   // a parte direita fica para a legenda

  // as cores da bandeira: amarelo, verde e azul
  const rampa = ["#FFDF00", "#009C3B", "#002776"];
  const faixas = [
    { min: 0, max: 1000, cor: rampa[0], rotulo: "até 1.000 por milhão de habitantes" },
    { min: 1000, max: 10000, cor: rampa[1], rotulo: "de 1.000 a 10.000" },
    { min: 10000, max: Infinity, cor: rampa[2], rotulo: "mais de 10.000" },
  ];
  const porMilhao = d => (1e6 * d.segmentos) / d.populacao;

  const svg = novoSvg("#g02", L, A);
  const HACHURA = definirHachura(svg, "hachura-q02");
  const corDe = d => (d.segmentos === 0 ? HACHURA
    : faixas.find(f => porMilhao(d) >= f.min && porMilhao(d) < f.max).cor);

  // centro de cada estado, com os circulos afastados para nao sobrepor
  const proj = d3.geoMercator().fitExtent([[50, 40], [MAPA - 50, A - 40]],
    { type: "MultiPoint", coordinates: ESTADOS.map(d => [d.lon, d.lat]) });
  const raio = d3.scaleSqrt().domain([0, d3.max(ESTADOS, d => d.populacao)]).range([0, 72]);
  const nos = ESTADOS.map(d => { const [x, y] = proj([d.lon, d.lat]); return { ...d, x, y, x0: x, y0: y, r: raio(d.populacao) }; });
  d3.forceSimulation(nos)
    .force("x", d3.forceX(d => d.x0).strength(0.4))
    .force("y", d3.forceY(d => d.y0).strength(0.4))
    .force("colisao", d3.forceCollide(d => d.r + 2).iterations(3))
    .stop().tick(300);

  const g = svg.selectAll("g.estado").data(nos).join("g").attr("class", "estado")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .on("mousemove", (e, d) => mostrar(e, `<strong>${d.nome}</strong><br>${br(d.populacao)} habitantes<br>` +
      (d.segmentos ? `${br(d.segmentos)} segmentos no CORAA<br>${br(porMilhao(d))} por milhão` : "Nenhum segmento no CORAA")))
    .on("mouseleave", esconder);
  g.append("circle").attr("r", d => d.r).attr("fill", corDe)
    .attr("stroke", d => (d.segmentos ? "none" : COR.ausenteEscuro)).attr("stroke-width", 1);
  g.append("text").attr("text-anchor", "middle").attr("dy", "0.35em").attr("font-weight", "bold")
    .attr("font-size", d => Math.max(9, Math.min(15, d.r / 2.2)))
    // o amarelo da bandeira e claro para o olho mas "medio" no HSL: aqui a sigla segue a luminosidade percebida (Lab)
    .attr("fill", d => (!d.segmentos ? COR.tinta : d3.lab(corDe(d)).l > 60 ? COR.tinta : "#ffffff"))
    .attr("paint-order", "stroke").attr("stroke", d => (d.segmentos ? "none" : "#ffffff")).attr("stroke-width", 3)
    .text(d => d.uf);

  // legenda e resumo
  const sem = ESTADOS.filter(d => d.segmentos === 0);
  const leg = svg.append("g").attr("transform", `translate(${MAPA + 20}, 90)`);
  leg.append("text").attr("font-size", 40).attr("font-weight", "bold").attr("fill", COR.tinta)
    .text(`${dec(d3.sum(sem, d => d.populacao) / 1e6, 0)} milhões`);
  leg.append("text").attr("y", 26).attr("font-size", 13).attr("fill", COR.tinta)
    .text(`de pessoas nos ${sem.length} estados sem registro`);
  // a legenda e uma tabelinha em porcentagem: a parte de cada estado na fala do CORAA e na populacao
  // do Brasil (azul: muito mais fala do que populacao; verde: parecido; amarelo: menos fala; listrado: nenhuma)
  {
    const popTotal = d3.sum(ESTADOS, d => d.populacao), falaTotal = d3.sum(ESTADOS, d => d.segmentos);
    const pct = v => (v === 0 ? "0%" : dec(v, v < 10 ? 1 : 0) + "%");
    const linhas = [
      ...ESTADOS.filter(d => d.segmentos > 0).sort((a, b) => d3.descending(a.segmentos, b.segmentos))
        .map(d => ({ cor: corDe(d), nome: d.uf, fala: 100 * d.segmentos / falaTotal, pop: 100 * d.populacao / popTotal })),
      { cor: HACHURA, nome: `outros ${sem.length}`, fala: 0, pop: 100 * d3.sum(sem, d => d.populacao) / popTotal },
    ];
    const COL_FALA = 152, COL_POP = 258;
    [[COL_FALA, "fala"], [COL_POP, "população"]].forEach(([x, t]) => leg.append("text").attr("x", x)
      .attr("y", 64).attr("text-anchor", "end").attr("font-size", 12).attr("font-weight", "bold").attr("fill", COR.tinta).text(t));
    linhas.forEach((l, i) => {
      const y = 92 + i * 30;
      leg.append("rect").attr("y", y - 13).attr("width", 16).attr("height", 16).attr("rx", 3)
        .attr("fill", l.cor).attr("stroke", l.fala ? "none" : COR.ausenteEscuro);
      leg.append("text").attr("x", 24).attr("y", y).attr("font-size", 13).attr("font-weight", "bold").attr("fill", COR.tinta).text(l.nome);
      leg.append("text").attr("x", COL_FALA).attr("y", y).attr("text-anchor", "end").attr("font-size", 13).attr("fill", COR.tinta).text(pct(l.fala));
      leg.append("text").attr("x", COL_POP).attr("y", y).attr("text-anchor", "end").attr("font-size", 13).attr("fill", COR.tinta).text(pct(l.pop));
    });
    leg.append("text").attr("y", 92 + linhas.length * 30 + 6).attr("font-size", 11).attr("fill", COR.tinta)
      .text("fala = trechos com estado conhecido no CORAA");
  }
});
