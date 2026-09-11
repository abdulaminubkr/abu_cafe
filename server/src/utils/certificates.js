const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const CERT_DIR = path.join(__dirname, '..', '..', 'uploads', 'certificates');
fs.mkdirSync(CERT_DIR, { recursive: true });

const NAVY = '#0f3d2e';
const GOLD = '#c8a951';

function safeCertFilename(certificateNo) {
  return certificateNo.replace(/\//g, '-') + '.pdf';
}

/**
 * Renders a certificate PDF to uploads/certificates/<safe-filename>.pdf
 * and returns the absolute path. Resolves once the file is fully written.
 */
async function generateCertificatePdf(certificateNo, intern, trainingTitle, dateIssued, verifyUrl) {
  const filename = safeCertFilename(certificateNo);
  const filePath = path.join(CERT_DIR, filename);

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const { width, height } = doc.page;

    // Border
    doc.lineWidth(6).strokeColor(NAVY)
      .rect(28, 28, width - 56, height - 56).stroke();
    doc.lineWidth(1.5).strokeColor(GOLD)
      .rect(37, 37, width - 74, height - 74).stroke();

    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(24)
      .text('A.A DYNAMIC COMPUTER TRAINING CENTER', 0, 60, { align: 'center' });
    doc.font('Helvetica').fontSize(13)
      .text('Bakori, Katsina State, Nigeria', 0, 92, { align: 'center' });

    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(20)
      .text('CERTIFICATE OF COMPLETION', 0, 130, { align: 'center' });

    doc.fillColor(NAVY).font('Helvetica').fontSize(13)
      .text('This is to certify that', 0, 168, { align: 'center' });

    doc.font('Helvetica-Bold').fontSize(22)
      .text(intern.full_name, 0, 195, { align: 'center' });

    doc.font('Helvetica').fontSize(13)
      .text(
        `of ${intern.institution || ''}, Department of ${intern.department || ''}, has successfully completed the`,
        60, 232, { align: 'center', width: width - 120 }
      );

    doc.font('Helvetica-Bold').fontSize(15)
      .text(trainingTitle || 'SIWES / Industrial Training Programme', 0, 262, { align: 'center' });

    doc.font('Helvetica').fontSize(12)
      .text(`Training Duration: ${intern.it_duration || ''}`, 0, 290, { align: 'center' });

    // Footer
    doc.fontSize(11)
      .text(`Date Issued: ${dateIssued}`, 70, height - 100)
      .text(`Certificate No: ${certificateNo}`, 70, height - 80);

    doc.moveTo(width - 230, height - 90).lineTo(width - 70, height - 90).stroke();
    doc.fontSize(9).text('Authorized Signature', width - 230, height - 78, { width: 160, align: 'center' });

    // QR code
    const qrSize = 68;
    doc.image(qrBuffer, width / 2 - qrSize / 2, height - 118, { width: qrSize, height: qrSize });
    doc.fontSize(8).text('Scan to verify', width / 2 - 50, height - 46, { width: 100, align: 'center' });

    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = { generateCertificatePdf, safeCertFilename, CERT_DIR };
