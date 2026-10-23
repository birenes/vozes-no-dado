// QUE10, so na apresentacao (#g10e): o erro de cada grupo sem e com ele nos dados de treino.
// No slide, substitui o grafico de "% a mais" (#g10b), que continua no site. Aqui nao ha conta:
// cada grupo e um haltere. A bola cinza e o erro do modelo que NAO viu o grupo, a bola colorida e o do
// modelo que viu (azul-marinho = sotaque, carmim = fala atipica) e a seta verde mostra quanto o erro caiu.
// Referencia D3: https://observablehq.com/@d3/dot-plot/2
// Dados: dados/q03_wer_coraa.json (DTS07), dados/q10_exclusao.json (DTS17),
//        dados/q07_fala_atipica.json (DTS09), dados/q10_conclusao.json (autismo_treino, DTS15)

Promise.all([
  d3.json("dados/q10_conclusao.json"), d3.json("dados/q03_wer_coraa.json"), d3.json("dados/q07_fala_atipica.json"),
  d3.json("dados/q10_exclusao.json"),
]).then(([C, Q3, Q7, E]) => errosComESemTreino("#g10e", C, Q3, Q7, E));

function errosComESemTreino(seletor, C, Q3, Q7, E) {
  const sotaques = Q3.sotaque.map(d => ({
    nome: d.nome === "Origem não declarada" ? "Origem não declarada (TEDx)" : d.nome, fora: d.sem, dentro: d.com,
    fonte: "modelo treinado sem e com o CORAA (Candido Junior et al.)" }));
  // o teste realizado entra logo abaixo do interior de SP do artigo, para comparar os dois
  sotaques.splice(1, 0, { nome: "Interior de SP (teste realizado)", fora: E.conclusao.sp_interior_sem,
    dentro: E.conclusao.sp_interior_com, fonte: "Whisper-small com 0 h e com 1 h do interior de SP no treino" });
  const atipica = [
    ...Q7.euphonia.map(d => ({ nome: d.cat, fora: d.generico, dentro: d.personalizado,
      fonte: "modelo genérico e personalizado (Project Euphonia)" })),
    { nome: "Pessoas autistas (coreano)", sub: "erro por caractere", fora: C.autismo_treino.fora,
      dentro: C.autismo_treino.dentro, fonte: "Whisper-small sem e com a fala autista no treino (Park e Lee, 2025; 4 falantes)" },
  ];
  const blocos = [
    { titulo: "SOTAQUES (artigo do CORAA e teste realizado)", cor: COR.presente, linhas: sotaques },
    { titulo: "FALA ATÍPICA (Project Euphonia e Park e Lee, 2025)", cor: COR.destaque, linhas: atipica },
  ];

  const L = 900, m = { top: 50, right: 150, left: 250 }, PASSO = 44, CAB = 30, R = 6;
  const itens = [];
  let yAtual = m.top;
  blocos.forEach(b => {
    itens.push({ tipo: "cabecalho", texto: b.titulo, y: yAtual });
    yAtual += CAB;
    b.linhas.forEach(l => { itens.push({ tipo: "grupo", ...l, cor: b.cor, y: yAtual }); yAtual += PASSO; });
  });
  itens.push({ tipo: "semdado", nome: "Línguas indígenas do Brasil", y: yAtual + 4 });
  const A = yAtual + PASSO + 46;

  const x = d3.scaleLinear().domain([0, 60]).range([m.left, L - m.right]);
  const svg = novoSvg(seletor, L, A);
  const listras = definirHachura(svg, "hachura-g10e");
  svg.append("defs").append("marker").attr("id", "seta-g10e").attr("viewBox", "0 0 10 10").attr("refX", 9).attr("refY", 5)
    .attr("markerUnits", "userSpaceOnUse").attr("markerWidth", 8).attr("markerHeight", 8).attr("orient", "auto-start-reverse")
    .append("path").attr("d", "M0,0 L10,5 L0,10 z").attr("fill", COR.melhora);
  const pct = v => dec(v, v < 10 ? 1 : 0) + "%";

  svg.append("g").attr("transform", `translate(0,${m.top - 6})`)
    .call(d3.axisTop(x).ticks(6).tickFormat(d => d + "%"))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick text").attr("fill", COR.tinta))
    .call(g => g.selectAll(".tick line").clone().attr("y2", A - m.top - 40).attr("stroke-opacity", 0.1))
    .call(g => g.append("text").attr("x", L - m.right).attr("y", -26).attr("text-anchor", "end")
      .attr("fill", COR.tinta).attr("font-size", 11.5).text("erro do modelo (palavras transcritas erradas)"));

  itens.filter(d => d.tipo === "cabecalho").forEach(d => svg.append("text").attr("x", 0).attr("y", d.y + 20)
    .attr("font-size", 12.5).attr("font-weight", "bold").attr("fill", COR.tinta).text(d.texto));

  const meio = PASSO / 2;
  const grupo = svg.append("g").selectAll("g").data(itens.filter(d => d.tipo === "grupo")).join("g")
    .attr("transform", d => `translate(0,${d.y})`)
    .on("mousemove", (e, d) => mostrar(e, `<strong>${d.nome}</strong><br>sem o grupo no treino: ${dec(d.fora, 2)}% de erro` +
      `<br>com o grupo no treino: ${dec(d.dentro, 2)}% de erro<br><em>${d.fonte}</em>`))
    .on("mouseleave", esconder);
  grupo.append("rect").attr("width", L).attr("height", PASSO).attr("fill", "transparent");
  grupo.append("text").attr("x", m.left - 12).attr("y", d => (d.sub ? meio - 6 : meio)).attr("dy", "0.35em")
    .attr("text-anchor", "end").attr("font-size", 13).attr("fill", COR.tinta).text(d => d.nome);
  grupo.filter(d => d.sub).append("text").attr("x", m.left - 12).attr("y", meio + 10).attr("dy", "0.35em")
    .attr("text-anchor", "end").attr("font-size", 11).attr("fill", COR.tinta).text(d => d.sub);
  // seta da borda da bola cinza (sem o grupo) ate a borda da bola colorida (com o grupo)
  grupo.append("path").attr("d", d => {
    const dir = Math.sign(d.dentro - d.fora);
    return `M${x(d.fora) + dir * (R + 1)},${meio}L${x(d.dentro) - dir * (R + 2)},${meio}`;
  }).attr("stroke", COR.melhora).attr("stroke-width", 2).attr("marker-end", "url(#seta-g10e)");
  grupo.append("circle").attr("cx", d => x(d.fora)).attr("cy", meio).attr("r", R).attr("fill", COR.ausente);
  grupo.append("circle").attr("cx", d => x(d.dentro)).attr("cy", meio).attr("r", R).attr("fill", d => d.cor);
  // o valor de cada bola: o de cima e o sem o grupo, o de baixo e o com o grupo
  grupo.append("text").attr("x", d => x(d.fora)).attr("y", meio - 13).attr("text-anchor", "middle")
    .attr("font-size", 11).attr("fill", COR.tinta).text(d => pct(d.fora));
  grupo.append("text").attr("x", d => x(d.dentro)).attr("y", meio + 19).attr("text-anchor", "middle")
    .attr("font-size", 11).attr("font-weight", "bold").attr("fill", COR.tinta).text(d => pct(d.dentro));
  grupo.append("text").attr("x", d => x(Math.max(d.fora, d.dentro)) + 16).attr("y", meio).attr("dy", "0.35em")
    .attr("font-size", 12.5).attr("font-weight", "bold").attr("fill", COR.melhora)
    .text(d => `▼ caiu ${dec(d.fora - d.dentro)} p.p.`);

  const sem = itens.find(d => d.tipo === "semdado");
  svg.append("text").attr("x", m.left - 12).attr("y", sem.y + 16).attr("dy", "0.35em").attr("text-anchor", "end")
    .attr("font-size", 13).attr("fill", COR.tinta).text(sem.nome);
  svg.append("rect").attr("x", x(0)).attr("y", sem.y + 2).attr("width", x(60) - x(0)).attr("height", 28).attr("fill", listras);
  svg.append("text").attr("x", x(0) + 10).attr("y", sem.y + 16).attr("dy", "0.35em")
    .attr("font-size", 12.5).attr("font-weight", "bold").attr("fill", COR.tinta).text("sem nenhum dado: não dá nem para medir");

  // legenda embaixo: cinza = sem o grupo; cores = com o grupo
  const leg = svg.append("g").attr("transform", `translate(${m.left},${A - 14})`);
  [[COR.ausente, "sem o grupo no treino"], [COR.presente, "com o grupo: sotaque"], [COR.destaque, "com o grupo: fala atípica"]]
    .forEach(([c, t], i) => {
      leg.append("circle").attr("cx", i * 190 + 6).attr("r", R).attr("fill", c);
      leg.append("text").attr("x", i * 190 + 18).attr("dy", "0.35em").attr("font-size", 12).attr("fill", COR.tinta).text(t);
    });
}
