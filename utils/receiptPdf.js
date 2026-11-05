const PDFDocument = require("pdfkit");

const COLORS = {
  ink: "#172033",
  muted: "#667085",
  navy: "#173B67",
  blue: "#2F80ED",
  paleBlue: "#EAF3FF",
  line: "#D9E2F0",
  white: "#FFFFFF",
  total: "#F0F7FF",
};

const formatMoney = (value) =>
  `PHP ${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) =>
  new Date(value || Date.now()).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const drawRule = (document, y, x, width, color = COLORS.line) =>
  document
    .save()
    .strokeColor(color)
    .lineWidth(1)
    .moveTo(x, y)
    .lineTo(x + width, y)
    .stroke()
    .restore();

const drawLabelValue = (document, label, value, x, y, width) => {
  document
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(label.toUpperCase(), x, y, { width });
  document
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.ink)
    .text(value || "-", x, y + 12, { width });
};

module.exports = (order, customer) =>
  new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: "A4",
      margins: { top: 42, right: 42, bottom: 42, left: 42 },
      info: {
        Title: `Receipt ${order._id}`,
        Author: "UPS Battery Store",
        Subject: "Order receipt",
      },
    });
    const chunks = [];
    const contentWidth =
      document.page.width - document.page.margins.left - document.page.margins.right;
    const left = document.page.margins.left;
    const right = left + contentWidth;

    document.on("data", (chunk) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document.rect(0, 0, document.page.width, 138).fill(COLORS.navy);
    document
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor(COLORS.white)
      .text("UPS Battery Store", left, 48);
    document
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#C9D8EC")
      .text("Reliable power for every moment.", left, 81);
    document
      .roundedRect(right - 132, 47, 132, 42, 8)
      .fill(COLORS.blue);
    document
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(COLORS.white)
      .text("TRANSACTION RECEIPT", right - 120, 63, {
        width: 108,
        align: "center",
      });

    let y = 166;
    document
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor(COLORS.ink)
      .text("Order details", left, y);
    document
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text(`Order #${order._id}`, left, y + 27);
    document.text(formatDate(order.createdAt), left, y + 41);

    const status = String(order.orderStatus || "Processing").toUpperCase();
    document
      .roundedRect(right - 112, y + 5, 112, 28, 14)
      .fill(COLORS.paleBlue);
    document
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(COLORS.navy)
      .text(status, right - 102, y + 15, { width: 92, align: "center" });

    y += 78;
    document.roundedRect(left, y, contentWidth, 76, 8).fill("#F8FAFC");
    const columnWidth = contentWidth / 2 - 20;
    drawLabelValue(
      document,
      "Billed to",
      customer?.name || "Customer",
      left + 18,
      y + 15,
      columnWidth,
    );
    drawLabelValue(
      document,
      "Email",
      customer?.email || "-",
      left + 18,
      y + 43,
      columnWidth,
    );
    drawLabelValue(
      document,
      "Payment",
      order.paymentInfo?.status || "COD",
      left + contentWidth / 2,
      y + 15,
      columnWidth,
    );
    drawLabelValue(
      document,
      "Delivery",
      order.shippingInfo?.city || order.shippingInfo?.address || "Standard delivery",
      left + contentWidth / 2,
      y + 43,
      columnWidth,
    );

    y += 108;
    document
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(COLORS.ink)
      .text("Items", left, y);
    y += 22;
    document.roundedRect(left, y, contentWidth, 27, 5).fill(COLORS.navy);
    document
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(COLORS.white)
      .text("PRODUCT", left + 12, y + 9)
      .text("QTY", right - 158, y + 9, { width: 35, align: "center" })
      .text("UNIT PRICE", right - 112, y + 9, { width: 65, align: "right" })
      .text("TOTAL", right - 92, y + 9, { width: 80, align: "right" });
    y += 27;

    order.orderItems.forEach((item, index) => {
      const name = item.name || "Product";
      const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
      const nameHeight = document.heightOfString(name, { width: right - left - 190 });
      const rowHeight = Math.max(34, nameHeight + 20);
      if (index % 2 === 0)
        document.rect(left, y, contentWidth, rowHeight).fill("#F8FAFC");
      document
        .font("Helvetica")
        .fontSize(9)
        .fillColor(COLORS.ink)
        .text(name, left + 12, y + 11, { width: right - left - 190 });
      document
        .font("Helvetica")
        .fontSize(9)
        .text(String(item.quantity || 0), right - 158, y + 11, {
          width: 35,
          align: "center",
        })
        .text(formatMoney(item.price), right - 112, y + 11, {
          width: 65,
          align: "right",
        })
        .font("Helvetica-Bold")
        .text(formatMoney(lineTotal), right - 92, y + 11, {
          width: 80,
          align: "right",
        });
      drawRule(document, y + rowHeight, left, contentWidth);
      y += rowHeight;
    });

    y += 24;
    const summaryX = right - 220;
    const summaryWidth = 220;
    const summaryRow = (label, value, offset, bold = false) => {
      document
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(bold ? 12 : 9)
        .fillColor(bold ? COLORS.navy : COLORS.muted)
        .text(label, summaryX, y + offset, { width: 100 })
        .fillColor(bold ? COLORS.navy : COLORS.ink)
        .text(formatMoney(value), summaryX + 100, y + offset, {
          width: 120,
          align: "right",
        });
    };
    summaryRow("Subtotal", order.itemsPrice, 0);
    summaryRow("Tax", order.taxPrice, 19);
    summaryRow("Shipping", order.shippingPrice, 38);
    document.roundedRect(summaryX - 10, y + 62, summaryWidth + 10, 42, 7).fill(COLORS.total);
    summaryRow("TOTAL", order.totalPrice, 76, true);

    const footerY = Math.max(y + 136, document.page.height - 105);
    drawRule(document, footerY, left, contentWidth);
    document
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(COLORS.navy)
      .text("Thank you for choosing UPS Battery Store.", left, footerY + 18);
    document
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(
        "Please keep this receipt for your records. For questions, contact our support team.",
        left,
        footerY + 34,
        { width: contentWidth },
      );
    document
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text("Generated electronically • No signature required", left, footerY + 52);
    document.end();
  });
