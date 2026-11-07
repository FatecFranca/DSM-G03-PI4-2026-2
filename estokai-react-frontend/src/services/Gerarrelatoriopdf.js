import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const moeda = (valor) =>
  Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const numero = (valor) => Number(valor).toLocaleString("pt-BR");

const formatarData = (dataString) =>
  new Date(dataString + "T00:00:00").toLocaleDateString("pt-BR");

const formatarDataHora = (data) =>
  new Date(data).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

// ════════════════════════════════════════════════════════════════
// Ícones vetoriais (desenhados na hora, sem depender de imagens)
// Todos recebem (doc, cx, cy, raio, cor) e desenham centrados.
// ════════════════════════════════════════════════════════════════

const desenharHexagono = (doc, cx, cy, r, cor) => {
  doc.setDrawColor(...cor);
  doc.setLineWidth(Math.max(0.5, r * 0.12));
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI / 180) * (60 * i - 30);
    pts.push([cx + r * Math.cos(ang), cy + r * Math.sin(ang)]);
  }
  for (let i = 0; i < 6; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % 6];
    doc.line(x1, y1, x2, y2);
  }
  doc.setFillColor(...cor);
  doc.circle(cx, cy, r * 0.22, "F");
};

const desenharCalendario = (doc, cx, cy, r, cor) => {
  doc.setDrawColor(...cor);
  doc.setLineWidth(Math.max(0.35, r * 0.13));
  const w = r * 2, h = r * 1.8;
  const x = cx - w / 2, y = cy - h / 2;
  doc.roundedRect(x, y + h * 0.18, w, h * 0.82, 0.6, 0.6, "S");
  doc.line(x + w * 0.22, y, x + w * 0.22, y + h * 0.32);
  doc.line(x + w * 0.78, y, x + w * 0.78, y + h * 0.32);
  doc.line(x, y + h * 0.48, x + w, y + h * 0.48);
};

const desenharCaixa = (doc, cx, cy, r, cor) => {
  doc.setDrawColor(...cor);
  doc.setLineWidth(Math.max(0.35, r * 0.13));
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI / 180) * (60 * i - 90);
    pts.push([cx + r * Math.cos(ang), cy + r * Math.sin(ang)]);
  }
  for (let i = 0; i < 6; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % 6];
    doc.line(x1, y1, x2, y2);
  }
  doc.line(cx, cy, pts[0][0], pts[0][1]);
  doc.line(cx, cy, pts[2][0], pts[2][1]);
  doc.line(cx, cy, pts[4][0], pts[4][1]);
};

const desenharMoeda = (doc, cx, cy, r, cor) => {
  doc.setDrawColor(...cor);
  doc.setLineWidth(Math.max(0.35, r * 0.13));
  doc.circle(cx, cy, r, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(r * 2.3);
  doc.setTextColor(...cor);
  doc.text("$", cx, cy + r * 0.36, { align: "center" });
};

const desenharGrafico = (doc, cx, cy, r, cor) => {
  doc.setFillColor(...cor);
  const baseY = cy + r * 0.75;
  const w = r * 0.45;
  const gap = r * 0.2;
  doc.rect(cx - r * 0.95, baseY - r * 0.55, w, r * 0.55, "F");
  doc.rect(cx - r * 0.95 + w + gap, baseY - r * 1.0, w, r * 1.0, "F");
  doc.rect(cx - r * 0.95 + (w + gap) * 2, baseY - r * 1.5, w, r * 1.5, "F");
};

const desenharCartao = (doc, cx, cy, r, cor) => {
  doc.setDrawColor(...cor);
  doc.setLineWidth(Math.max(0.35, r * 0.13));
  const w = r * 2.1, h = r * 1.4;
  const x = cx - w / 2, y = cy - h / 2;
  doc.roundedRect(x, y, w, h, 0.6, 0.6, "S");
  doc.setFillColor(...cor);
  doc.rect(x, y + h * 0.22, w, h * 0.18, "F");
};

const desenharDocumento = (doc, cx, cy, r, cor) => {
  doc.setDrawColor(...cor);
  doc.setLineWidth(Math.max(0.35, r * 0.1));
  const w = r * 1.4, h = r * 2;
  const x = cx - w / 2, y = cy - h / 2;
  doc.roundedRect(x, y, w, h, 0.8, 0.8, "S");
  doc.roundedRect(x + w * 0.22, y - h * 0.06, w * 0.56, h * 0.12, 0.4, 0.4, "S");
  doc.setLineWidth(Math.max(0.3, r * 0.07));
  doc.line(x + w * 0.18, y + h * 0.38, x + w * 0.82, y + h * 0.38);
  doc.line(x + w * 0.18, y + h * 0.54, x + w * 0.82, y + h * 0.54);
  doc.line(x + w * 0.18, y + h * 0.7, x + w * 0.55, y + h * 0.7);
};

export function gerarRelatorioPdf(produtos, resumo, dataInicio, dataFim, config = {}) {
  const {
    mostrarCustoELucro = true,
    mostrarResumoPagamentos = true,
    mostrarCabecalhoEmpresa = true,
  } = config;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // ── Paleta ───────────────────────────────────────────────────────
  const LARANJA      = [234, 88, 12];
  const LARANJA_SOFT = [255, 237, 213];
  const PRETO        = [15, 15, 15];
  const CINZA_ESCURO = [50, 50, 50];
  const CINZA_MEDIO  = [110, 110, 110];
  const CINZA_CLARO  = [225, 225, 225];
  const CINZA_FUNDO  = [248, 248, 248];
  const BRANCO       = [255, 255, 255];
  const VERDE        = [21, 128, 61];

  const margem = 14;
  const larguraUtil = 210 - margem * 2;
  const agora = formatarDataHora(new Date());

  // ── Helpers ──────────────────────────────────────────────────────
  // Barra de título de seção, com ícone opcional à esquerda do texto.
  // x/largura permitem reaproveitar a mesma barra dentro de colunas.
  const secao = (titulo, posY, x = margem, largura = larguraUtil, icone = null) => {
    doc.setFillColor(...LARANJA_SOFT);
    doc.rect(x, posY - 4, largura, 7, "F");
    doc.setDrawColor(...LARANJA);
    doc.setLineWidth(0.6);
    doc.line(x, posY - 4, x, posY + 3);

    let textX = x + 3;
    if (icone) {
      icone(doc, x + 5.5, posY - 0.3, 2.6, LARANJA);
      textX = x + 11;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...LARANJA);
    doc.text(titulo, textX, posY + 0.5);
    return posY + 9;
  };

  const rodape = (pageNum) => {
    const alturaTotal = doc.internal.pageSize.height;
    doc.setDrawColor(...CINZA_CLARO);
    doc.setLineWidth(0.3);
    doc.line(margem, alturaTotal - 14, 210 - margem, alturaTotal - 14);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...CINZA_MEDIO);
    doc.text(
      `Fechamento de Caixa · Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)} · Gerado em ${agora} · Página ${pageNum}`,
      105, alturaTotal - 9, { align: "center" }
    );
  };

  // Desenha o bloco de logo (selo hexagonal + nome da empresa)
  const desenharLogo = (cx, baselineNome, comTagline) => {
    desenharHexagono(doc, cx, baselineNome - 1, comTagline ? 8 : 5.5, LARANJA);
    const textoX = cx + (comTagline ? 12 : 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(comTagline ? 13 : 10);
    doc.setTextColor(...PRETO);
    doc.text("Estokaí", textoX, baselineNome);
    const largNome = doc.getTextWidth("Estokaí");
    doc.setTextColor(...LARANJA);
    doc.text(".", textoX + largNome, baselineNome);

    if (comTagline) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...CINZA_MEDIO);
      doc.text("Controle de Estoque Inteligente", textoX, baselineNome + 5);
    }
  };

  // Desenha o cartão laranja com curva (efeito "swoosh") usado nos cabeçalhos.
  // O retângulo é posicionado para fora da página nos cantos que não devem
  // aparecer arredondados — só o canto inferior-esquerdo (visível) fica curvo.
  const desenharCartaoTitulo = (titulo, subtitulo, alturaVisivel, raioCurva, tamanhoFonte, icone) => {
    const cardX = 66;
    doc.setFillColor(...LARANJA);
    doc.roundedRect(cardX, -8, 224 - cardX, alturaVisivel + 8, raioCurva, raioCurva, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(tamanhoFonte);
    doc.setTextColor(...BRANCO);
    doc.text(titulo, cardX + 14, alturaVisivel * 0.44);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(tamanhoFonte < 16 ? 8 : 9);
    doc.setTextColor(255, 220, 180);
    doc.text(subtitulo, cardX + 14, alturaVisivel * 0.44 + (tamanhoFonte < 16 ? 6 : 8));

    if (icone) {
      icone(doc, 195, alturaVisivel * 0.38, alturaVisivel < 25 ? 5.5 : 6.5, BRANCO);
    }

    doc.setDrawColor(...CINZA_CLARO);
    doc.setLineWidth(0.3);
    doc.line(margem, alturaVisivel + 3, 210 - margem, alturaVisivel + 3);
  };

  // ════════════════════════════════════════════════════════════════
  // PÁGINA 1 — Cabeçalho + Badges + Tabela de Produtos
  // ════════════════════════════════════════════════════════════════

  if (mostrarCabecalhoEmpresa) {
    desenharLogo(14, 14, true);
  }

  desenharCartaoTitulo(
    "FECHAMENTO DE CAIXA",
    `Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`,
    36, 10, 18, desenharDocumento
  );

  // ── Linha de indicadores com ícones (badges) ──────────────────────
  const yBadges = 44;
  const colW = larguraUtil / 4;

  const badge = (x, largura, desenharIcone, label, valor, opts = {}) => {
    const { cor = CINZA_ESCURO, tamanho = 11 } = opts;
    desenharIcone(doc, x + 8, yBadges + 5, 4.2, LARANJA);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.3);
    doc.setTextColor(...CINZA_MEDIO);
    doc.text(label.toUpperCase(), x + 16, yBadges + 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(tamanho);
    doc.setTextColor(...cor);
    const linhas = Array.isArray(valor) ? valor : [valor];
    linhas.forEach((linha, i) => {
      doc.text(String(linha), x + 16, yBadges + 7.5 + i * 4.3, { maxWidth: largura - 18 });
    });
  };

  badge(margem, colW, desenharCalendario, "Período",
    [formatarData(dataInicio), `a ${formatarData(dataFim)}`], { tamanho: 8 });

  badge(margem + colW, colW, desenharCaixa, "Pedidos", numero(resumo.quantidadePedidos), { tamanho: 13 });

  badge(margem + colW * 2, colW, desenharMoeda, "Total Bruto", moeda(resumo.totalBruto),
    { cor: LARANJA, tamanho: 11.5 });

  if (mostrarCustoELucro) {
    badge(margem + colW * 3, colW, desenharGrafico, "Lucro Líquido", moeda(resumo.totalLucro),
      { cor: VERDE, tamanho: 11.5 });
  } else {
    badge(margem + colW * 3, colW, desenharCaixa, "Produtos", numero(produtos.length), { tamanho: 13 });
  }

  [1, 2, 3].forEach((i) => {
    const lx = margem + colW * i;
    doc.setDrawColor(...CINZA_CLARO);
    doc.setLineWidth(0.3);
    doc.line(lx, yBadges + 1, lx, yBadges + 17);
  });

  doc.setDrawColor(...CINZA_CLARO);
  doc.setLineWidth(0.3);
  doc.line(margem, yBadges + 21, 210 - margem, yBadges + 21);

  let y = yBadges + 29;

  // ── Seção: Tabela de Produtos ─────────────────────────────────────
  y = secao("PRODUTOS VENDIDOS NO PERÍODO", y, margem, larguraUtil, desenharCaixa);
  y += 2;

  const colunas = ["#", "Produto", "Marca", "Qtd.", "Preço Venda", "Total Venda","Forma de Pagamento"];

  const colunasBody = (p, idx) => [
    idx + 1,
    p.descricao ?? "-",
    p.marca ?? "-",
    p.quantidade,
    moeda(p.precoVenda),
    moeda(p.totalVenda),
    p.formaPagamento,
  ];

  let colunasBodyFinal = colunasBody;
  if (mostrarCustoELucro) {
    colunas.splice(4, 0, "Preço Custo");
    const bodyOriginal = colunasBody;
    colunasBodyFinal = (p, idx) => {
      const row = bodyOriginal(p, idx);
      row.splice(4, 0, moeda(p.precoCusto));
      return row;
    };
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margem, right: margem },
    head: [colunas],
    body: produtos.map((p, idx) => colunasBodyFinal(p, idx)),
    headStyles: {
      fillColor: CINZA_ESCURO,
      textColor: BRANCO,
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 8,
      textColor: CINZA_ESCURO,
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
    },
    alternateRowStyles: { fillColor: CINZA_FUNDO },
    columnStyles: mostrarCustoELucro ? {
      0: { cellWidth: 8,  halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 24, halign: "left" },
      3: { cellWidth: 12, halign: "center" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 25, halign: "right" },
      6: { cellWidth: 25, halign: "right", fontStyle: "bold" },
    } : {
      0: { cellWidth: 8,  halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 28, halign: "left" },
      3: { cellWidth: 14, halign: "center" },
      4: { cellWidth: 30, halign: "right" },
      5: { cellWidth: 30, halign: "right", fontStyle: "bold" },
    },
    styles: { lineColor: CINZA_CLARO, lineWidth: 0.2, overflow: "linebreak" },
    tableLineColor: CINZA_CLARO,
    tableLineWidth: 0.2,
    didParseCell: (data) => {
      const totalCol = mostrarCustoELucro ? 6 : 5;
      if (data.section === "body" && data.column.index === totalCol) {
        data.cell.styles.textColor = LARANJA;
      }
    },
  });

  rodape(1);

  // ════════════════════════════════════════════════════════════════
  // PÁGINA 2 — Resumo Financeiro (Pagamentos + Balanço + Total)
  // ════════════════════════════════════════════════════════════════
  doc.addPage();

  if (mostrarCabecalhoEmpresa) {
    desenharLogo(14, 12, false);
  }

  desenharCartaoTitulo(
    "RESUMO FINANCEIRO",
    `Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`,
    22, 8, 13, desenharMoeda
  );

  y = 34;
  const metade = larguraUtil / 2 - 4;
  const col2x  = margem + metade + 8;

  // Itens do balanço — compartilhados pelas duas variações de layout
  const balancoItems = [
    { label: "Total Bruto", valor: moeda(resumo.totalBruto), cor: LARANJA, grande: true },
    ...(mostrarCustoELucro ? [
      { label: "Custos", valor: moeda(resumo.totalCusto), cor: CINZA_ESCURO },
      { label: "Lucro", valor: moeda(resumo.totalLucro), cor: VERDE },
    ] : []),
    { label: "Pedidos", valor: numero(resumo.quantidadePedidos), cor: CINZA_ESCURO },
  ];

  const estiloTabelaResumo = {
    headStyles: {
      fillColor: CINZA_ESCURO,
      textColor: BRANCO,
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: CINZA_ESCURO,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
    },
    alternateRowStyles: { fillColor: CINZA_FUNDO },
    styles: { lineColor: CINZA_CLARO, lineWidth: 0.2 },
  };

  const corDestaque = (data) => {
    if (data.section !== "body") return;
    const item = balancoItems[data.row.index];
    if (!item) return;
    if (data.column.index === 1) {
      data.cell.styles.textColor = item.cor;
      if (item.grande) data.cell.styles.fontSize = 10;
    }
    if (item.grande && data.column.index === 0) {
      data.cell.styles.fontStyle = "bold";
      data.cell.styles.textColor = CINZA_ESCURO;
    }
  };

  let finalYEsquerda = y;
  let finalYDireita = y;

  if (mostrarResumoPagamentos) {
    // ── Coluna esquerda: Formas de Pagamento ────────────────────────
    let yEsq = secao("FORMAS DE PAGAMENTO", y, margem, metade, desenharCartao);
    yEsq += 2;

    const pagamentos = Object.entries(resumo.formasPagamento ?? {});

    autoTable(doc, {
      ...estiloTabelaResumo,
      startY: yEsq,
      margin: { left: margem, right: margem + metade + 8 },
      head: [["Forma", "Valor"]],
      body: pagamentos.map(([forma, valor]) => [forma, moeda(valor)]),
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 32, halign: "right", fontStyle: "bold" },
      },
    });
    finalYEsquerda = doc.lastAutoTable.finalY;

    // ── Coluna direita: Balanço ──────────────────────────────────────
    let yDir = secao("BALANÇO", y, col2x, metade, desenharGrafico);
    yDir += 2;

    autoTable(doc, {
      ...estiloTabelaResumo,
      startY: yDir,
      margin: { left: col2x, right: margem },
      head: [["Descrição", "Valor"]],
      body: balancoItems.map((item) => [item.label, item.valor]),
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 32, halign: "right", fontStyle: "bold" },
      },
      didParseCell: corDestaque,
    });
    finalYDireita = doc.lastAutoTable.finalY;
  } else {
    // ── Sem coluna de pagamentos: Balanço ocupa a largura total ─────
    let yBal = secao("BALANÇO", y, margem, larguraUtil, desenharGrafico);
    yBal += 2;

    autoTable(doc, {
      ...estiloTabelaResumo,
      startY: yBal,
      margin: { left: margem, right: margem },
      head: [["Descrição", "Valor"]],
      body: balancoItems.map((item) => [item.label, item.valor]),
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 50, halign: "right", fontStyle: "bold" },
      },
      didParseCell: corDestaque,
    });
    finalYEsquerda = doc.lastAutoTable.finalY;
    finalYDireita = doc.lastAutoTable.finalY;
  }

  // ── Faturamento total em destaque (largura total) ──────────────────
  y = Math.max(finalYEsquerda, finalYDireita) + 10;

  const boxX = margem;
  const boxW = larguraUtil;
  const boxH = mostrarCustoELucro ? 30 : 26;

  doc.setFillColor(200, 200, 200);
  doc.roundedRect(boxX + 1, y + 1, boxW, boxH, 3, 3, "F");
  doc.setFillColor(...LARANJA);
  doc.roundedRect(boxX, y, boxW, boxH, 3, 3, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(255, 220, 180);
  doc.text("FATURAMENTO TOTAL DO PERÍODO", boxX + boxW / 2, y + 8, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BRANCO);
  doc.text(moeda(resumo.totalBruto), boxX + boxW / 2, y + 18, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 220, 180);

  if (mostrarCustoELucro) {
    doc.text(`${numero(resumo.quantidadePedidos)} pedido(s)`, boxX + boxW * 0.27, y + boxH - 5, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRANCO);
    doc.text(`Lucro ${moeda(resumo.totalLucro)}`, boxX + boxW * 0.73, y + boxH - 5, { align: "center" });
  } else {
    doc.text(`${numero(resumo.quantidadePedidos)} pedido(s) no período`, boxX + boxW / 2, y + boxH - 5, { align: "center" });
  }

  rodape(2);

  // ── Salvar ────────────────────────────────────────────────────────
  const nomeArquivo = `fechamento-${dataInicio}-a-${dataFim}.pdf`;
  doc.save(nomeArquivo);
}
