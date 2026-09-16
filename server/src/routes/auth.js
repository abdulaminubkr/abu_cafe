const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
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

const TEMP_PASSWORDS = new Map();

function tempPasswordKey(role, userId) {
  return `${role}:${userId}`;
}

function createMailTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

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

  const originalPasswordValid = user && verifyPassword(password, user.password_hash);
  const tempKey = user ? tempPasswordKey(role, user.id) : null;
  const tempReset = tempKey ? TEMP_PASSWORDS.get(tempKey) : null;
  const tempPasswordValid = tempReset && Date.now() < tempReset.expiresAt && verifyPassword(password, tempReset.hash);

  if (!user || (!originalPasswordValid && !tempPasswordValid)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if ('status' in user && user.status === 'suspended') {
    return res.status(403).json({ error: 'This account has been suspended. Please contact the centre.' });
  }

  if (tempPasswordValid) {
    TEMP_PASSWORDS.delete(tempKey);
  }

  const token = signToken({ userId: user.id, role, name: user.full_name });
  const { password_hash, ...safeUser } = user;
  res.json({
    token,
    user: safeUser,
    role,
    temporary_password: !!tempPasswordValid,
  });
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
router.post('/register/intern', async (req, res) => {
  const { full_name, email, phone, address, password, school, institution, department, course_of_study, matric_number } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required' });
  }
  const existing = await queryOne('SELECT id FROM interns WHERE lower(email) = $1', [
    String(email).toLowerCase(),
  ]);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }
  const internSchool = school || institution || null;
  const user = await queryOne(
    `INSERT INTO interns (full_name, email, phone, address, password_hash, institution, department, course_of_study, matric_number, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending_payment') RETURNING id, full_name, email`,
    [
      full_name,
      String(email).toLowerCase(),
      phone || null,
      address || null,
      hashPassword(password),
      internSchool,
      department || null,
      course_of_study || null,
      matric_number || null,
    ]
  );
  const token = signToken({ userId: user.id, role: 'intern', name: user.full_name });
  res.status(201).json({ token, user, role: 'intern' });
});

// POST /api/auth/register/customer
router.post('/register/customer', async (req, res) => {
  const { full_name, email, phone, address, password } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required' });
  }
  const existing = await queryOne('SELECT id FROM customers WHERE lower(email) = $1', [
    String(email).toLowerCase(),
  ]);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }
  const user = await queryOne(
    `INSERT INTO customers (full_name, email, phone, address, password_hash)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email`,
    [full_name, String(email).toLowerCase(), phone || null, address || null, hashPassword(password)]
  );
  const token = signToken({ userId: user.id, role: 'customer', name: user.full_name });
  res.status(201).json({ token, user, role: 'customer' });
});

// POST /api/auth/forgot-password/:role
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
    const transporter = createMailTransporter();

    if (!transporter) {
      console.error('Forgot-password email was not sent: SMTP configuration is incomplete.');
      return res.status(503).json({ error: 'Email service is not configured. Please contact the administrator.' });
    }

    try {
      await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'Your temporary A.A Dynamic password',
        text: [
          `Hello ${user.full_name || 'there'},`,
          '',
          'A temporary password was requested for your A.A Dynamic account.',
          '',
          `Temporary password: ${tempPassword}`,
          '',
          'This password expires in 30 minutes. Your existing password remains unchanged unless you update it.',
          '',
          'If you did not request this, you can ignore this email.',
        ].join('\n'),
      });
    } catch (error) {
      console.error('Forgot-password email failed:', error.message);
      return res.status(503).json({ error: 'Unable to send the temporary password email. Please try again later.' });
    }

    TEMP_PASSWORDS.set(tempPasswordKey(role, user.id), {
      hash: hashPassword(tempPassword),
      expiresAt: Date.now() + 1000 * 60 * 30,
    });
  }
  // Always return success, whether or not the email exists (don't leak account existence).
  res.json({
    message: 'If that email exists, a temporary password has been sent. It will work for 30 minutes and will not replace your current password unless you update it.',
  });
});

module.exports = router;
