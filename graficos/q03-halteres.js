// QUE03: o erro do modelo muda quando a variedade entra no treino?
// Referencia D3: https://observablehq.com/@d3/dot-plot/2
// Dois graficos de halteres separados, um por pergunta: por sotaque (#g03a) e por
// estilo de fala (#g03b). Cada um tem o seu eixo e a sua legenda; a escala e a mesma
// nos dois para que possam ser comparados.
// Correcao 5 do professor: sem o sinal de menos; a direcao vira PALAVRA e SETA
// ("caiu 25,2 p.p." / "subiu 2,8 p.p."), queda em verde e aumento em vermelho.
// Dados: dados/q03_wer_coraa.json (DTS07; DAT16, DAT17)

const ROTULOS_Q03 = ["modelo treinado sem o CORAA", "modelo treinado com o CORAA"];
d3.json("dados/q03_wer_coraa.json").then(D => {
  halteres("#g03a", D.sotaque, { maximo: 62, rotulos: ROTULOS_Q03 });
  halteres("#g03b", D.estilo, { maximo: 62, rotulos: ROTULOS_Q03 });
});
