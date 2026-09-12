const express = require('express');
const path = require('path');
const fs = require('fs');
const { query, queryOne } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { hashPassword, verifyPassword } = require('../utils/password');
const { rowsToPdf } = require('../utils/reports');
const { safeCertFilename, CERT_DIR } = require('../utils/certificates');

const router = express.Router();
const internOnly = requireAuth('intern');

async function attendancePercentage(internId) {
  const total = await queryOne('SELECT COUNT(*) c FROM attendance WHERE intern_id=$1', [internId]);
  if (Number(total.c) === 0) return 0;
  const present = await queryOne(
    "SELECT COUNT(*) c FROM attendance WHERE intern_id=$1 AND status IN ('Present','Late')",
    [internId]
  );
  return Math.round((Number(present.c) / Number(total.c)) * 1000) / 10;
}

router.get('/dashboard', internOnly, async (req, res) => {
  const me = await queryOne('SELECT * FROM interns WHERE id=$1', [req.user.userId]);
  const pct = await attendancePercentage(req.user.userId);
  const cert = await queryOne(
    'SELECT * FROM certificates WHERE intern_id=$1 ORDER BY id DESC LIMIT 1',
    [req.user.userId]
  );
  const notifications = await query(
    "SELECT * FROM notifications WHERE recipient_type='intern' AND recipient_id=$1 ORDER BY id DESC LIMIT 10",
    [req.user.userId]
  );
  const recentAttendance = await query(
    'SELECT * FROM attendance WHERE intern_id=$1 ORDER BY date DESC LIMIT 10',
    [req.user.userId]
  );
  const receipt = await queryOne(
    'SELECT * FROM intern_payments WHERE intern_id=$1 ORDER BY id DESC LIMIT 1',
    [req.user.userId]
  );
  const { password_hash, ...safeMe } = me;
  res.json({
    me: safeMe, pct, cert,
    notifications: notifications.rows,
    recent_attendance: recentAttendance.rows,
    receipt: receipt || null,
  });
});

router.get('/receipt', internOnly, async (req, res) => {
  const receipt = await queryOne(
    'SELECT * FROM intern_payments WHERE intern_id=$1 ORDER BY id DESC LIMIT 1',
    [req.user.userId]
  );
  if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
  const me = await queryOne('SELECT full_name, email, institution FROM interns WHERE id=$1', [req.user.userId]);
  res.json({ receipt: { ...receipt, intern_name: me.full_name, intern_email: me.email, institution: me.institution } });
});

router.put('/profile', internOnly, upload.single('photo'), async (req, res) => {
  const existing = await queryOne('SELECT * FROM interns WHERE id=$1', [req.user.userId]);
  const f = req.body;
  const photo = req.file ? req.file.filename : existing.photo;
  const intern = await queryOne(
    `UPDATE interns SET photo=$1, phone=$2, address=$3, guardian_name=$4, guardian_phone=$5,
     emergency_contact=$6 WHERE id=$7 RETURNING *`,
    [photo, f.phone || null, f.address || null, f.guardian_name || null,
     f.guardian_phone || null, f.emergency_contact || null, req.user.userId]
  );
  const { password_hash, ...safeIntern } = intern;
  res.json({ me: safeIntern });
});

router.post('/change-password', internOnly, async (req, res) => {
  const me = await queryOne('SELECT * FROM interns WHERE id=$1', [req.user.userId]);
  const { current_password, new_password } = req.body;
  if (!verifyPassword(current_password, me.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  await query('UPDATE interns SET password_hash=$1 WHERE id=$2', [hashPassword(new_password), req.user.userId]);
  res.json({ message: 'Password changed successfully' });
});

router.get('/attendance', internOnly, async (req, res) => {
  const records = await query('SELECT * FROM attendance WHERE intern_id=$1 ORDER BY date DESC', [req.user.userId]);
  const pct = await attendancePercentage(req.user.userId);
  res.json({ records: records.rows, pct });
});

router.get('/attendance/download', internOnly, async (req, res) => {
  const me = await queryOne('SELECT * FROM interns WHERE id=$1', [req.user.userId]);
  const result = await query(
    'SELECT date, status FROM attendance WHERE intern_id=$1 ORDER BY date',
    [req.user.userId]
  );
  const rows = result.rows.map((r) => [r.date, r.status]);
  rowsToPdf(res, `Attendance Report - ${me.full_name}`, ['Date', 'Status'], rows, 'attendance_report.pdf');
});

router.get('/certificate/download', internOnly, async (req, res) => {
  const cert = await queryOne(
    "SELECT * FROM certificates WHERE intern_id=$1 AND status='approved' ORDER BY id DESC LIMIT 1",
    [req.user.userId]
  );
  if (!cert) return res.status(404).json({ error: 'No approved certificate available yet' });
  const filePath = path.join(CERT_DIR, safeCertFilename(cert.certificate_no));
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Certificate file not found' });
  res.download(filePath, safeCertFilename(cert.certificate_no));
});

module.exports = router;
