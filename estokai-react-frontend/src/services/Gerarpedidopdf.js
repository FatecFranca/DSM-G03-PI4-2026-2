import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const moeda = (valor) =>
  Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const numero = (valor) => Number(valor).toLocaleString("pt-BR");

const formatarDataHora = (data) =>
  new Date(data).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

// ════════════════════════════════════════════════════════════════
// Ícones vetoriais — mesma biblioteca do relatório
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
  doc.line(x + w * 0.18, y + h * 0.7,  x + w * 0.55, y + h * 0.7);
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

const desenharMoeda = (doc, cx, cy, r, cor) => {
  doc.setDrawColor(...cor);
  doc.setLineWidth(Math.max(0.35, r * 0.13));
  doc.circle(cx, cy, r, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(r * 2.3);
  doc.setTextColor(...cor);
  doc.text("$", cx, cy + r * 0.36, { align: "center" });
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

// Ícone de pessoa: círculo (cabeça) + semicírculo (ombros) desenhados com primitivas básicas
const desenharPessoa = (doc, cx, cy, r, cor) => {
  doc.setDrawColor(...cor);
  doc.setFillColor(...cor);
  doc.setLineWidth(Math.max(0.35, r * 0.12));

  // Cabeça — círculo preenchido pequeno na parte superior
  doc.circle(cx, cy - r * 0.38, r * 0.38, "F");

  // Ombros — retângulo arredondado na parte inferior, simulando o busto
  const bw = r * 1.5;
  const bh = r * 0.75;
  doc.roundedRect(cx - bw / 2, cy + r * 0.1, bw, bh, bw * 0.45, bh * 0.45, "F");
};

// ════════════════════════════════════════════════════════════════
// Gerador principal
// ════════════════════════════════════════════════════════════════

export function gerarPedidoPdf(pedido, config = {}) {
  const { mostrarCabecalhoEmpresa = true } = config;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // ── Paleta (idêntica ao relatório) ───────────────────────────────
  const LARANJA      = [234, 88, 12];
  const LARANJA_SOFT = [255, 237, 213];
  const PRETO        = [15, 15, 15];
  const CINZA_ESCURO = [50, 50, 50];
  const CINZA_MEDIO  = [110, 110, 110];
  const CINZA_CLARO  = [225, 225, 225];
  const CINZA_FUNDO  = [248, 248, 248];
  const BRANCO       = [255, 255, 255];

  const STATUS_CORES = {
    Concluído: [21, 128, 61],
    Pendente:  [202, 138, 4],
    Cancelado: [220, 38, 38],
  };

  const margem      = 14;
  const larguraUtil = 210 - margem * 2;
  const agora       = formatarDataHora(new Date());
  const itens       = pedido.itens ?? [];

  // ── Helpers ──────────────────────────────────────────────────────

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

  // Card laranja com curva — badge de status desenhado DENTRO do card
  const desenharCartaoTitulo = (titulo, subtitulo, alturaVisivel, raioCurva, tamanhoFonte, icone, status) => {
    const cardX = 66;
    doc.setFillColor(...LARANJA);
    doc.roundedRect(cardX, -8, 224 - cardX, alturaVisivel + 8, raioCurva, raioCurva, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(tamanhoFonte);
    doc.setTextColor(...BRANCO);
    doc.text(titulo, cardX + 14, alturaVisivel * 0.38);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(tamanhoFonte < 16 ? 8 : 9);
    doc.setTextColor(255, 220, 180);
    doc.text(subtitulo, cardX + 14, alturaVisivel * 0.38 + (tamanhoFonte < 16 ? 6 : 7));

    // Badge de status — canto inferior-direito do card, bem acima da linha divisória
    if (status) {
      const corSt = STATUS_CORES[status] ?? CINZA_MEDIO;
      const badgeW = 28, badgeH = 7;
      const badgeX = 210 - margem - badgeW - 1;
      const badgeY = alturaVisivel - badgeH - 3;
      doc.setFillColor(...corSt);
      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...BRANCO);
      doc.text(status, badgeX + badgeW / 2, badgeY + 4.8, { align: "center" });
    }

    if (icone) {
      icone(doc, 195, alturaVisivel * 0.32, alturaVisivel < 25 ? 5.5 : 6.5, BRANCO);
    }

    doc.setDrawColor(...CINZA_CLARO);
    doc.setLineWidth(0.3);
    doc.line(margem, alturaVisivel + 3, 210 - margem, alturaVisivel + 3);
  };

  // Barra de título de seção com ícone opcional
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

  const rodape = () => {
    const alturaTotal = doc.internal.pageSize.height;
    doc.setDrawColor(...CINZA_CLARO);
    doc.setLineWidth(0.3);
    doc.line(margem, alturaTotal - 14, 210 - margem, alturaTotal - 14);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...CINZA_MEDIO);
    doc.text(
      `Pedido de Venda · PED-${pedido.numPedido} · Gerado em ${agora}`,
      105, alturaTotal - 9, { align: "center" }
    );
  };

  // ════════════════════════════════════════════════════════════════
  // PÁGINA ÚNICA — Cabeçalho + Badges + Tabela de Itens + Total
  // ════════════════════════════════════════════════════════════════

  if (mostrarCabecalhoEmpresa) {
    desenharLogo(14, 14, true);
  }

  desenharCartaoTitulo(
    "PEDIDO DE VENDA",
    `Nº PED-${pedido.numPedido} · Emitido em ${formatarDataHora(pedido.createdAt)}`,
    36, 10, 18, desenharDocumento, pedido.status
  );

  // ── Linha de indicadores (badges) ────────────────────────────────
  const yBadges = 44;
  const colW    = larguraUtil / 4;

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

  badge(margem,          colW, desenharPessoa, "Cliente",         pedido.cliente?.nomeRazaoSocial ?? "-", { tamanho: 8 });
  badge(margem + colW,   colW, desenharCaixa,  "Itens",           numero(itens.length), { tamanho: 13 });
  badge(margem + colW*2, colW, desenharCartao, "Pagamento",       pedido.formaPagamento ?? "-", { tamanho: 8 });
  badge(margem + colW*3, colW, desenharMoeda,  "Total do Pedido", moeda(pedido.valorTotal), { cor: LARANJA, tamanho: 11.5 });

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

  // ── Seção: Itens do Pedido ───────────────────────────────────────
  y = secao("ITENS DO PEDIDO", y, margem, larguraUtil, desenharCaixa);
  y += 2;

  autoTable(doc, {
    startY: y,
    margin: { left: margem, right: margem },
    head: [["#", "Produto", "Marca", "Qtd.", "Preço Unit.", "Subtotal"]],
    body: itens.map((item, idx) => [
      idx + 1,
      item.produto?.descricao ?? "-",
      item.produto?.marca ?? "-",
      item.quantidade,
      moeda(item.valorUnitario),
      moeda(item.quantidade * item.valorUnitario),
    ]),
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
    columnStyles: {
      0: { cellWidth: 8,  halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 28, halign: "left" },
      3: { cellWidth: 12, halign: "center" },
      4: { cellWidth: 28, halign: "right" },
      5: { cellWidth: 28, halign: "right", fontStyle: "bold" },
    },
    styles: { lineColor: CINZA_CLARO, lineWidth: 0.2, overflow: "linebreak" },
    tableLineColor: CINZA_CLARO,
    tableLineWidth: 0.2,
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        data.cell.styles.textColor = LARANJA;
      }
    },
  });

  y = doc.lastAutoTable.finalY + 10;

  // ── Caixa de total (idêntica ao faturamento do relatório) ─────────
  const boxX = margem;
  const boxW = larguraUtil;
  const boxH = 30;

  // Sombra
  doc.setFillColor(200, 200, 200);
  doc.roundedRect(boxX + 1, y + 1, boxW, boxH, 3, 3, "F");

  // Caixa principal
  doc.setFillColor(...LARANJA);
  doc.roundedRect(boxX, y, boxW, boxH, 3, 3, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(255, 220, 180);
  doc.text("TOTAL DO PEDIDO", boxX + boxW / 2, y + 8, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BRANCO);
  doc.text(moeda(pedido.valorTotal), boxX + boxW / 2, y + 18, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 220, 180);
  doc.text(
    `${numero(itens.length)} ${itens.length === 1 ? "item" : "itens"} no pedido`,
    boxX + boxW * 0.27, y + boxH - 5, { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRANCO);
  doc.text(`${pedido.formaPagamento ?? "-"}`, boxX + boxW * 0.73, y + boxH - 5, { align: "center" });

  rodape();

  // ── Salvar ────────────────────────────────────────────────────────
  doc.save(`pedido-${pedido.numPedido}.pdf`);
}
