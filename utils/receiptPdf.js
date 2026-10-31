const PDFDocument = require("pdfkit");

module.exports = (order, customer) =>
  new Promise((resolve, reject) => {
    const document = new PDFDocument({ margin: 50 });
    const chunks = [];
    document.on("data", (chunk) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    const money = (value) =>
      `PHP ${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
    document.fontSize(20).text("UPS Battery Store", { bold: true });
    document.fontSize(10).fillColor("#64748b").text("Transaction receipt");
    document.moveDown();
    document.fillColor("#111827").fontSize(11).text(`Order: #${order._id}`);
    document.text(
      `Date: ${new Date(order.createdAt || Date.now()).toLocaleString("en-PH")}`,
    );
    document.text(`Status: ${order.orderStatus}`);
    document.text(
      `Customer: ${customer.name || "Customer"} <${customer.email}>`,
    );
    document.moveDown();
    document.fontSize(12).text("Products", { underline: true });
    document.moveDown(0.5);
    order.orderItems.forEach((item) => {
      const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
      document
        .fontSize(10)
        .text(`${item.name} x ${item.quantity} - ${money(lineTotal)}`);
    });
    document.moveDown();
    document.text(`Subtotal: ${money(order.itemsPrice)}`);
    document.text(`Tax: ${money(order.taxPrice)}`);
    document.text(`Shipping: ${money(order.shippingPrice)}`);
    document
      .fontSize(13)
      .text(`Grand total: ${money(order.totalPrice)}`, { underline: true });
    document.moveDown();
    document
      .fontSize(10)
      .fillColor("#64748b")
      .text(`Payment method: ${order.paymentInfo?.status || "COD"}`);
    document.text("Thank you for your order.");
    document.end();
  });
