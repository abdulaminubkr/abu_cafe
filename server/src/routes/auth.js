const express = require('express');
const crypto = require('crypto');
const { query, queryOne } = require('../db');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

const TABLES = {
  super_admin: 'super_admins',
  admin: 'admins',
  intern: 'interns',
  customer: 'customers',
};

function assertRole(role, res) {
  if (!TABLES[role]) {
    res.status(400).json({ error: 'Unknown role' });
    return false;
  }
  return true;
}

// POST /api/auth/login/:role
router.post('/login/:role', async (req, res) => {
  const { role } = req.params;
  if (!assertRole(role, res)) return;
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await queryOne(
    `SELECT * FROM ${TABLES[role]} WHERE lower(email) = $1`,
    [String(email).toLowerCase()]
  );

  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if ('status' in user && user.status === 'suspended') {
    return res.status(403).json({ error: 'This account has been suspended. Please contact the centre.' });
  }

  const token = signToken({ userId: user.id, role, name: user.full_name });
  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser, role });
});

// GET /api/auth/me - restore session on page refresh
router.get('/me', requireAuth(), async (req, res) => {
  const { role, userId } = req.user;
  if (!assertRole(role, res)) return;
  const user = await queryOne(`SELECT * FROM ${TABLES[role]} WHERE id = $1`, [userId]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password_hash, ...safeUser } = user;
  res.json({ user: safeUser, role });
});

// POST /api/auth/register/intern
// Self-service registration for interns (customers are created by an Admin instead - see /api/admin/customers).
router.post('/register/intern', async (req, res) => {
  const { full_name, email, phone, institution, department, course_of_study, matric_number, password } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required' });
  }
  const existing = await queryOne('SELECT id FROM interns WHERE lower(email) = $1', [
    String(email).toLowerCase(),
  ]);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }
  const user = await queryOne(
    `INSERT INTO interns (full_name, email, phone, institution, department, course_of_study, matric_number, password_hash, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active') RETURNING id, full_name, email`,
    [full_name, String(email).toLowerCase(), phone || null, institution || null, department || null,
     course_of_study || null, matric_number || null, hashPassword(password)]
  );
  const token = signToken({ userId: user.id, role: 'intern', name: user.full_name });
  res.status(201).json({ token, user, role: 'intern' });
});

// POST /api/auth/forgot-password/:role
// Simulated: generates a temp password and logs it server-side (no SMTP configured).
router.post('/forgot-password/:role', async (req, res) => {
  const { role } = req.params;
  if (!assertRole(role, res)) return;
  const { email } = req.body;
  const user = await queryOne(
    `SELECT * FROM ${TABLES[role]} WHERE lower(email) = $1`,
    [String(email || '').toLowerCase()]
  );
  if (user) {
    const tempPassword = crypto.randomBytes(6).toString('base64url');
    await query(`UPDATE ${TABLES[role]} SET password_hash = $1 WHERE id = $2`, [
      hashPassword(tempPassword),
      user.id,
    ]);
    // In production this would be emailed via a real mail provider.
    console.log(`[EMAIL SIMULATION] To: ${email} | Temporary password: ${tempPassword}`);
  }
  // Always return success, whether or not the email exists (don't leak account existence).
  res.json({ message: 'If that email exists, a temporary password has been sent.' });
});

module.exports = router;
