const express = require('express');
const { queryOne } = require('../db');

const router = express.Router();

router.get('/api/registration-settings', async (req, res) => {
  const keys = ['payment_bank_name', 'payment_account_name', 'payment_account_number', 'payment_amount', 'payment_note'];
  const result = await queryOne(
    'SELECT json_object_agg(key, value) AS settings FROM settings WHERE key = ANY($1)',
    [keys]
  );
  res.json({
    settings: {
      payment_bank_name: 'Zenith Bank',
      payment_account_name: 'A.A Dynamic Computer Training Center Bakori',
      payment_account_number: '0116118501',
      payment_amount: '3500',
      payment_note: 'Come along with your receipt to the training center for payment verification.',
      ...(result?.settings || {}),
    },
  });
});

router.get('/verify/:certNo(.*)', async (req, res) => {
  const certNo = req.params.certNo;
  const cert = await queryOne(
    `SELECT c.*, i.full_name, i.institution, i.department FROM certificates c
     JOIN interns i ON i.id=c.intern_id WHERE c.certificate_no=$1`,
    [certNo]
  );
  res.json({ cert: cert || null, cert_no: certNo });
});

module.exports = router;
