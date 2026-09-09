const express = require('express');
const { queryOne } = require('../db');

const router = express.Router();

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
