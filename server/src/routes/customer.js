const express = require('express');
const crypto = require('crypto');
const { query, queryOne } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { hashPassword, verifyPassword } = require('../utils/password');
const { rowsToPdf } = require('../utils/reports');

const router = express.Router();
const customerOnly = requireAuth('customer');

router.get('/dashboard', customerOnly, async (req, res) => {
  const me = await queryOne('SELECT * FROM customers WHERE id=$1', [req.user.userId]);
  const recent = await query(
    `SELECT p.*, s.name service_name FROM payments p LEFT JOIN services s ON s.id=p.service_id
     WHERE p.customer_id=$1 ORDER BY p.id DESC LIMIT 5`,
    [req.user.userId]
  );
  const notifications = await query(
    "SELECT * FROM notifications WHERE recipient_type='customer' AND recipient_id=$1 ORDER BY id DESC LIMIT 10",
    [req.user.userId]
  );
  const totalSpent = await queryOne(
    "SELECT COALESCE(SUM(amount),0) s FROM payments WHERE customer_id=$1 AND status='paid'",
    [req.user.userId]
  );
  const { password_hash, ...safeMe } = me;
  res.json({
    me: safeMe,
    recent: recent.rows,
    notifications: notifications.rows,
    total_spent: Number(totalSpent.s),
  });
});

router.get('/services', customerOnly, async (req, res) => {
  const { q = '' } = req.query;
  let where = 'WHERE is_active=1';
  const params = [];
  if (q) {
    params.push(`%${q}%`);
    where += ` AND name ILIKE $1`;
  }
  const result = await query(`SELECT * FROM services ${where} ORDER BY category, name`, params);
  res.json({ services: result.rows });
});

router.post('/services/:id/request', customerOnly, async (req, res) => {
  const service = await queryOne('SELECT * FROM services WHERE id=$1', [req.params.id]);
  if (!service) return res.status(404).json({ error: 'Service not found' });
  const qty = parseInt(req.body.quantity) || 1;
  const receiptNo = `REQ-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const payment = await queryOne(
    `INSERT INTO payments (receipt_no, customer_id, service_id, quantity, amount, status)
     VALUES ($1,$2,$3,$4,$5,'requested') RETURNING *`,
    [receiptNo, req.user.userId, req.params.id, qty, Number(service.price) * qty]
  );
  res.status(201).json({ payment });
});

router.get('/payments', customerOnly, async (req, res) => {
  const result = await query(
    `SELECT p.*, s.name service_name FROM payments p LEFT JOIN services s ON s.id=p.service_id
     WHERE p.customer_id=$1 ORDER BY p.id DESC`,
    [req.user.userId]
  );
  res.json({ records: result.rows });
});

router.get('/payments/:id/receipt', customerOnly, async (req, res) => {
  const p = await queryOne(
    `SELECT p.*, s.name service_name FROM payments p LEFT JOIN services s ON s.id=p.service_id
     WHERE p.id=$1 AND p.customer_id=$2`,
    [req.params.id, req.user.userId]
  );
  if (!p) return res.status(404).json({ error: 'Receipt not found' });
  const rows = [[p.receipt_no, p.service_name, p.quantity, p.amount, p.status, p.created_at]];
  rowsToPdf(res, `Receipt - ${p.receipt_no}`,
    ['Receipt No', 'Service', 'Qty', 'Amount (NGN)', 'Status', 'Date'], rows, `${p.receipt_no}.pdf`);
});

router.put('/profile', customerOnly, async (req, res) => {
  const { full_name, phone, address } = req.body;
  const customer = await queryOne(
    'UPDATE customers SET full_name=$1, phone=$2, address=$3 WHERE id=$4 RETURNING *',
    [full_name, phone || null, address || null, req.user.userId]
  );
  const { password_hash, ...safeCustomer } = customer;
  res.json({ me: safeCustomer });
});

router.post('/change-password', customerOnly, async (req, res) => {
  const me = await queryOne('SELECT * FROM customers WHERE id=$1', [req.user.userId]);
  const { current_password, new_password } = req.body;
  if (!verifyPassword(current_password, me.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  await query('UPDATE customers SET password_hash=$1 WHERE id=$2', [hashPassword(new_password), req.user.userId]);
  res.json({ message: 'Password changed successfully' });
});

module.exports = router;
