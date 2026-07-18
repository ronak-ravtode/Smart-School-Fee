const PDFDocument = require('pdfkit');

/**
 * Generates an in-memory PDF receipt and returns it as a Base64 Data URI.
 * @param {object} transaction - Transaction database record
 * @param {object} student - Student database record
 * @param {object} guardian - Guardian database record
 * @param {object} feeStructure - FeeStructure database record
 * @returns {Promise<string>} - Base64 Data URI string
 */
const generateReceiptBase64 = (transaction, student, guardian, feeStructure) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(`data:application/pdf;base64,${result.toString('base64')}`);
      });

      doc.on('error', (err) => {
        reject(err);
      });

      // Receipt Title
      const isReversal = transaction.method === 'REVERSAL';
      doc.fontSize(22).text('SMART SCHOOL FINTECH', { align: 'center', bold: true });
      doc.fontSize(10).text(isReversal ? 'Official Fee Refund Reversal Receipt' : 'Official Fee Payment Receipt', { align: 'center' });
      doc.moveDown(1.5);

      // Receipt Section
      doc.fontSize(12).text('RECEIPT PARTICULARS', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Receipt Number : ${transaction.receiptNumber}`);
      doc.text(`Date of Issue  : ${new Date(transaction.createdAt).toLocaleString()}`);
      doc.text(`Payment Status : ${isReversal ? 'REFUND REVERSED' : 'SUCCESSFUL'}`);
      doc.moveDown(1.5);

      // Student Section
      doc.fontSize(12).text('STUDENT & GUARDIAN DETAILS', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Student Name   : ${student.name}`);
      doc.text(`Class/Section  : ${student.class}`);
      doc.text(`Guardian Name  : ${guardian.name}`);
      doc.text(`Mobile Number  : ${guardian.mobile}`);
      doc.moveDown(1.5);

      // Bill Section
      doc.fontSize(12).text(isReversal ? 'REFUND PARTICULARS' : 'BILL PARTICULARS', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Fee Component  : ${feeStructure.name}`);
      doc.text(isReversal ? `Amount Refunded: INR ${Number(transaction.amount).toFixed(2)}` : `Amount Paid    : INR ${Number(transaction.amount).toFixed(2)}`);
      doc.text(`Payment Method : ${transaction.method}`);
      if (transaction.gatewayRef) {
        doc.text(`Gateway Reference: ${transaction.gatewayRef}`);
      }
      doc.moveDown(2);

      // Footer disclaimer
      doc.fontSize(8).text(isReversal ? 'This is an official ledger reversal document confirming the processing of your refund.' : 'Thank you for your payment. Under NPCI and DPDP guidelines, standard digital logs of this transaction are securely captured in the school ledger.', { align: 'center', oblique: true });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateReceiptBase64
};
