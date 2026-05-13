const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;

const money = (value) =>
  `NGN ${new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))}`;

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date ? new Date(date) : new Date());

const cleanText = (value = "") =>
  String(value)
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const pdfEscape = (value = "") =>
  cleanText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const wrapText = (text, maxChars) => {
  const words = cleanText(text).split(" ").filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
};

class PdfPage {
  constructor() {
    this.ops = [];
  }

  fillColor(hex) {
    const [r, g, b] = hex.match(/[0-9a-f]{2}/gi).map((part) => parseInt(part, 16) / 255);
    this.ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
  }

  strokeColor(hex) {
    const [r, g, b] = hex.match(/[0-9a-f]{2}/gi).map((part) => parseInt(part, 16) / 255);
    this.ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
  }

  rect(x, y, width, height, color) {
    this.fillColor(color);
    this.ops.push(`${x} ${PAGE_HEIGHT - y - height} ${width} ${height} re f`);
  }

  line(x1, y1, x2, y2, color = "E5E7EB", width = 1) {
    this.strokeColor(color);
    this.ops.push(`${width} w ${x1} ${PAGE_HEIGHT - y1} m ${x2} ${PAGE_HEIGHT - y2} l S`);
  }

  text(text, x, y, options = {}) {
    const {
      size = 10,
      font = "F1",
      color = "111827",
      align = "left",
      width = 0,
    } = options;
    const safeText = pdfEscape(text);
    const textWidth = safeText.length * size * 0.5;
    const offset = align === "right" && width ? width - textWidth : 0;

    this.fillColor(color);
    this.ops.push(`BT /${font} ${size} Tf ${x + offset} ${PAGE_HEIGHT - y} Td (${safeText}) Tj ET`);
  }

  content() {
    return this.ops.join("\n");
  }
}

const addLabelValue = (page, label, value, x, y, valueWidth = 170) => {
  page.text(label, x, y, { size: 8, color: "6B7280", font: "F2" });
  wrapText(value, 28).slice(0, 2).forEach((line, index) => {
    page.text(line, x, y + 14 + index * 12, { size: 10, color: "111827", width: valueWidth });
  });
};

const buildObjects = (pages) => {
  const pageCount = pages.length;
  const fontStartId = 3 + pageCount;
  const contentStartId = fontStartId + 2;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids ${pages.map((_, index) => `${3 + index} 0 R`).join(" ")} /Count ${pageCount} >>`,
  ];

  pages.forEach((_, index) => {
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontStartId} 0 R /F2 ${fontStartId + 1} 0 R >> >> /Contents ${contentStartId + index} 0 R >>`
    );
  });

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  pages.forEach((page) => {
    const content = page.content();
    objects.push(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
  });

  return objects;
};

const renderPdf = (pages) => {
  const objects = buildObjects(pages);
  const chunks = ["%PDF-1.4\n"];
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(chunks.join("")));
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefOffset = Buffer.byteLength(chunks.join(""));
  chunks.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  offsets.slice(1).forEach((offset) => {
    chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  });
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return Buffer.from(chunks.join(""), "utf8");
};

export const generateReceiptPdf = (order, user = {}) => {
  const page = new PdfPage();
  const receiptNumber = order.paymentReference || order.orderNumber;
  const customerName = user.name || order.billingAddress?.fullName || order.shippingAddress?.fullName || "Customer";
  const paidAt = order.paidAt || order.updatedAt || new Date();

  page.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F8FAFC");
  page.rect(0, 0, PAGE_WIDTH, 142, "860181");
  page.rect(0, 128, PAGE_WIDTH, 14, "FF7A00");
  page.text("CheepCart", MARGIN, 58, { size: 24, font: "F2", color: "FFFFFF" });
  page.text("Payment Receipt", MARGIN, 90, { size: 12, color: "FDE68A", font: "F2" });
  page.text("PAID", PAGE_WIDTH - 142, 58, { size: 20, font: "F2", color: "FFFFFF" });
  page.text(`Receipt: ${receiptNumber}`, PAGE_WIDTH - 222, 90, { size: 9, color: "FFFFFF" });

  page.rect(MARGIN, 174, PAGE_WIDTH - MARGIN * 2, 118, "FFFFFF");
  page.line(MARGIN, 174, PAGE_WIDTH - MARGIN, 174, "E5E7EB");
  addLabelValue(page, "BILLED TO", customerName, MARGIN + 24, 205);
  addLabelValue(page, "EMAIL", order.customerEmail, MARGIN + 24, 247);
  addLabelValue(page, "ORDER NO.", order.orderNumber, 318, 205);
  addLabelValue(page, "PAID ON", formatDate(paidAt), 318, 247);

  page.text("Purchase Summary", MARGIN, 336, { size: 15, font: "F2", color: "111827" });
  page.rect(MARGIN, 356, PAGE_WIDTH - MARGIN * 2, 30, "111827");
  page.text("Item", MARGIN + 16, 376, { size: 9, font: "F2", color: "FFFFFF" });
  page.text("Qty", 360, 376, { size: 9, font: "F2", color: "FFFFFF" });
  page.text("Amount", PAGE_WIDTH - 140, 376, { size: 9, font: "F2", color: "FFFFFF" });

  let y = 416;
  order.items.slice(0, 9).forEach((item, index) => {
    if (index % 2 === 0) page.rect(MARGIN, y - 18, PAGE_WIDTH - MARGIN * 2, 34, "FFFFFF");
    const name = wrapText(item.name, 38)[0];
    page.text(name, MARGIN + 16, y, { size: 10, color: "111827" });
    page.text(String(item.quantity), 360, y, { size: 10, color: "111827" });
    page.text(money(item.subtotal), PAGE_WIDTH - 188, y, {
      size: 10,
      color: "111827",
      align: "right",
      width: 92,
    });
    page.line(MARGIN, y + 16, PAGE_WIDTH - MARGIN, y + 16, "E5E7EB");
    y += 36;
  });

  if (order.items.length > 9) {
    page.text(`+ ${order.items.length - 9} more item(s)`, MARGIN + 16, y, { size: 9, color: "6B7280" });
    y += 28;
  }

  const totalsX = PAGE_WIDTH - 236;
  const totalsY = Math.max(y + 22, 620);
  page.rect(totalsX, totalsY - 26, 194, 128, "FFFFFF");
  page.text("Subtotal", totalsX + 18, totalsY, { size: 10, color: "374151" });
  page.text(money(order.pricing?.subtotal), totalsX + 80, totalsY, { size: 10, align: "right", width: 88 });
  page.text("Delivery", totalsX + 18, totalsY + 25, { size: 10, color: "374151" });
  page.text(money(order.pricing?.shippingTotal ?? order.pricing?.deliveryFee), totalsX + 80, totalsY + 25, {
    size: 10,
    align: "right",
    width: 88,
  });
  page.line(totalsX + 18, totalsY + 44, totalsX + 176, totalsY + 44, "E5E7EB");
  page.text("Total Paid", totalsX + 18, totalsY + 70, { size: 12, font: "F2", color: "111827" });
  page.text(money(order.pricing?.totalAmount), totalsX + 65, totalsY + 70, {
    size: 12,
    font: "F2",
    color: "860181",
    align: "right",
    width: 104,
  });

  page.rect(MARGIN, 730, PAGE_WIDTH - MARGIN * 2, 58, "FFF7ED");
  page.text("Thank you for shopping with CheepCart.", MARGIN + 18, 756, {
    size: 11,
    font: "F2",
    color: "9A3412",
  });
  page.text("Keep this receipt for your records. We will notify you as your order moves.", MARGIN + 18, 776, {
    size: 9,
    color: "9A3412",
  });

  return renderPdf([page]);
};
