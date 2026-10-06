// QUE06: a distribuicao de genero e idade dos falantes e equilibrada?
// Dois graficos separados. Equilibrado = igual a populacao do Brasil (Censo 2022).
//  #g06a  genero: barras empilhadas de 100%, Common Voice x populacao
//         Referencia D3: https://observablehq.com/@d3/stacked-normalized-horizontal-bar/2
//         Com so duas categorias, um grafico divergente repetiria o mesmo numero
//         (o que sobra de homens e exatamente o que falta de mulheres), entao o genero
//         mostra as proporcoes inteiras lado a lado.
//  #g06b  idade: barras divergentes
//         Referencia D3: https://observablehq.com/@d3/diverging-bar-chart/2
// Em #g06b, cada barra = % entre os falantes do Common Voice que declararam - % na populacao.
// Para a direita: o grupo aparece MAIS do que no pais. Para a esquerda: aparece MENOS.
// Sem sinal de menos nos numeros (pedido do professor): o lado e a cor ja dizem a direcao.
// Genero compara com a populacao inteira; idade compara so adultos (19 anos ou mais),
// porque a faixa "menos de 19" do Common Voice inclui criancas. "Nao binario" fica de
// fora porque o Censo nao tem essa categoria (e no Common Voice e 1 pessoa).
// Dados: dados/q06_genero_idade.json (DTS02 + DTS13; DAT18, DAT19)

d3.json("dados/q06_genero_idade.json").then(D => {
  const g = D.genero.filter(d => d.cat === "Masculino" || d.cat === "Feminino");
  const totG = d3.sum(g, d => d.falantes), popG = D.censo.homens + D.censo.mulheres;
  const homens = g.find(d => d.cat === "Masculino").falantes / totG;
  empilhadaGenero("#g06a", [
    { nome: "Falantes do Common Voice", homens },
    { nome: "População do Brasil", homens: D.censo.homens / popG },
  ]);

  const a = D.idade.filter(d => D.censo.idade[d.cat] !== undefined);
  const totA = d3.sum(a, d => d.falantes), popA = d3.sum(Object.values(D.censo.idade));
  divergente("#g06b", a.map(d => ({
    cat: d.cat.replace(" ou mais", "") + " anos" + (d.cat.endsWith("ou mais") ? " ou mais" : ""),
    cv: d.falantes / totA,
    pais: D.censo.idade[d.cat] / popA,
  })));
});

function divergente(seletor, linhas) {
  const A_MAIS = COR.presente, A_MENOS = "#FFB449";   // mesma logica da rampa: escuro = muito, claro = pouco
  const L = 900, PASSO = 34, m = { top: 56, right: 40, bottom: 10, left: 40 };
  const A = m.top + linhas.length * PASSO + m.bottom;
  const x = d3.scaleLinear().domain([-45, 45]).range([m.left, L - m.right]);
  const svg = novoSvg(seletor, L, A);

  svg.append("g").attr("transform", `translate(0,${m.top - 6})`)
    .call(d3.axisTop(x).ticks(9).tickFormat(d => Math.abs(d) + " p.p."))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick text").attr("font-size", 11).attr("fill", COR.tinta))
    .call(g => g.selectAll(".tick line").clone().attr("y2", A - m.top).attr("stroke-opacity", 0.1));
  svg.append("text").attr("x", x(-1)).attr("y", 16).attr("text-anchor", "end").attr("font-size", 12)
    .attr("fill", COR.tinta).text("menos do que na população do Brasil");
  svg.append("text").attr("x", x(1)).attr("y", 16).attr("font-size", 12)
    .attr("fill", COR.tinta).text("mais do que na população do Brasil");

  linhas.forEach((d, i) => {
    const dif = 100 * (d.cv - d.pais), yy = m.top + i * PASSO, h = PASSO - 8;
    const linha = svg.append("g")
      .on("mousemove", e => mostrar(e, `<strong>${d.cat}</strong><br>no Common Voice: ${dec(100 * d.cv)}%` +
        `<br>na população: ${dec(100 * d.pais)}%`))
      .on("mouseleave", esconder);
    linha.append("rect").attr("x", x(Math.min(0, dif))).attr("y", yy).attr("height", h)
      .attr("width", Math.abs(x(dif) - x(0))).attr("fill", dif > 0 ? A_MAIS : A_MENOS);
    // nome do grupo do lado oposto ao da barra; valor na ponta da barra
    linha.append("text").attr("x", x(0) + (dif > 0 ? -8 : 8)).attr("y", yy + h / 2).attr("dy", "0.35em")
      .attr("text-anchor", dif > 0 ? "end" : "start").attr("font-size", 13).attr("fill", COR.tinta).text(d.cat);
    linha.append("text").attr("x", x(dif) + (dif > 0 ? 6 : -6)).attr("y", yy + h / 2).attr("dy", "0.35em")
      .attr("text-anchor", dif > 0 ? "start" : "end").attr("font-size", 13).attr("font-weight", "bold")
      .attr("fill", COR.tinta).text(dec(Math.abs(dif)) + " p.p.");
  });
}

function empilhadaGenero(seletor, linhas) {
  const PARTES = [["homens", "Homens", COR.presente], ["mulheres", "Mulheres", "#FFB449"]];
  const dados = linhas.map(d => ({ ...d, mulheres: 1 - d.homens }));
  const m = { top: 56, right: 30, bottom: 10, left: 200 }, PASSO = 52;
  const L = 900, A = m.top + dados.length * PASSO + m.bottom;
  const x = d3.scaleLinear().domain([0, 1]).range([m.left, L - m.right]);
  const y = d3.scaleBand().domain(dados.map(d => d.nome)).rangeRound([m.top, A - m.bottom]).padding(0.2);
  const svg = novoSvg(seletor, L, A);

  svg.append("g").attr("transform", `translate(0,${m.top})`)
    .call(d3.axisTop(x).ticks(10, "%"))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick text").attr("fill", COR.tinta));

  dados.forEach(d => {
    let x0 = 0;
    PARTES.forEach(([chave, rotulo, cor]) => {
      const v = d[chave];
      svg.append("rect").attr("x", x(x0)).attr("y", y(d.nome)).attr("width", x(x0 + v) - x(x0))
        .attr("height", y.bandwidth()).attr("fill", cor)
        .on("mousemove", e => mostrar(e, `<strong>${d.nome}</strong><br>${rotulo}: ${dec(100 * v)}%`))
        .on("mouseleave", esconder);
      // porcentagem dentro da faixa (branca sobre o azul-marinho, preta sobre o amarelo)
      svg.append("text").attr("x", x(x0) + 8).attr("y", y(d.nome) + y.bandwidth() / 2).attr("dy", "0.35em")
        .attr("font-size", 13).attr("font-weight", "bold").attr("fill", tintaSobre(cor)).text(dec(100 * v) + "%");
      x0 += v;
    });
  });

  svg.append("g").attr("transform", `translate(${m.left},0)`)
    .call(d3.axisLeft(y).tickSize(0))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll("text").attr("font-size", 13).attr("fill", COR.tinta).attr("dx", -8));

  const leg = svg.append("g").attr("transform", `translate(${m.left},14)`);
  PARTES.forEach(([, rotulo, cor], i) => {
    leg.append("rect").attr("x", i * 110).attr("y", -7).attr("width", 14).attr("height", 14).attr("fill", cor);
    leg.append("text").attr("x", i * 110 + 20).attr("dy", "0.35em").attr("font-size", 12.5).attr("fill", COR.tinta).text(rotulo);
  });
}
