// Base compartilhada por todos os graficos: cores, tooltip e formatacao.
//
// A MESMA COR SIGNIFICA A MESMA COISA EM TODOS OS GRAFICOS:
//   azul-marinho = esta nos dados
//   carmim       = o destaque da pergunta (e: o erro subiu)
//   verde        = o erro caiu
//   cinza        = ausente, sem registro (com listras quando e uma area)
// Para mudar a paleta do trabalho inteiro, mude so este objeto.
//
// TODO TEXTO E PRETO (rotulos, legendas, titulos, valores). A paleta vale so para as
// marcas do grafico: barras, pontos, linhas, setas e areas. Excecoes: rotulo escrito
// DENTRO de uma marca escura fica branco (tintaSobre), senao nao da para ler; e o
// "caiu" / "subiu" dos halteres fica verde / vermelho, como a seta.

const COR = {
  fundo: "#ffffff",
  tinta: "#000000",          // todo texto
  grade: "#e6e6e6",

  // paleta do trabalho (do azul-marinho ao amarelo):
  //   #0E0E76  #8C0073  #D02560  #F76D4D  #FFB449  #F9F871
  // o amarelo #F9F871 nao e usado em marcas: no fundo branco o contraste e baixo demais
  presente: "#0E0E76",       // azul-marinho: esta nos dados / representado
  presenteEscuro: "#8C0073", // magenta: segundo tom de "presente"
  destaque: "#D02560",       // carmim: o foco da pergunta
  ausente: "#bdbdbd",        // cinza: sem registro (paleta nao tem neutro)
  ausenteEscuro: "#6b6b6b",

  melhora: "#1B7A3D",        // verde: o erro caiu (fora da paleta: verde e vermelho se leem na hora)
  piora: "#D02560",          // vermelho: o erro subiu (mesma cor do destaque)

  // cor fixa de cada sotaque do CORAA (QUE04 e QUE05 usam as mesmas)
  sotaque: {
    "Recife": "#0E0E76",
    "SP capital": "#8C0073",
    "SP interior": "#D02560",
    "Minas Gerais": "#F76D4D",
    "TEDx": "#FFB449",
  },

  // rampa de quantidade: claro = pouco, escuro = muito (segue a ordem da paleta)
  rampa: ["#FFB449", "#D02560", "#0E0E76"],
};

// hachura cinza: usada em toda area que significa "nenhum dado"
function definirHachura(svg, id = "hachura") {
  const p = svg.append("defs").append("pattern").attr("id", id)
    .attr("patternUnits", "userSpaceOnUse").attr("width", 7).attr("height", 7)
    .attr("patternTransform", "rotate(45)");
  p.append("rect").attr("width", 7).attr("height", 7).attr("fill", "#ffffff");
  p.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 7)
    .attr("stroke", COR.ausente).attr("stroke-width", 3);
  return `url(#${id})`;
}

const tip = d3.select("#tooltip");
function mostrar(evento, html) {
  tip.html(html).style("opacity", 1)
    .style("left", (evento.clientX + 14) + "px")
    .style("top", (evento.clientY + 14) + "px");
}
function esconder() { tip.style("opacity", 0); }

// numeros no formato brasileiro: 1.234.567 e 12,5
const br = n => d3.format(",d")(Math.round(n)).replace(/,/g, ".");
const dec = (n, casas = 1) => n.toFixed(casas).replace(".", ",");

// texto branco em fundo escuro, escuro em fundo claro
function tintaSobre(cor) {
  return d3.hsl(cor).l > 0.62 ? COR.tinta : "#ffffff";
}

// cria o svg de um grafico dentro do seu container
function novoSvg(seletor, largura, altura) {
  return d3.select(seletor).append("svg")
    .attr("viewBox", [0, 0, largura, altura])
    .attr("width", largura).attr("height", altura)
    .style("max-width", "100%").style("height", "auto");
}

// Grafico de halteres (galeria do D3: dot plot) usado na QUE03 e na QUE07.
// Cada linha: { nome, sub?, sem, com } = valor antes (bola cinza) e depois (bola azul),
// ligados por uma seta verde (caiu) ou vermelha (subiu). rotulos = [antes, depois].
function halteres(seletor, linhas, { maximo, rotulos }) {
  const m = { top: 10, right: 150, bottom: 74, left: 220 }, PASSO = 46, R = 5;
  const L = 900, A = m.top + linhas.length * PASSO + m.bottom;
  const x = d3.scaleLinear().domain([0, maximo]).range([m.left, L - m.right]);
  const yFim = m.top + linhas.length * PASSO;
  const svg = novoSvg(seletor, L, A);
  const id = seletor.slice(1);

  ["melhora", "piora"].forEach(tipo => svg.append("defs").append("marker")
    .attr("id", `seta-${id}-${tipo}`).attr("viewBox", "0 0 10 10").attr("refX", 9).attr("refY", 5)
    .attr("markerUnits", "userSpaceOnUse").attr("markerWidth", 8).attr("markerHeight", 8)
    .attr("orient", "auto-start-reverse")
    .append("path").attr("d", "M0,0 L10,5 L0,10 z").attr("fill", COR[tipo]));

  svg.append("g").selectAll("line").data(x.ticks(6)).join("line")
    .attr("x1", d => x(d)).attr("x2", d => x(d)).attr("y1", m.top).attr("y2", yFim).attr("stroke", COR.grade);
  svg.append("g").attr("transform", `translate(0,${yFim})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d => d + "%"))
    .call(a => a.select(".domain").remove()).call(a => a.selectAll("line").attr("stroke", "#ccc"));
  svg.append("text").attr("x", x(maximo)).attr("y", yFim + 36).attr("text-anchor", "end")
    .attr("font-size", 11.5).attr("fill", COR.tinta).text("palavras transcritas erradas (WER)");

  const tipo = d => (d.com < d.sem ? "melhora" : "piora");
  const linha = svg.selectAll(".l").data(linhas).join("g")
    .attr("transform", (d, i) => `translate(0,${m.top + i * PASSO + PASSO / 2})`)
    .on("mousemove", (e, d) => mostrar(e, `<strong>${d.nome}</strong>${d.sub ? " (" + d.sub + ")" : ""}` +
      `<br>${rotulos[0]}: ${dec(d.sem, 2)}%<br>${rotulos[1]}: ${dec(d.com, 2)}%`))
    .on("mouseleave", esconder);
  linha.append("rect").attr("y", -PASSO / 2).attr("width", L).attr("height", PASSO).attr("fill", "transparent");
  linha.append("text").attr("x", m.left - 16).attr("y", d => (d.sub ? -4 : 0)).attr("dy", "0.35em")
    .attr("text-anchor", "end").attr("font-size", 13.5).attr("fill", COR.tinta).text(d => d.nome);
  linha.filter(d => d.sub).append("text").attr("x", m.left - 16).attr("y", 12).attr("dy", "0.35em")
    .attr("text-anchor", "end").attr("font-size", 11).attr("fill", COR.tinta).text(d => d.sub);

  // seta reta da borda da bola "sem" ate a borda da bola "com"
  linha.append("path")
    .attr("d", d => {
      const a = x(d.sem), b = x(d.com), dir = Math.sign(b - a);
      return `M${a + dir * (R + 1)},0 L${b - dir * (R + 1)},0`;
    })
    .attr("fill", "none")
    .attr("stroke", d => COR[tipo(d)]).attr("stroke-width", 2)
    .attr("marker-end", d => `url(#seta-${id}-${tipo(d)})`);
  linha.append("circle").attr("cx", d => x(d.sem)).attr("r", R).attr("fill", COR.ausente);
  linha.append("circle").attr("cx", d => x(d.com)).attr("r", R).attr("fill", COR.presente);
  linha.append("text").attr("x", d => x(Math.max(d.sem, d.com)) + 14).attr("dy", "0.35em")
    .attr("font-size", 12.5).attr("font-weight", "bold").attr("fill", d => COR[tipo(d)])
    .text(d => (d.com < d.sem ? "▼ caiu " : "▲ subiu ") + dec(Math.abs(d.com - d.sem)) + " p.p.");

  const leg = svg.append("g").attr("transform", `translate(${m.left},${A - 10})`);
  [[COR.ausente, rotulos[0]], [COR.presente, rotulos[1]]].forEach(([c, t], i) => {
    leg.append("circle").attr("cx", i * 280 + 6).attr("r", 6).attr("fill", c);
    leg.append("text").attr("x", i * 280 + 18).attr("dy", "0.35em").attr("font-size", 12).attr("fill", COR.tinta).text(t);
  });
}
