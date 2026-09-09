const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const NAVY = '#0f3d2e';

/**
 * Streams a landscape PDF table report directly to an Express response.
 * headers: string[]; rows: array of arrays (same order as headers).
 */
function rowsToPdf(res, title, headers, rows, filename) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
  doc.pipe(res);

  doc.font('Helvetica-Bold').fontSize(16).fillColor(NAVY)
    .text('A.A Dynamic Computer Training Center Bakori', { align: 'center' });
  doc.font('Helvetica-Bold').fontSize(13).text(title, { align: 'center' });
  doc.moveDown();

  const startX = 30;
  let y = doc.y;
  const usableWidth = doc.page.width - 60;
  const colWidth = usableWidth / headers.length;
  const rowHeight = 18;

  const drawRow = (cells, isHeader) => {
    if (y > doc.page.height - 60) {
      doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
      y = 30;
    }
    doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(8)
      .fillColor(isHeader ? '#ffffff' : '#222222');
    if (isHeader) {
      doc.rect(startX, y, usableWidth, rowHeight).fill(NAVY);
      doc.fillColor('#ffffff');
    }
    cells.forEach((cell, i) => {
      doc.text(String(cell ?? ''), startX + i * colWidth + 4, y + 5, {
        width: colWidth - 8, height: rowHeight, ellipsis: true,
      });
    });
    y += rowHeight;
  };

  drawRow(headers, true);
  rows.forEach((r) => drawRow(r, false));

  doc.end();
}

/**
 * Streams an Excel (.xlsx) report directly to an Express response.
 */
async function rowsToExcel(res, title, headers, rows, filename) {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet((title || 'Report').substring(0, 31));

  ws.addRow(headers);
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F3D2E' } };
  });

  rows.forEach((r) => ws.addRow(r));

  ws.columns.forEach((col) => {
    let maxLen = 10;
    col.eachCell({ includeEmpty: true }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen + 2, 40);
  });

  await wb.xlsx.write(res);
  res.end();
}

module.exports = { rowsToPdf, rowsToExcel };
