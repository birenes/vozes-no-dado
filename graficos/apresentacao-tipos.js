// So na apresentacao: outros tipos de grafico, para nao ficar tudo em barras.
//  #g10l  teste realizado em linhas (no lugar das barras agrupadas #g10d): o erro no interior de SP
//         e nos outros sotaques conforme entram 0, 0,5 e 1 h do interior de SP no treino
//  #g06d  genero em duas roscas (no lugar das barras empilhadas #g06a): Common Voice e populacao do Brasil
// No site e na planilha continuam as barras.
// Referencias D3: https://observablehq.com/@d3/multi-line-chart/2
//                 https://observablehq.com/@d3/donut-chart/2
// Dados: dados/q10_exclusao.json (DTS17), dados/q06_genero_idade.json (DTS02, DTS13)

Promise.all([d3.json("dados/q10_exclusao.json"), d3.json("dados/q06_genero_idade.json")]).then(([E, G]) => {
  linhasTeste("#g10l", E);
  roscasGenero("#g06d", G);
});

function linhasTeste(seletor, E) {
  const L = 900, A = 430, m = { top: 50, right: 190, bottom: 64, left: 60 };
  const horas = [0, 0.5, 1];
  const rotuloHoras = h => (h === 0.5 ? "0,5 h" : `${h} h`);
  const x = d3.scalePoint().domain(horas).range([m.left + 50, L - m.right - 30]);
  const y = d3.scaleLinear().domain([0, 50]).range([A - m.bottom, m.top]);
  // lado: o valor da linha de cima vai acima do ponto e o da de baixo, abaixo (no 1 h as duas quase se encostam)
  const series = [
    { nome: "Interior de SP", chave: "sp_interior", cor: COR.destaque, lado: -1 },
    { nome: "Outros sotaques", chave: "outros_sotaques", cor: COR.presente, lado: 1 },
  ].map(s => ({ ...s, pontos: horas.map(h => ({ h, wer: E.dose.find(d => d.horas_interior_sp === h)[s.chave].wer })) }));
  const svg = novoSvg(seletor, L, A);

  svg.append("g").attr("transform", `translate(${m.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick text").attr("fill", COR.tinta))
    .call(g => g.selectAll(".tick line").clone().attr("x2", L - m.left - m.right).attr("stroke-opacity", 0.1))
    .call(g => g.append("text").attr("x", -m.left).attr("y", m.top - 26).attr("text-anchor", "start")
      .attr("fill", COR.tinta).attr("font-size", 12).text("palavras transcritas erradas (WER)"));
  svg.append("g").attr("transform", `translate(0,${A - m.bottom})`)
    .call(d3.axisBottom(x).tickFormat(rotuloHoras).tickSizeOuter(0))
    .call(g => g.selectAll(".tick text").attr("fill", COR.tinta).attr("font-size", 13))
    .call(g => g.append("text").attr("x", (m.left + L - m.right) / 2).attr("y", 46).attr("text-anchor", "middle")
      .attr("fill", COR.tinta).attr("font-size", 12).text("horas de fala do interior de SP no treino"));

  const linha = d3.line().x(p => x(p.h)).y(p => y(p.wer));
  const s = svg.append("g").selectAll("g").data(series).join("g");
  s.append("path").attr("d", d => linha(d.pontos)).attr("fill", "none").attr("stroke", d => d.cor).attr("stroke-width", 3);
  const pontos = s.selectAll("g").data(d => d.pontos.map(p => ({ ...p, cor: d.cor, lado: d.lado, nome: d.nome }))).join("g")
    .attr("transform", p => `translate(${x(p.h)},${y(p.wer)})`)
    .on("mousemove", (e, p) => mostrar(e, `<strong>${p.nome}</strong><br>${rotuloHoras(p.h)} do interior de SP no treino: ${dec(p.wer)}%`))
    .on("mouseleave", esconder);
  pontos.append("circle").attr("r", 6).attr("fill", p => p.cor);
  pontos.append("text").attr("y", p => (p.lado < 0 ? -14 : 24)).attr("text-anchor", "middle")
    .attr("font-size", 13).attr("font-weight", "bold").attr("fill", COR.tinta).text(p => dec(p.wer) + "%");
  // o nome de cada linha fica na ponta direita, afastado para cima ou para baixo
  s.append("text").attr("x", x(1) + 50).attr("y", d => y(d.pontos[2].wer) + d.lado * 12).attr("dy", "0.35em")
    .attr("font-size", 13.5).attr("font-weight", "bold").attr("fill", COR.tinta).text(d => d.nome);
}

function roscasGenero(seletor, G) {
  const homens = G.genero.find(d => d.cat === "Masculino").falantes, mulheres = G.genero.find(d => d.cat === "Feminino").falantes;
  const roscas = [
    { titulo: "Falantes do Common Voice", sub: "entre quem declarou o gênero", homens: homens / (homens + mulheres) },
    { titulo: "População do Brasil", sub: "Censo 2022", homens: G.censo.homens / (G.censo.homens + G.censo.mulheres) },
  ];
  const L = 900, R = 140, r = 82, A = 70 + 2 * R + 70;
  const svg = novoSvg(seletor, L, A);
  const pizza = d3.pie().sort(null).value(d => d.v);
  const arco = d3.arc().innerRadius(r).outerRadius(R);
  const cores = { homens: COR.presente, mulheres: COR.destaque };
  const nomes = { homens: "Homens", mulheres: "Mulheres" };

  roscas.forEach((ro, i) => {
    const g = svg.append("g").attr("transform", `translate(${L / 4 + i * L / 2},${60 + R})`);
    const fatias = pizza([{ k: "homens", v: ro.homens }, { k: "mulheres", v: 1 - ro.homens }]);
    g.selectAll("path").data(fatias).join("path").attr("d", arco).attr("fill", d => cores[d.data.k])
      .attr("stroke", "#ffffff").attr("stroke-width", 2)
      .on("mousemove", (e, d) => mostrar(e, `<strong>${ro.titulo}</strong><br>${nomes[d.data.k]}: ${dec(100 * d.data.v)}%`))
      .on("mouseleave", esconder);
    // a porcentagem dentro de cada fatia, em branco (as duas cores sao escuras)
    g.selectAll("text.fatia").data(fatias).join("text").attr("class", "fatia")
      .attr("transform", d => `translate(${arco.centroid(d)})`).attr("text-anchor", "middle").attr("dy", "0.35em")
      .attr("font-size", 14).attr("font-weight", "bold").attr("fill", "#ffffff").text(d => dec(100 * d.data.v) + "%");
    // no meio, a parte das mulheres, que e o que a pergunta quer ver
    g.append("text").attr("text-anchor", "middle").attr("y", -2).attr("font-size", 30).attr("font-weight", "bold")
      .attr("fill", COR.tinta).text(dec(100 * (1 - ro.homens)) + "%");
    g.append("text").attr("text-anchor", "middle").attr("y", 22).attr("font-size", 13).attr("fill", COR.tinta).text("são mulheres");
    g.append("text").attr("text-anchor", "middle").attr("y", R + 30).attr("font-size", 15).attr("font-weight", "bold")
      .attr("fill", COR.tinta).text(ro.titulo);
    g.append("text").attr("text-anchor", "middle").attr("y", R + 50).attr("font-size", 12).attr("fill", COR.tinta).text(ro.sub);
  });

  const leg = svg.append("g").attr("transform", `translate(${L / 2 - 100},20)`);
  [[COR.presente, "Homens"], [COR.destaque, "Mulheres"]].forEach(([c, t], i) => {
    leg.append("rect").attr("x", i * 120).attr("y", -7).attr("width", 14).attr("height", 14).attr("fill", c);
    leg.append("text").attr("x", i * 120 + 20).attr("dy", "0.35em").attr("font-size", 13).attr("fill", COR.tinta).text(t);
  });
}
