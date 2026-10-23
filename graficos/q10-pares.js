// QUE10 (#g10e): o erro de cada grupo com e sem ele nos dados de treino, lado a lado.
// Substituiu o grafico de "% a mais", que confundia (um aumento de 234% parece impossivel). Aqui nao ha conta:
// cada grupo tem duas barras da mesma cor, a clara e o erro do modelo que NAO viu o grupo e a escura,
// o do modelo que viu. Azul-marinho = sotaque, carmim = fala atipica (as cores de sotaque e fala atipica do trabalho).
// Referencias D3: https://observablehq.com/@d3/grouped-bar-chart/2
//                 https://observablehq.com/@d3/horizontal-bar-chart/2
// Dados: dados/q03_wer_coraa.json (DTS07), dados/q07_fala_atipica.json (DTS09)

Promise.all([d3.json("dados/q03_wer_coraa.json"), d3.json("dados/q07_fala_atipica.json")])
  .then(([Q3, Q7]) => errosComESemTreino("#g10e", Q3, Q7));

function errosComESemTreino(seletor, Q3, Q7) {
  // o interior de SP fica de fora deste grafico (o do artigo e o do teste realizado): ele ja aparece
  // sozinho no grafico de linhas do teste e no ultimo grafico, das funcoes
  const sotaques = Q3.sotaque.filter(d => d.nome !== "Interior de SP").map(d => ({
    nome: d.nome === "Origem não declarada" ? "Origem não declarada (TEDx)" : d.nome, fora: d.sem, dentro: d.com,
    fonte: "Wav2Vec 2.0 XLSR-53 ajustado sem e com o CORAA (Candido Junior et al.)" }));
  // a fala autista em coreano (4 falantes) e a linha das linguas indigenas sem dado tambem sairam
  const atipica = Q7.euphonia.map(d => ({ nome: d.cat, fora: d.generico, dentro: d.personalizado,
    fonte: "modelo genérico (USM) e personalizado (Project Euphonia)" }));
  const blocos = [
    { titulo: "SOTAQUES (artigo do CORAA)", cor: COR.presente, linhas: sotaques },
    { titulo: "FALA ATÍPICA (Project Euphonia)", cor: COR.destaque, linhas: atipica },
  ];

  const L = 900, m = { top: 50, right: 150, left: 250 }, PASSO = 40, CAB = 32, BARRA = 14;
  const itens = [];
  let yAtual = m.top;
  blocos.forEach(b => {
    itens.push({ tipo: "cabecalho", texto: b.titulo, y: yAtual });
    yAtual += CAB;
    b.linhas.forEach((l, i) => { itens.push({ tipo: "grupo", ...l, cor: b.cor, primeiro: i === 0, y: yAtual }); yAtual += PASSO; });
  });
  const A = yAtual + 10;

  const x = d3.scaleLinear().domain([0, 60]).range([m.left, L - m.right]);
  const svg = novoSvg(seletor, L, A);
  const pct = v => dec(v, v < 10 ? 1 : 0) + "%";

  svg.append("g").attr("transform", `translate(0,${m.top - 6})`)
    .call(d3.axisTop(x).ticks(6).tickFormat(d => d + "%"))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick text").attr("fill", COR.tinta))
    .call(g => g.selectAll(".tick line").clone().attr("y2", A - m.top - 8).attr("stroke-opacity", 0.1))
    .call(g => g.append("text").attr("x", L - m.right).attr("y", -26).attr("text-anchor", "end")
      .attr("fill", COR.tinta).attr("font-size", 11.5).text("erro do modelo (palavras transcritas erradas)"));

  itens.filter(d => d.tipo === "cabecalho").forEach(d => svg.append("text").attr("x", 0).attr("y", d.y + 20)
    .attr("font-size", 12.5).attr("font-weight", "bold").attr("fill", COR.tinta).text(d.texto));

  const grupo = svg.append("g").selectAll("g").data(itens.filter(d => d.tipo === "grupo")).join("g")
    .attr("transform", d => `translate(0,${d.y})`)
    .on("mousemove", (e, d) => mostrar(e, `<strong>${d.nome}</strong><br>fora do treino: ${dec(d.fora, 2)}% de erro` +
      `<br>no treino: ${dec(d.dentro, 2)}% de erro<br><em>${d.fonte}</em>`))
    .on("mouseleave", esconder);
  grupo.append("text").attr("x", m.left - 12).attr("y", d => (d.sub ? PASSO / 2 - 6 : PASSO / 2)).attr("dy", "0.35em")
    .attr("text-anchor", "end").attr("font-size", 13).attr("fill", COR.tinta).text(d => d.nome);
  grupo.filter(d => d.sub).append("text").attr("x", m.left - 12).attr("y", PASSO / 2 + 10).attr("dy", "0.35em")
    .attr("text-anchor", "end").attr("font-size", 11).attr("fill", COR.tinta).text(d => d.sub);
  // barra clara: fora do treino; barra escura: no treino. No primeiro grupo de cada cor o rotulo diz qual e qual.
  [["fora", 4, 0.3, " fora do treino"], ["dentro", 4 + BARRA + 3, 1, " no treino"]].forEach(([chave, y0, opac, rotulo]) => {
    grupo.append("rect").attr("x", x(0)).attr("y", y0).attr("height", BARRA)
      .attr("width", d => x(d[chave]) - x(0)).attr("fill", d => d.cor).attr("fill-opacity", opac);
    grupo.append("text").attr("x", d => x(d[chave]) + 6).attr("y", y0 + BARRA / 2).attr("dy", "0.35em")
      .attr("font-size", 12).attr("font-weight", "bold").attr("fill", COR.tinta)
      .text(d => pct(d[chave]) + (d.primeiro ? rotulo : ""));
  });

}
