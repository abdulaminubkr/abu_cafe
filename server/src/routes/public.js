const express = require('express');
const { query, queryOne } = require('../db');

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

// GET /api/public/services - no auth required, used on the landing page
router.get('/api/public/services', async (req, res) => {
  const result = await query(
    "SELECT name, price, unit, category FROM services WHERE is_active=1 ORDER BY category, name"
  );
  res.json({ services: result.rows });
});

module.exports = router;
