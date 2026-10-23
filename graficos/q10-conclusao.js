// QUE10 (conclusao): quem fica de fora, quanto isso custa e o que muda na pratica.
// Este arquivo desenha dois dos quatro graficos:
//  #g10a  quantas pessoas ficam de fora dos dados (barras horizontais)
//  #g10c  o erro em cada funcao dos modelos, para quem esta dentro e quem fica de fora (barras agrupadas)
// Os outros dois: #g10e, o erro com e sem o grupo no treino (q10-pares.js), e #g10l, o teste realizado
// em linhas (q06-q10-rosca-linhas.js).
// Referencias D3: https://observablehq.com/@d3/horizontal-bar-chart/2
//                 https://observablehq.com/@d3/grouped-bar-chart/2
// Dados: dados/q10_conclusao.json

d3.json("dados/q10_conclusao.json").then(C => {
  // no lugar do autismo entra a estimativa aproximada de fala atipica
  // (autismo + gagueira cronica + Parkinson, ver q10_conclusao.json)
  pessoasDeFora("#g10a", C.pessoas.map(p => (p.grupo.includes("autismo")
    ? { grupo: "Pessoas com fala atípica (estimativa)", pessoas: C.fala_atipica_estimativa.pessoas } : p)));
  errosPorFuncao("#g10c", C.funcoes);
});

// ---- #g10a: os grupos se sobrepoem (uma mulher de 60 anos em Goias entra em tres barras),
// por isso o grafico mostra cada lacuna sozinha e nunca soma
function pessoasDeFora(seletor, dados) {
  const m = { top: 40, right: 110, bottom: 10, left: 320 }, PASSO = 40;
  const L = 900, A = m.top + dados.length * PASSO + m.bottom;
  const x = d3.scaleLinear().domain([0, 140e6]).range([m.left, L - m.right]);
  const y = d3.scaleBand().domain(dados.map(d => d.grupo)).rangeRound([m.top, A - m.bottom]).padding(0.25);
  const svg = novoSvg(seletor, L, A);
  const milhoes = n => (n >= 1e6 ? `${dec(n / 1e6)} milhões` : `${dec(n / 1e3)} mil`);

  svg.append("g").attr("transform", `translate(0,${m.top})`)
    .call(d3.axisTop(x).ticks(7).tickFormat(d => (d ? d / 1e6 + " mi" : "0")))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick text").attr("fill", COR.tinta))
    .call(g => g.selectAll(".tick line").clone().attr("y2", A - m.top - m.bottom).attr("stroke-opacity", 0.1))
    .call(g => g.append("text").attr("x", L - m.right).attr("y", -24).attr("text-anchor", "end")
      .attr("fill", COR.tinta).attr("font-size", 11.5)
      .text("pessoas no Brasil (Censo 2022 e estimativas)"));

  svg.append("g").selectAll("rect").data(dados).join("rect")
    .attr("x", x(0)).attr("y", d => y(d.grupo))
    .attr("width", d => Math.max(2, x(d.pessoas) - x(0))).attr("height", y.bandwidth())
    .attr("fill", COR.destaque)
    .on("mousemove", (e, d) => mostrar(e, `<strong>${d.grupo}</strong><br>${br(d.pessoas)} pessoas`))
    .on("mouseleave", esconder);
  svg.append("g").selectAll("text").data(dados).join("text")
    .attr("x", d => Math.max(x(0) + 2, x(d.pessoas)) + 6).attr("y", d => y(d.grupo) + y.bandwidth() / 2).attr("dy", "0.35em")
    .attr("font-size", 12.5).attr("font-weight", "bold").attr("fill", COR.tinta).text(d => milhoes(d.pessoas));

  svg.append("g").attr("transform", `translate(${m.left},0)`)
    .call(d3.axisLeft(y).tickSizeOuter(0))
    .call(g => g.selectAll("text").attr("font-size", 13).attr("fill", COR.tinta));
}

// ---- #g10c: em cada funcao, o erro para a fala presente nos dados de treino e para a fala
// ausente ou rara neles (criancas, gagueira grave, um sotaque que o modelo nao ouviu)
function errosPorFuncao(seletor, funcoes) {
  const DENTRO = COR.presente, FORA = COR.destaque;
  const L = 900, A = 420, m = { top: 50, right: 20, bottom: 70, left: 50 };
  const x0 = d3.scaleBand().domain(funcoes.map(f => f.funcao)).rangeRound([m.left, L - m.right]).paddingInner(0.3);
  const x1 = d3.scaleBand().domain(["dentro", "fora"]).rangeRound([0, x0.bandwidth()]).padding(0.08);
  const y = d3.scaleLinear().domain([0, 65]).range([A - m.bottom, m.top]);
  const svg = novoSvg(seletor, L, A);

  svg.append("g").attr("transform", `translate(${m.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickFormat(d => d + "%"))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick text").attr("fill", COR.tinta))
    .call(g => g.selectAll(".tick line").clone().attr("x2", L - m.left - m.right).attr("stroke-opacity", 0.1))
    .call(g => g.append("text").attr("x", -m.left).attr("y", m.top - 30).attr("text-anchor", "start")
      .attr("fill", COR.tinta).attr("font-size", 12).text("palavras transcritas erradas (WER)"));

  const barras = funcoes.flatMap(f => ["dentro", "fora"].map(lado => ({ f, lado, ...f[lado] })));
  const g = svg.append("g").selectAll("g").data(barras).join("g")
    .attr("transform", d => `translate(${x0(d.f.funcao) + x1(d.lado)},0)`)
    .on("mousemove", (e, d) => mostrar(e, `<strong>${d.f.funcao}</strong><br>${d.grupo}: ${dec(d.wer, 2)}% de erro<br><em>${d.f.detalhe}</em>`))
    .on("mouseleave", esconder);
  g.append("rect").attr("width", x1.bandwidth()).attr("y", d => y(d.wer)).attr("height", d => y(0) - y(d.wer))
    .attr("fill", d => (d.lado === "dentro" ? DENTRO : FORA));
  g.append("text").attr("x", x1.bandwidth() / 2).attr("y", d => y(d.wer) - 6).attr("text-anchor", "middle")
    .attr("font-size", 13).attr("font-weight", "bold").attr("fill", COR.tinta).text(d => dec(d.wer, 0) + "%");
  // nome do grupo de cada barra, logo abaixo do eixo
  g.append("text").attr("x", x1.bandwidth() / 2).attr("y", A - m.bottom + 18).attr("text-anchor", "middle")
    .attr("font-size", 12).attr("fill", COR.tinta).text(d => d.grupo);

  svg.append("g").selectAll("text").data(funcoes).join("text")
    .attr("x", f => x0(f.funcao) + x0.bandwidth() / 2).attr("y", A - m.bottom + 42).attr("text-anchor", "middle")
    .attr("font-size", 14).attr("font-weight", "bold").attr("fill", COR.tinta).text(f => f.funcao);
  svg.append("line").attr("x1", m.left).attr("x2", L - m.right).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", COR.tinta);

  const leg = svg.append("g").attr("transform", `translate(${L - m.right - 420},${m.top - 34})`);
  [[DENTRO, "presente nos dados de treino"], [FORA, "ausente ou raro nos dados de treino"]].forEach(([cor, t], i) => {
    leg.append("rect").attr("x", i * 200).attr("y", -7).attr("width", 14).attr("height", 14).attr("fill", cor);
    leg.append("text").attr("x", i * 200 + 20).attr("dy", "0.35em").attr("font-size", 12).attr("fill", COR.tinta).text(t);
  });
}
