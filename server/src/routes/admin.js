const express = require('express');
const crypto = require('crypto');
const { query, queryOne } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { hashPassword, verifyPassword } = require('../utils/password');
const { logAction, notify } = require('../utils/audit');
const { generateCertificatePdf, safeCertFilename, CERT_DIR } = require('../utils/certificates');
const { rowsToPdf, rowsToExcel } = require('../utils/reports');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const staff = requireAuth('admin', 'super_admin');

// ---------------------------------------------------------------- DASHBOARD
router.get('/dashboard', staff, async (req, res) => {
  const [
    totalInterns, activeInterns, completedInterns, totalCustomers, todayAttendance,
    monthlyRevenue, certsApproved, certsPending, totalServices, revenueByDay, attendanceByDay, recent,
  ] = await Promise.all([
    queryOne('SELECT COUNT(*) c FROM interns'),
    queryOne("SELECT COUNT(*) c FROM interns WHERE status='active'"),
    queryOne("SELECT COUNT(*) c FROM interns WHERE status='completed'"),
    queryOne('SELECT COUNT(*) c FROM customers'),
    query("SELECT COUNT(*) c FROM attendance WHERE date = to_char(CURRENT_DATE, 'YYYY-MM-DD')"),
    queryOne("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE status='paid' AND to_char(created_at,'YYYY-MM')=to_char(NOW(),'YYYY-MM')"),
    queryOne("SELECT COUNT(*) c FROM certificates WHERE status='approved'"),
    queryOne("SELECT COUNT(*) c FROM certificates WHERE status='pending'"),
    queryOne('SELECT COUNT(*) c FROM services WHERE is_active=1'),
    query(
      "SELECT to_char(created_at,'YYYY-MM-DD') AS d, SUM(amount) s FROM payments WHERE status='paid' " +
      "AND created_at >= (CURRENT_DATE - INTERVAL '6 days') GROUP BY d ORDER BY d"
    ),
    query(
      "SELECT date, status, COUNT(*) c FROM attendance " +
      "WHERE date >= to_char(CURRENT_DATE - INTERVAL '6 days', 'YYYY-MM-DD') GROUP BY date, status ORDER BY date"
    ),
    query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 10'),
  ]);

  res.json({
    stats: {
      total_interns: Number(totalInterns.c),
      active_interns: Number(activeInterns.c),
      completed_interns: Number(completedInterns.c),
      total_customers: Number(totalCustomers.c),
      today_attendance: Number(todayAttendance.rows[0].c),
      monthly_revenue: Number(monthlyRevenue.s),
      certificates_approved: Number(certsApproved.c),
      certificates_pending: Number(certsPending.c),
      total_services: Number(totalServices.c),
    },
    revenue_by_day: revenueByDay.rows,
    attendance_by_day: attendanceByDay.rows,
    recent: recent.rows,
  });
});

router.post('/change-password', staff, async (req, res) => {
  const roleTable = req.user.role === 'super_admin' ? 'super_admins' : 'admins';
  const me = await queryOne(`SELECT * FROM ${roleTable} WHERE id=$1`, [req.user.userId]);
  const { current_password, new_password } = req.body;

  if (!me) return res.status(404).json({ error: 'Account not found' });
  if (!verifyPassword(current_password, me.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  await query(`UPDATE ${roleTable} SET password_hash=$1 WHERE id=$2`, [hashPassword(new_password), req.user.userId]);
  res.json({ message: 'Password changed successfully' });
});

// ---------------------------------------------------------------- INTERNS
router.get('/interns', staff, async (req, res) => {
  const { q = '', status = '', page = 1 } = req.query;
  const perPage = 10;
  const pageNum = Math.max(parseInt(page) || 1, 1);

  let where = 'WHERE 1=1';
  const params = [];
  if (q) {
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    where += ` AND (full_name ILIKE $${params.length - 2} OR email ILIKE $${params.length - 1} OR matric_number ILIKE $${params.length})`;
  }
  if (status) {
    params.push(status);
    where += ` AND status = $${params.length}`;
  }

  const total = await queryOne(`SELECT COUNT(*) c FROM interns ${where}`, params);
  params.push(perPage, (pageNum - 1) * perPage);
  const interns = await query(
    `SELECT * FROM interns ${where} ORDER BY id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  const totalCount = Number(total.c);
  res.json({
    interns: interns.rows,
    total: totalCount,
    page: pageNum,
    pages: Math.max(Math.ceil(totalCount / perPage), 1),
  });
});

router.post('/interns', staff, upload.single('photo'), async (req, res) => {
  const f = req.body;
  const photo = req.file ? req.file.filename : null;
  try {
    const intern = await queryOne(
      `INSERT INTO interns
        (photo, full_name, gender, date_of_birth, phone, email, password_hash, address,
         institution, department, course_of_study, matric_number, it_duration, start_date,
         end_date, guardian_name, guardian_phone, emergency_contact, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'active')
       RETURNING *`,
      [photo, f.full_name, f.gender || null, f.date_of_birth || null, f.phone || null,
       String(f.email).toLowerCase(), hashPassword(f.password || 'Intern@123'), f.address || null,
       f.institution || null, f.department || null, f.course_of_study || null, f.matric_number || null,
       f.it_duration || null, f.start_date || null, f.end_date || null, f.guardian_name || null,
       f.guardian_phone || null, f.emergency_contact || null]
    );
    await logAction(req.user, 'Registered intern', f.full_name);
    res.status(201).json({ intern });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/interns/:id', staff, async (req, res) => {
  const intern = await queryOne('SELECT * FROM interns WHERE id=$1', [req.params.id]);
  if (!intern) return res.status(404).json({ error: 'Intern not found' });
  const attendance = await query(
    'SELECT * FROM attendance WHERE intern_id=$1 ORDER BY date DESC LIMIT 30',
    [req.params.id]
  );
  const pct = await attendancePercentage(req.params.id);
  const cert = await queryOne(
    'SELECT * FROM certificates WHERE intern_id=$1 ORDER BY id DESC LIMIT 1',
    [req.params.id]
  );
  res.json({ intern, attendance: attendance.rows, pct, cert });
});

router.put('/interns/:id', staff, upload.single('photo'), async (req, res) => {
  const existing = await queryOne('SELECT * FROM interns WHERE id=$1', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Intern not found' });
  const f = req.body;
  const photo = req.file ? req.file.filename : existing.photo;
  const intern = await queryOne(
    `UPDATE interns SET photo=$1, full_name=$2, gender=$3, date_of_birth=$4, phone=$5, email=$6,
      address=$7, institution=$8, department=$9, course_of_study=$10, matric_number=$11, it_duration=$12,
      start_date=$13, end_date=$14, guardian_name=$15, guardian_phone=$16, emergency_contact=$17, status=$18
      WHERE id=$19 RETURNING *`,
    [photo, f.full_name, f.gender || null, f.date_of_birth || null, f.phone || null,
     String(f.email).toLowerCase(), f.address || null, f.institution || null, f.department || null,
     f.course_of_study || null, f.matric_number || null, f.it_duration || null, f.start_date || null,
     f.end_date || null, f.guardian_name || null, f.guardian_phone || null, f.emergency_contact || null,
     f.status || 'active', req.params.id]
  );
  await logAction(req.user, 'Edited intern', intern.full_name);
  res.json({ intern });
});

router.delete('/interns/:id', staff, async (req, res) => {
  const intern = await queryOne('SELECT * FROM interns WHERE id=$1', [req.params.id]);
  await query('DELETE FROM interns WHERE id=$1', [req.params.id]);
  await logAction(req.user, 'Deleted intern', intern ? intern.full_name : req.params.id);
  res.json({ message: 'Intern deleted' });
});

router.post('/interns/:id/suspend', staff, async (req, res) => {
  const intern = await queryOne('SELECT * FROM interns WHERE id=$1', [req.params.id]);
  if (!intern) return res.status(404).json({ error: 'Intern not found' });
  const newStatus = intern.status !== 'suspended' ? 'suspended' : 'active';
  await query('UPDATE interns SET status=$1 WHERE id=$2', [newStatus, req.params.id]);
  await logAction(req.user, `Set intern status to ${newStatus}`, intern.full_name);
  res.json({ status: newStatus });
});

async function attendancePercentage(internId) {
  const total = await queryOne('SELECT COUNT(*) c FROM attendance WHERE intern_id=$1', [internId]);
  if (Number(total.c) === 0) return 0;
  const present = await queryOne(
    "SELECT COUNT(*) c FROM attendance WHERE intern_id=$1 AND status IN ('Present','Late')",
    [internId]
  );
  return Math.round((Number(present.c) / Number(total.c)) * 1000) / 10;
}

// ---------------------------------------------------------------- ATTENDANCE
router.get('/attendance', staff, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const selDate = req.query.date || today;
  const interns = await query("SELECT * FROM interns WHERE status != 'suspended' ORDER BY full_name");
  const marked = await query('SELECT intern_id, status FROM attendance WHERE date=$1', [selDate]);
  const markedMap = {};
  marked.rows.forEach((r) => { markedMap[r.intern_id] = r.status; });
  res.json({ interns: interns.rows, marked: markedMap, sel_date: selDate, today });
});

router.post('/attendance', staff, async (req, res) => {
  const { date, statuses } = req.body; // statuses: { internId: 'Present' | ... }
  const attDate = date || new Date().toISOString().slice(0, 10);
  const entries = Object.entries(statuses || {});
  for (const [internId, status] of entries) {
    await query(
      `INSERT INTO attendance (intern_id, date, status, marked_by) VALUES ($1, $2, $3, $4)
       ON CONFLICT(intern_id, date) DO UPDATE SET status=excluded.status, marked_by=excluded.marked_by`,
      [internId, attDate, status, req.user.userId]
    );
  }
  await logAction(req.user, 'Marked attendance', attDate);
  res.json({ message: 'Attendance saved' });
});

router.delete('/attendance/:id', staff, async (req, res) => {
  await query('DELETE FROM attendance WHERE id=$1', [req.params.id]);
  await logAction(req.user, 'Deleted attendance record', req.params.id);
  res.json({ message: 'Attendance record deleted' });
});

router.get('/attendance-history', staff, async (req, res) => {
  const { intern_id, month } = req.query;
  const interns = await query('SELECT id, full_name FROM interns ORDER BY full_name');
  let records = [];
  let pct = null;
  if (intern_id) {
    const mo = month || new Date().toISOString().slice(0, 7);
    const result = await query(
      'SELECT * FROM attendance WHERE intern_id=$1 AND date LIKE $2 ORDER BY date',
      [intern_id, `${mo}%`]
    );
    records = result.rows;
    pct = await attendancePercentage(intern_id);
  }
  res.json({ interns: interns.rows, records, pct });
});

// ---------------------------------------------------------------- SERVICES
router.get('/services', staff, async (req, res) => {
  const result = await query('SELECT * FROM services ORDER BY category, name');
  res.json({ services: result.rows });
});

router.post('/services', staff, async (req, res) => {
  const { name, price, unit, category } = req.body;
  const service = await queryOne(
    'INSERT INTO services (name, price, unit, category, is_active) VALUES ($1,$2,$3,$4,1) RETURNING *',
    [name, parseFloat(price), unit || '', category || 'General']
  );
  await logAction(req.user, 'Added service', name);
  res.status(201).json({ service });
});

router.put('/services/:id', staff, async (req, res) => {
  const { name, price, unit, category } = req.body;
  const service = await queryOne(
    'UPDATE services SET name=$1, price=$2, unit=$3, category=$4 WHERE id=$5 RETURNING *',
    [name, parseFloat(price), unit || '', category || 'General', req.params.id]
  );
  await logAction(req.user, 'Updated service price/details', name);
  res.json({ service });
});

router.post('/services/:id/toggle', staff, async (req, res) => {
  const service = await queryOne('SELECT * FROM services WHERE id=$1', [req.params.id]);
  if (!service) return res.status(404).json({ error: 'Service not found' });
  const newActive = service.is_active ? 0 : 1;
  await query('UPDATE services SET is_active=$1 WHERE id=$2', [newActive, req.params.id]);
  await logAction(req.user, 'Toggled service status', service.name);
  res.json({ is_active: newActive });
});

router.delete('/services/:id', staff, async (req, res) => {
  const service = await queryOne('SELECT * FROM services WHERE id=$1', [req.params.id]);
  await query('DELETE FROM services WHERE id=$1', [req.params.id]);
  await logAction(req.user, 'Deleted service', service ? service.name : req.params.id);
  res.json({ message: 'Service deleted' });
});

// ---------------------------------------------------------------- CUSTOMERS
router.get('/customers', staff, async (req, res) => {
  const { q = '' } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (q) {
    params.push(`%${q}%`, `%${q}%`);
    where += ` AND (full_name ILIKE $1 OR email ILIKE $2)`;
  }
  const result = await query(`SELECT * FROM customers ${where} ORDER BY id DESC`, params);
  res.json({ customers: result.rows });
});

router.put('/customers/:id', staff, async (req, res) => {
  const { full_name, email, phone, address } = req.body;
  const customer = await queryOne(
    'UPDATE customers SET full_name=$1, email=$2, phone=$3, address=$4 WHERE id=$5 RETURNING *',
    [full_name, String(email).toLowerCase(), phone || null, address || null, req.params.id]
  );
  await logAction(req.user, 'Edited customer', full_name);
  res.json({ customer });
});

router.delete('/customers/:id', staff, async (req, res) => {
  const customer = await queryOne('SELECT * FROM customers WHERE id=$1', [req.params.id]);
  await query('DELETE FROM customers WHERE id=$1', [req.params.id]);
  await logAction(req.user, 'Deleted customer', customer ? customer.full_name : req.params.id);
  res.json({ message: 'Customer deleted' });
});

router.post('/customers/:id/suspend', staff, async (req, res) => {
  const customer = await queryOne('SELECT * FROM customers WHERE id=$1', [req.params.id]);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  const newStatus = customer.status !== 'suspended' ? 'suspended' : 'active';
  await query('UPDATE customers SET status=$1 WHERE id=$2', [newStatus, req.params.id]);
  await logAction(req.user, `Set customer status to ${newStatus}`, customer.full_name);
  res.json({ status: newStatus });
});

// ---------------------------------------------------------------- PAYMENTS / REVENUE
router.get('/payments', staff, async (req, res) => {
  const [customers, services, recent, daily, weekly, monthly, yearly] = await Promise.all([
    query('SELECT id, full_name FROM customers ORDER BY full_name'),
    query('SELECT * FROM services WHERE is_active=1 ORDER BY category, name'),
    query(
      `SELECT p.*, s.name service_name, c.full_name customer_name FROM payments p
       LEFT JOIN services s ON s.id=p.service_id LEFT JOIN customers c ON c.id=p.customer_id
       ORDER BY p.id DESC LIMIT 25`
    ),
    queryOne("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE status='paid' AND created_at::date = CURRENT_DATE"),
    queryOne("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE status='paid' AND created_at >= (CURRENT_DATE - INTERVAL '6 days')"),
    queryOne("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE status='paid' AND to_char(created_at,'YYYY-MM')=to_char(NOW(),'YYYY-MM')"),
    queryOne("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE status='paid' AND to_char(created_at,'YYYY')=to_char(NOW(),'YYYY')"),
  ]);
  res.json({
    customers: customers.rows,
    services: services.rows,
    recent: recent.rows,
    revenue: {
      daily: Number(daily.s), weekly: Number(weekly.s),
      monthly: Number(monthly.s), yearly: Number(yearly.s),
    },
  });
});

router.post('/payments', staff, async (req, res) => {
  const { customer_id, service_id, quantity } = req.body;
  const service = await queryOne('SELECT * FROM services WHERE id=$1', [service_id]);
  if (!service) return res.status(404).json({ error: 'Service not found' });
  const qty = parseInt(quantity) || 1;
  const amount = Number(service.price) * qty;
  const receiptNo = `RCPT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const payment = await queryOne(
    `INSERT INTO payments (receipt_no, customer_id, service_id, quantity, amount, status)
     VALUES ($1,$2,$3,$4,$5,'paid') RETURNING *`,
    [receiptNo, customer_id || null, service_id, qty, amount]
  );
  await logAction(req.user, 'Recorded payment', `${receiptNo} - ${service.name} x${qty}`);
  res.status(201).json({ payment });
});

router.post('/payments/:id/approve', staff, async (req, res) => {
  const payment = await queryOne('SELECT * FROM payments WHERE id=$1', [req.params.id]);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  await query("UPDATE payments SET status='paid' WHERE id=$1", [req.params.id]);
  if (payment.customer_id) {
    await notify('customer', payment.customer_id, 'Service completed',
      `Your service request (${payment.receipt_no}) has been completed.`);
  }
  await logAction(req.user, 'Approved service request', req.params.id);
  res.json({ message: 'Payment approved' });
});

// ---------------------------------------------------------------- CERTIFICATES
router.get('/certificates', staff, async (req, res) => {
  const result = await query(
    `SELECT c.*, i.full_name, i.institution FROM certificates c
     JOIN interns i ON i.id=c.intern_id ORDER BY c.id DESC`
  );
  res.json({ certificates: result.rows });
});

router.post('/certificates/issue/:internId', staff, async (req, res) => {
  const intern = await queryOne('SELECT * FROM interns WHERE id=$1', [req.params.internId]);
  if (!intern) return res.status(404).json({ error: 'Intern not found' });
  const certNo = `AAD/CERT/${new Date().getFullYear()}/${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const trainingTitle = req.body.training_title || intern.course_of_study || 'Industrial Training Programme';
  const cert = await queryOne(
    `INSERT INTO certificates (certificate_no, intern_id, training_title, status)
     VALUES ($1,$2,$3,'pending') RETURNING *`,
    [certNo, req.params.internId, trainingTitle]
  );
  await logAction(req.user, 'Issued certificate (pending)', certNo);
  res.status(201).json({ certificate: cert });
});

router.post('/certificates/:id/:action', staff, async (req, res) => {
  const { id, action } = req.params;
  const cert = await queryOne('SELECT * FROM certificates WHERE id=$1', [id]);
  if (!cert) return res.status(404).json({ error: 'Certificate not found' });
  const intern = await queryOne('SELECT * FROM interns WHERE id=$1', [cert.intern_id]);

  if (action === 'approve' || action === 'regenerate') {
    const dateIssued = new Date().toISOString().slice(0, 10);
    const verifyUrl = `${req.protocol}://${req.get('host').replace(/:\d+$/, '')}/verify/${cert.certificate_no}`;
    await generateCertificatePdf(cert.certificate_no, intern, cert.training_title, dateIssued, verifyUrl);
    await query('UPDATE certificates SET status=\'approved\', date_issued=$1, approved_by=$2 WHERE id=$3',
      [dateIssued, req.user.userId, id]);
    await notify('intern', intern.id, 'Certificate approved',
      `Your certificate ${cert.certificate_no} has been approved and is ready to download.`);
    await logAction(req.user, `${action[0].toUpperCase()}${action.slice(1)}d certificate`, cert.certificate_no);
    return res.json({ message: 'Certificate approved and generated' });
  }
  if (action === 'reject') {
    await query("UPDATE certificates SET status='rejected' WHERE id=$1", [id]);
    await logAction(req.user, 'Rejected certificate', cert.certificate_no);
    return res.json({ message: 'Certificate rejected' });
  }
  if (action === 'revoke') {
    await query("UPDATE certificates SET status='revoked' WHERE id=$1", [id]);
    await logAction(req.user, 'Revoked certificate', cert.certificate_no);
    return res.json({ message: 'Certificate revoked' });
  }
  res.status(400).json({ error: 'Unknown action' });
});

router.get('/certificates/:id/download', staff, async (req, res) => {
  const cert = await queryOne('SELECT * FROM certificates WHERE id=$1', [req.params.id]);
  if (!cert || cert.status !== 'approved') return res.status(404).json({ error: 'Certificate not available' });
  const filePath = path.join(CERT_DIR, safeCertFilename(cert.certificate_no));
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Certificate file not found' });
  res.download(filePath, safeCertFilename(cert.certificate_no));
});

// ---------------------------------------------------------------- NOTIFICATIONS
router.get('/notifications', staff, async (req, res) => {
  const [interns, customers, sent] = await Promise.all([
    query('SELECT id, full_name FROM interns ORDER BY full_name'),
    query('SELECT id, full_name FROM customers ORDER BY full_name'),
    query('SELECT * FROM notifications ORDER BY id DESC LIMIT 30'),
  ]);
  res.json({ interns: interns.rows, customers: customers.rows, sent: sent.rows });
});

router.post('/notifications', staff, async (req, res) => {
  const { recipient_type, recipient_id, title, message } = req.body;
  await notify(recipient_type, recipient_id, title, message);
  await logAction(req.user, 'Sent notification', `${recipient_type}#${recipient_id}: ${title}`);
  res.status(201).json({ message: 'Notification sent' });
});

// ---------------------------------------------------------------- REPORTS
const REPORT_DEFS = {
  interns: ['Intern Registration Report',
    'SELECT full_name, email, phone, institution, department, matric_number, status, registration_date FROM interns ORDER BY id',
    ['Full Name', 'Email', 'Phone', 'Institution', 'Department', 'Matric No', 'Status', 'Registered']],
  customers: ['Customer Registration Report',
    'SELECT full_name, email, phone, status, created_at FROM customers ORDER BY id',
    ['Full Name', 'Email', 'Phone', 'Status', 'Registered']],
  attendance: ['Attendance Report',
    'SELECT i.full_name, a.date, a.status FROM attendance a JOIN interns i ON i.id=a.intern_id ORDER BY a.date DESC',
    ['Intern', 'Date', 'Status']],
  revenue: ['Revenue Report',
    'SELECT p.receipt_no, s.name, p.quantity, p.amount, p.status, p.created_at FROM payments p LEFT JOIN services s ON s.id=p.service_id ORDER BY p.id DESC',
    ['Receipt No', 'Service', 'Qty', 'Amount (NGN)', 'Status', 'Date']],
  services: ['Services Report',
    "SELECT name, category, price, unit, CASE is_active WHEN 1 THEN 'Active' ELSE 'Inactive' END FROM services ORDER BY category, name",
    ['Service', 'Category', 'Price (NGN)', 'Unit', 'Status']],
  certificates: ['Certificates Report',
    'SELECT c.certificate_no, i.full_name, c.training_title, c.status, c.date_issued FROM certificates c JOIN interns i ON i.id=c.intern_id ORDER BY c.id DESC',
    ['Certificate No', 'Intern', 'Training', 'Status', 'Date Issued']],
  payments: ['Payments Report',
    'SELECT p.receipt_no, c.full_name, s.name, p.amount, p.status, p.created_at FROM payments p LEFT JOIN customers c ON c.id=p.customer_id LEFT JOIN services s ON s.id=p.service_id ORDER BY p.id DESC',
    ['Receipt No', 'Customer', 'Service', 'Amount (NGN)', 'Status', 'Date']],
};

router.get('/reports', staff, (req, res) => {
  res.json({ report_types: Object.keys(REPORT_DEFS) });
});

router.get('/reports/:reportType/:fmt', staff, async (req, res) => {
  const { reportType, fmt } = req.params;
  const def = REPORT_DEFS[reportType];
  if (!def) return res.status(404).json({ error: 'Unknown report type' });
  const [title, sql, headers] = def;
  const result = await query(sql);
  const rows = result.rows.map((r) => headers.map((_, i) => Object.values(r)[i]));
  await logAction(req.user, 'Exported report', `${reportType} as ${fmt}`);

  if (fmt === 'pdf') return rowsToPdf(res, title, headers, rows, `${reportType}_report.pdf`);
  if (fmt === 'excel') return rowsToExcel(res, title, headers, rows, `${reportType}_report.xlsx`);
  res.status(400).json({ error: 'Unknown format' });
});

module.exports = router;
