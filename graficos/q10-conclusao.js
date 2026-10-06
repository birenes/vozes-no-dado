// QUE10 (conclusao): quem fica de fora, quanto isso custa e o que muda na pratica.
// Tres graficos separados:
//  #g10a  quantas pessoas ficam de fora dos dados (barras horizontais)
//  #g10b  quanto o modelo erra a mais quando o grupo fica fora do treino (barras horizontais)
//  #g10d  teste realizado: o mesmo modelo treinado com 0, 0,5 e 1 h do interior de SP (barras agrupadas)
//  #g10c  o erro em cada funcao dos modelos, para quem esta dentro e quem fica de fora (barras agrupadas)
// Referencias D3: https://observablehq.com/@d3/horizontal-bar-chart/2
//                 https://observablehq.com/@d3/grouped-bar-chart/2
// Dados: dados/q10_conclusao.json, dados/q10_exclusao.json (DTS17), dados/q03_wer_coraa.json,
//        dados/q07_fala_atipica.json

Promise.all([
  d3.json("dados/q10_conclusao.json"), d3.json("dados/q03_wer_coraa.json"), d3.json("dados/q07_fala_atipica.json"),
  d3.json("dados/q10_exclusao.json"),
]).then(([C, Q3, Q7, E]) => {
  pessoasDeFora("#g10a", C.pessoas);
  custoForaDoTreino("#g10b", Q3, Q7, C.autismo_treino, E.conclusao);
  testeExclusao("#g10d", E);
  errosPorFuncao("#g10c", C.funcoes);
});

// ---- #g10a: os grupos se sobrepoem (uma mulher de 60 anos em Goias entra em tres barras),
// por isso o grafico mostra cada lacuna sozinha e nunca soma
function pessoasDeFora(seletor, dados) {
  const m = { top: 40, right: 110, bottom: 10, left: 270 }, PASSO = 40;
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
      .attr("fill", COR.tinta).attr("font-size", 11.5).text("pessoas no Brasil (Censo 2022)"));

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

// ---- #g10b: % a mais de erro = (erro do modelo que NAO viu o grupo / erro do modelo que viu) - 1.
// Medida relativa: cada estudo e comparado com ele mesmo, por isso estudos diferentes cabem no mesmo eixo.
// Linguas indigenas: sem dado nem para treinar nem para testar, a medida nao existe (linha listrada).
function custoForaDoTreino(seletor, Q3, Q7, autismo, teste) {
  const SOTAQUE = COR.presente, ATIPICA = COR.destaque;
  const dados = [
    ...Q3.sotaque.map(d => ({ nome: d.nome, fora: d.sem, dentro: d.com, cor: SOTAQUE,
      fonte: "modelo treinado sem e com o CORAA (Candido Junior et al.)" })),
    ...Q7.euphonia.map(d => ({ nome: d.cat, fora: d.generico, dentro: d.personalizado, cor: ATIPICA,
      fonte: "modelo genérico e personalizado (Project Euphonia)" })),
    { nome: "Fala autista", fora: autismo.fora, dentro: autismo.dentro, cor: ATIPICA,
      fonte: "Whisper-small sem e com a fala autista no treino (Park e Lee, 2025; 4 falantes, coreano, erro por caractere)" },
    { nome: "Interior de SP (teste realizado)", fora: teste.sp_interior_sem, dentro: teste.sp_interior_com, cor: SOTAQUE,
      fonte: "Whisper-small ajustado com 4,9 h do CORAA, com e sem 1 h do interior de SP (experimento próprio)" },
  ].map(d => ({ ...d, a_mais: 100 * (d.fora / d.dentro - 1) }))
    .sort((a, b) => d3.descending(a.a_mais, b.a_mais));
  dados.push({ nome: "Línguas indígenas do Brasil", sem_dado: true });

  const m = { top: 44, right: 90, bottom: 44, left: 230 }, PASSO = 34;
  const L = 900, A = m.top + dados.length * PASSO + m.bottom;
  const x = d3.scaleLinear().domain([0, 250]).range([m.left, L - m.right]);
  const y = d3.scaleBand().domain(dados.map(d => d.nome)).rangeRound([m.top, m.top + dados.length * PASSO]).padding(0.22);
  const svg = novoSvg(seletor, L, A);
  const listras = definirHachura(svg, "hachura-g10b");

  svg.append("g").attr("transform", `translate(0,${m.top})`)
    .call(d3.axisTop(x).ticks(5).tickFormat(d => d + "%"))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick text").attr("fill", COR.tinta))
    .call(g => g.selectAll(".tick line").clone().attr("y2", dados.length * PASSO).attr("stroke-opacity", 0.1))
    .call(g => g.append("text").attr("x", L - m.right).attr("y", -24).attr("text-anchor", "end")
      .attr("fill", COR.tinta).attr("font-size", 11.5).text("% a mais de erro quando o grupo fica fora do treino"));

  const linha = svg.append("g").selectAll("g").data(dados).join("g")
    .on("mousemove", (e, d) => mostrar(e, d.sem_dado
      ? `<strong>${d.nome}</strong><br>nenhuma hora de fala aberta: não há modelo para medir`
      : `<strong>${d.nome}</strong><br>fora do treino: ${dec(d.fora, 2)}% de erro<br>dentro do treino: ${dec(d.dentro, 2)}% de erro<br><em>${d.fonte}</em>`))
    .on("mouseleave", esconder);
  linha.append("rect").attr("x", x(0)).attr("y", d => y(d.nome)).attr("height", y.bandwidth())
    .attr("width", d => (d.sem_dado ? x(250) - x(0) : x(d.a_mais) - x(0)))
    .attr("fill", d => (d.sem_dado ? listras : d.cor));
  linha.append("text").attr("y", d => y(d.nome) + y.bandwidth() / 2).attr("dy", "0.35em")
    .attr("x", d => (d.sem_dado ? x(0) + 10 : x(d.a_mais) + 6))
    .attr("font-size", 12.5).attr("font-weight", "bold").attr("fill", COR.tinta)
    .text(d => (d.sem_dado ? "sem nenhum dado: não dá nem para medir" : `${dec(d.a_mais, 0)}% a mais`));

  svg.append("g").attr("transform", `translate(${m.left},0)`)
    .call(d3.axisLeft(y).tickSizeOuter(0))
    .call(g => g.selectAll("text").attr("font-size", 13).attr("fill", COR.tinta));

  const leg = svg.append("g").attr("transform", `translate(${m.left},${A - 16})`);
  [[SOTAQUE, "sotaque"], [ATIPICA, "fala atípica"], [listras, "língua indígena (sem dado)"]].forEach(([cor, t], i) => {
    leg.append("rect").attr("x", i * 170).attr("y", -7).attr("width", 14).attr("height", 14).attr("fill", cor);
    leg.append("text").attr("x", i * 170 + 20).attr("dy", "0.35em").attr("font-size", 12).attr("fill", COR.tinta).text(t);
  });
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

// ---- #g10d: teste realizado. Mesmo modelo de partida (Whisper-small), mesmas 4,9 h de treino do
// CORAA, mesma semente; a unica diferenca e quanto do interior de SP entra: 0 h, 0,5 h ou 1 h.
// Se o erro cai so no interior de SP, e nao nos outros, o efeito e de o sotaque estar no treino.
function testeExclusao(seletor, E) {
  const HORAS = [[0, "0 h", COR.destaque], [0.5, "0,5 h", COR.presenteEscuro], [1, "1 h", COR.presente]];
  const grupos = [["sp_interior", "Interior de SP"], ["outros_sotaques", "Outros sotaques"]];
  const L = 900, A = 380, m = { top: 50, right: 20, bottom: 50, left: 50 };
  const x0 = d3.scaleBand().domain(grupos.map(g => g[1])).rangeRound([m.left, L - m.right]).paddingInner(0.3);
  const x1 = d3.scaleBand().domain(HORAS.map(h => h[1])).rangeRound([0, x0.bandwidth()]).padding(0.08);
  const y = d3.scaleLinear().domain([0, 50]).range([A - m.bottom, m.top]);
  const svg = novoSvg(seletor, L, A);

  svg.append("g").attr("transform", `translate(${m.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick text").attr("fill", COR.tinta))
    .call(g => g.selectAll(".tick line").clone().attr("x2", L - m.left - m.right).attr("stroke-opacity", 0.1))
    .call(g => g.append("text").attr("x", -m.left).attr("y", m.top - 30).attr("text-anchor", "start")
      .attr("fill", COR.tinta).attr("font-size", 12).text("palavras transcritas erradas (WER)"));

  const barras = grupos.flatMap(([chave, nome]) => HORAS.map(([h, rotulo, cor]) => {
    const dose = E.dose.find(d => d.horas_interior_sp === h);
    return { nome, rotulo, cor, ...dose[chave] };
  }));
  const g = svg.append("g").selectAll("g").data(barras).join("g")
    .attr("transform", d => `translate(${x0(d.nome) + x1(d.rotulo)},0)`)
    .on("mousemove", (e, d) => mostrar(e, `<strong>${d.nome}</strong><br>${d.rotulo} de interior de SP no treino: ${dec(d.wer)}%` +
      `<br>intervalo de 95%: ${dec(d.ic95[0])}% a ${dec(d.ic95[1])}%<br>${br(d.trechos)} trechos`))
    .on("mouseleave", esconder);
  g.append("rect").attr("width", x1.bandwidth()).attr("y", d => y(d.wer)).attr("height", d => y(0) - y(d.wer))
    .attr("fill", d => d.cor);
  g.append("text").attr("x", x1.bandwidth() / 2).attr("y", d => y(d.wer) - 6).attr("text-anchor", "middle")
    .attr("font-size", 13).attr("font-weight", "bold").attr("fill", COR.tinta).text(d => dec(d.wer) + "%");

  svg.append("g").selectAll("text").data(grupos).join("text")
    .attr("x", ([, nome]) => x0(nome) + x0.bandwidth() / 2).attr("y", A - m.bottom + 24).attr("text-anchor", "middle")
    .attr("font-size", 14).attr("font-weight", "bold").attr("fill", COR.tinta).text(([, nome]) => nome);
  svg.append("line").attr("x1", m.left).attr("x2", L - m.right).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", COR.tinta);

  const leg = svg.append("g").attr("transform", `translate(${L - m.right - 420},${m.top - 34})`);
  leg.append("text").attr("dy", "0.35em").attr("font-size", 12).attr("fill", COR.tinta).text("interior de SP no treino:");
  HORAS.forEach(([, rotulo, cor], i) => {
    leg.append("rect").attr("x", 150 + i * 80).attr("y", -7).attr("width", 14).attr("height", 14).attr("fill", cor);
    leg.append("text").attr("x", 170 + i * 80).attr("dy", "0.35em").attr("font-size", 12).attr("fill", COR.tinta).text(rotulo);
  });
}
