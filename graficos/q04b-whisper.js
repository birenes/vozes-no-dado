// QUE04, parte 2: separando sotaque e estilo, o erro do modelo muda com qual dos dois?
// Referencia D3: https://observablehq.com/@d3/horizontal-bar-chart/2
// Experimento proprio: Whisper large-v3, sem ajuste, no teste do CORAA (12.676 trechos).
// Barras horizontais, uma por combinacao de sotaque e estilo que existe no CORAA,
// ordenadas da maior para a menor. Comprimento = % de palavras erradas (WER).
// Cor da barra = sotaque (a mesma do Sankey e da QUE05). O intervalo de 95% fica no tooltip.
// Dados: dados/q04b_whisper_coraa.json (DTS12)

d3.json("dados/q04b_whisper_coraa.json").then(D => {
  const dados = Object.entries(D.sotaque_x_estilo)
    .map(([chave, d]) => {
      const [sotaque, estilo] = chave.split(" | ");
      return { ...d, sotaque, estilo, nome: `${sotaque}, fala ${estilo}` };
    })
    .sort((a, b) => d3.descending(a.wer, b.wer));

  const m = { top: 40, right: 60, bottom: 10, left: 260 }, PASSO = 40;
  const L = 900, A = m.top + dados.length * PASSO + m.bottom;
  const x = d3.scaleLinear().domain([0, 40]).range([m.left, L - m.right]);
  const y = d3.scaleBand().domain(dados.map(d => d.nome)).rangeRound([m.top, A - m.bottom]).padding(0.25);
  const svg = novoSvg("#g04b", L, A);

  svg.append("g").attr("transform", `translate(0,${m.top})`)
    .call(d3.axisTop(x).ticks(4).tickFormat(d => d + "%"))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone().attr("y2", A - m.top - m.bottom).attr("stroke-opacity", 0.1))
    .call(g => g.append("text").attr("x", L - m.right).attr("y", -24).attr("text-anchor", "end")
      .attr("fill", COR.tinta).text("% de palavras transcritas erradas (WER)"));

  svg.append("g").selectAll("rect").data(dados).join("rect")
    .attr("x", x(0)).attr("y", d => y(d.nome))
    .attr("width", d => x(d.wer) - x(0)).attr("height", y.bandwidth())
    .attr("fill", d => COR.sotaque[d.sotaque])
    .on("mousemove", (e, d) => mostrar(e, `<strong>${d.nome}</strong><br>erro: ${dec(d.wer)}%` +
      `<br>intervalo de 95%: ${dec(d.ic95[0])}% a ${dec(d.ic95[1])}%<br>${br(d.trechos)} trechos`))
    .on("mouseleave", esconder);

  svg.append("g").attr("font-size", 13).attr("font-weight", "bold").attr("fill", COR.tinta)
    .selectAll("text").data(dados).join("text")
    .attr("x", d => x(d.wer) + 6).attr("y", d => y(d.nome) + y.bandwidth() / 2).attr("dy", "0.35em")
    .text(d => dec(d.wer) + "%");

  svg.append("g").attr("transform", `translate(${m.left},0)`)
    .call(d3.axisLeft(y).tickSizeOuter(0))
    .call(g => g.selectAll("text").attr("font-size", 13).attr("fill", COR.tinta));
});
