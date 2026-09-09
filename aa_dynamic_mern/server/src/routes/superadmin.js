const express = require('express');
const { query, queryOne } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { hashPassword } = require('../utils/password');
const { logAction } = require('../utils/audit');

const router = express.Router();
const superOnly = requireAuth('super_admin');

router.get('/dashboard', superOnly, async (req, res) => {
  const [totalAdmins, activeAdmins, totalInterns, totalCustomers, monthlyRevenue, logs] = await Promise.all([
    queryOne('SELECT COUNT(*) c FROM admins'),
    queryOne("SELECT COUNT(*) c FROM admins WHERE status='active'"),
    queryOne('SELECT COUNT(*) c FROM interns'),
    queryOne('SELECT COUNT(*) c FROM customers'),
    queryOne("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE status='paid' AND to_char(created_at,'YYYY-MM')=to_char(NOW(),'YYYY-MM')"),
    query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 20'),
  ]);
  res.json({
    stats: {
      total_admins: Number(totalAdmins.c),
      active_admins: Number(activeAdmins.c),
      total_interns: Number(totalInterns.c),
      total_customers: Number(totalCustomers.c),
      monthly_revenue: Number(monthlyRevenue.s),
    },
    logs: logs.rows,
  });
});

router.get('/admins', superOnly, async (req, res) => {
  const result = await query('SELECT * FROM admins ORDER BY id DESC');
  res.json({ admins: result.rows });
});

router.post('/admins', superOnly, async (req, res) => {
  const { full_name, email, phone, password } = req.body;
  const existing = await queryOne('SELECT id FROM admins WHERE lower(email)=$1', [String(email).toLowerCase()]);
  if (existing) return res.status(409).json({ error: 'An admin with this email already exists' });
  const admin = await queryOne(
    'INSERT INTO admins (full_name, email, phone, password_hash, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING id, full_name, email, phone, status, created_at',
    [full_name, String(email).toLowerCase(), phone || null, hashPassword(password || 'Admin@123'), req.user.userId]
  );
  await logAction(req.user, 'Created admin account', full_name);
  res.status(201).json({ admin });
});

router.put('/admins/:id', superOnly, async (req, res) => {
  const { full_name, email, phone } = req.body;
  const admin = await queryOne(
    'UPDATE admins SET full_name=$1, email=$2, phone=$3 WHERE id=$4 RETURNING id, full_name, email, phone, status, created_at',
    [full_name, String(email).toLowerCase(), phone || null, req.params.id]
  );
  await logAction(req.user, 'Edited admin account', full_name);
  res.json({ admin });
});

router.post('/admins/:id/suspend', superOnly, async (req, res) => {
  const admin = await queryOne('SELECT * FROM admins WHERE id=$1', [req.params.id]);
  if (!admin) return res.status(404).json({ error: 'Admin not found' });
  const newStatus = admin.status !== 'suspended' ? 'suspended' : 'active';
  await query('UPDATE admins SET status=$1 WHERE id=$2', [newStatus, req.params.id]);
  await logAction(req.user, `Set admin status to ${newStatus}`, admin.full_name);
  res.json({ status: newStatus });
});

router.delete('/admins/:id', superOnly, async (req, res) => {
  const admin = await queryOne('SELECT * FROM admins WHERE id=$1', [req.params.id]);
  await query('DELETE FROM admins WHERE id=$1', [req.params.id]);
  await logAction(req.user, 'Deleted admin account', admin ? admin.full_name : req.params.id);
  res.json({ message: 'Admin deleted' });
});

router.get('/logs', superOnly, async (req, res) => {
  const { q = '' } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (q) {
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    where += ` AND (action ILIKE $1 OR details ILIKE $2 OR actor_name ILIKE $3)`;
  }
  const result = await query(`SELECT * FROM audit_logs ${where} ORDER BY id DESC LIMIT 200`, params);
  res.json({ entries: result.rows });
});

router.get('/settings', superOnly, async (req, res) => {
  const result = await query('SELECT * FROM settings');
  const settings = {};
  result.rows.forEach((r) => { settings[r.key] = r.value; });
  res.json({ settings });
});

router.put('/settings', superOnly, async (req, res) => {
  const entries = Object.entries(req.body || {});
  for (const [key, value] of entries) {
    await query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      [key, value]
    );
  }
  await logAction(req.user, 'Updated system settings', '');
  res.json({ message: 'Settings saved' });
});

module.exports = router;
