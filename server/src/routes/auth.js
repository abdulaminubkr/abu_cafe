const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { query, queryOne } = require('../db');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signToken, requireAuth } = require('../middleware/auth');
const { normalizeJambSubjects } = require('../utils/jambSubjects');
const { upload } = require('../middleware/upload');

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
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
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

  try {
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
    return res.json({
      token,
      user: safeUser,
      role,
      temporary_password: !!tempPasswordValid,
    });
  } catch (error) {
    console.error('Authentication login failed:', error.code || 'UNKNOWN', error.message);
    return res.status(500).json({ error: 'Unable to log in right now. Please try again later.' });
  }
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
router.post('/register/intern', upload.single('passport'), async (req, res) => {
  try {
    const {
      full_name, first_name, surname, email, phone, address, password, school,
      institution, department, course_of_study, matric_number, gender,
      jamb_subjects, date_of_birth, place_of_birth, state, lga,
      jamb_profile_code, bring_laptop, graduation_year, training_day,
      training_time, parent_name, parent_phone, applicant_marked_paid, rules_accepted,
    } = req.body;
    const registrationType = req.body.registration_type || 'jamb';
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }
    if (!['jamb', 'intern'].includes(registrationType)) {
      return res.status(400).json({ error: 'Registration type must be jamb or intern.' });
    }

    let normalizedSubjects = null;
    if (registrationType === 'jamb') {
      try {
        normalizedSubjects = normalizeJambSubjects(
          typeof jamb_subjects === 'string' ? JSON.parse(jamb_subjects) : jamb_subjects
        );
      } catch (error) {
        return res.status(400).json({ error: error instanceof SyntaxError ? 'JAMB subjects must be valid JSON.' : error.message });
      }
    }

    if (registrationType === 'intern') {
      const existing = await queryOne(
        'SELECT id FROM customers WHERE lower(email) = $1',
        [String(email).toLowerCase()]
      );
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }

      const customer = await queryOne(
        `INSERT INTO customers (full_name, email, phone, address, password_hash)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, full_name, email, phone, address, status, created_at`,
        [
          full_name,
          String(email).toLowerCase(),
          phone || null,
          address || null,
          hashPassword(password),
        ]
      );
      const token = signToken({ userId: customer.id, role: 'customer', name: customer.full_name });
      return res.status(201).json({ token, user: customer, role: 'customer' });
    }

    const existing = await queryOne('SELECT id FROM interns WHERE lower(email) = $1', [
      String(email).toLowerCase(),
    ]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const internSchool = school || institution || null;
    const user = await queryOne(
      `INSERT INTO interns (
         full_name, first_name, surname, email, phone, address, password_hash,
         institution, department, course_of_study, matric_number, gender,
         date_of_birth, place_of_birth, state, lga, jamb_profile_code,
         bring_laptop, graduation_year, jamb_subjects, training_day, training_time,
         guardian_name, guardian_phone, photo, applicant_marked_paid, rules_accepted,
         registration_type, status
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
         $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
         'pending_payment'
       ) RETURNING id, full_name, email`,
      [
        full_name,
        first_name || null,
        surname || null,
        String(email).toLowerCase(),
        phone || null,
        address || null,
        hashPassword(password),
        internSchool,
        department || null,
        course_of_study || null,
        registrationType === 'jamb' ? (matric_number || null) : null,
        gender === 'Female' ? 'Female' : 'Male',
        date_of_birth || null,
        place_of_birth || null,
        state || null,
        lga || null,
        registrationType === 'jamb' ? (jamb_profile_code || null) : null,
        bring_laptop || null,
        graduation_year || null,
        normalizedSubjects,
        training_day || null,
        training_time || null,
        parent_name || null,
        parent_phone || null,
        req.file ? req.file.filename : null,
        applicant_marked_paid === 'true',
        rules_accepted === 'true',
        registrationType,
      ]
    );

    const token = signToken({ userId: user.id, role: 'intern', name: user.full_name });
    res.status(201).json({ token, user, role: 'intern' });
  } catch (error) {
    console.error('Intern registration failed:', error);

    const dbErrorMessage = (
      error && (
        error.message?.includes('tenant/user') ||
        error.message?.includes('password authentication failed') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ENOTFOUND') ||
        error.code === 'XX000' ||
        error.code === 'ECONNREFUSED'
      )
    )
      ? 'Database connection failed. Please contact the administrator or check the database configuration.'
      : 'Registration failed. Please try again.';

    return res.status(500).json({ error: dbErrorMessage });
  }
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
