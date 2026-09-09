/**
 * Seeds the Supabase (Postgres) database with a default Super Admin, Admin,
 * and the full A.A Dynamic service price list. Safe to re-run.
 *
 * Run with: npm run seed
 *
 * Note: this project already has these seeded in Supabase from the previous
 * (Flask) version of this app, using password hashes in the same format
 * this Node app's password.js produces -- so you likely don't need to run
 * this at all. It's here for setting up a fresh/different Supabase project.
 */
require('dotenv').config();
const { pool, query, queryOne } = require('./db');
const { hashPassword } = require('./utils/password');

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS super_admins (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_by INTEGER REFERENCES super_admins(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS interns (
    id SERIAL PRIMARY KEY,
    photo TEXT, full_name TEXT NOT NULL, gender TEXT, date_of_birth TEXT, phone TEXT,
    email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, address TEXT,
    institution TEXT, department TEXT, course_of_study TEXT, matric_number TEXT,
    it_duration TEXT, start_date TEXT, end_date TEXT, guardian_name TEXT,
    guardian_phone TEXT, emergency_contact TEXT,
    registration_date TIMESTAMP NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY, full_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
    phone TEXT, address TEXT, password_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL, price NUMERIC(12,2) NOT NULL,
    unit TEXT DEFAULT '', category TEXT DEFAULT 'General',
    is_active INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY, intern_id INTEGER NOT NULL REFERENCES interns(id) ON DELETE CASCADE,
    date TEXT NOT NULL, status TEXT NOT NULL, marked_by INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(), UNIQUE(intern_id, date)
);
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY, receipt_no TEXT UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1, amount NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'paid', created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS certificates (
    id SERIAL PRIMARY KEY, certificate_no TEXT UNIQUE NOT NULL,
    intern_id INTEGER NOT NULL REFERENCES interns(id) ON DELETE CASCADE,
    training_title TEXT, status TEXT NOT NULL DEFAULT 'pending', date_issued TEXT,
    approved_by INTEGER, created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY, recipient_type TEXT NOT NULL, recipient_id INTEGER NOT NULL,
    title TEXT NOT NULL, message TEXT NOT NULL, is_read INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY, actor_type TEXT NOT NULL, actor_id INTEGER NOT NULL,
    actor_name TEXT, action TEXT NOT NULL, details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY, value TEXT
);
`;

const SERVICES = [
  ['Internet Browsing (1 Hour)', 500, 'per hour', 'Internet'],
  ['Computer Training (Monthly)', 25000, 'monthly', 'Training'],
  ['Computer Appreciation Course', 15000, 'course', 'Training'],
  ['Graphic Design Training', 35000, 'course', 'Training'],
  ['Data Analysis Training', 50000, 'course', 'Training'],
  ['Desktop Publishing', 30000, 'course', 'Training'],
  ['Typing', 300, 'per page', 'Typing & Printing'],
  ['Printing (Black & White)', 100, 'per page', 'Typing & Printing'],
  ['Printing (Colour)', 300, 'per page', 'Typing & Printing'],
  ['Photocopy (A4)', 50, 'per page', 'Typing & Printing'],
  ['Scanning', 200, 'per page', 'Typing & Printing'],
  ['Lamination (A4)', 500, 'per item', 'Typing & Printing'],
  ['Spiral Binding', 800, 'per item', 'Typing & Printing'],
  ['Passport Photograph', 2000, 'per session', 'Design'],
  ['CV Design', 3000, 'per item', 'Design'],
  ['ID Card Design', 2500, 'per item', 'Design'],
  ['Business Card Design', 5000, 'per item', 'Design'],
  ['Banner Design', 10000, 'per item', 'Design'],
  ['Logo Design', 20000, 'per item', 'Design'],
  ['JAMB Registration', 2500, 'excl. JAMB fees', 'Registration'],
  ['WAEC Registration Assistance', 2000, 'per item', 'Registration'],
  ['NECO Registration Assistance', 2000, 'per item', 'Registration'],
  ['NABTEB Registration Assistance', 2000, 'per item', 'Registration'],
  ['NIN Slip Printing', 300, 'per item', 'Documents'],
  ['BVN Slip Printing', 300, 'per item', 'Documents'],
  ['Online Job Application', 1500, 'per item', 'Registration'],
  ['NYSC Registration Assistance', 2000, 'per item', 'Registration'],
  ['Online Form Processing', 1500, 'per item', 'Registration'],
  ['Passport Application Assistance', 5000, 'per item', 'Documents'],
  ['Passport Data Page Photocopy', 100, 'per page', 'Documents'],
  ['Document Editing', 500, 'per page', 'Typing & Printing'],
  ['Project Typing', 500, 'per page', 'Typing & Printing'],
  ['Project Printing & Binding', 15000, 'per item', 'Typing & Printing'],
  ['Certificate Printing', 500, 'per item', 'Typing & Printing'],
  ['Passport Document Scanning Package', 1000, 'per package', 'Documents'],
];

const DEFAULT_SETTINGS = [
  ['centre_name', 'A.A Dynamic Computer Training Center Bakori'],
  ['centre_address', 'Bakori, Katsina State, Nigeria'],
  ['currency_symbol', '\u20a6'],
];

async function run() {
  await query(SCHEMA_SQL);

  const superAdminCount = await queryOne('SELECT COUNT(*) c FROM super_admins');
  if (Number(superAdminCount.c) === 0) {
    await query(
      'INSERT INTO super_admins (full_name, email, password_hash) VALUES ($1, $2, $3)',
      ['System Owner', 'superadmin@aadynamic.com', hashPassword('SuperAdmin@123')]
    );
    console.log('Created Super Admin -> superadmin@aadynamic.com / SuperAdmin@123');
  }

  const adminCount = await queryOne('SELECT COUNT(*) c FROM admins');
  if (Number(adminCount.c) === 0) {
    await query(
      'INSERT INTO admins (full_name, email, phone, password_hash) VALUES ($1, $2, $3, $4)',
      ['Front Desk Admin', 'admin@aadynamic.com', '08000000000', hashPassword('Admin@123')]
    );
    console.log('Created Admin -> admin@aadynamic.com / Admin@123');
  }

  const serviceCount = await queryOne('SELECT COUNT(*) c FROM services');
  if (Number(serviceCount.c) === 0) {
    for (const [name, price, unit, category] of SERVICES) {
      await query('INSERT INTO services (name, price, unit, category) VALUES ($1,$2,$3,$4)', [name, price, unit, category]);
    }
    console.log(`Seeded ${SERVICES.length} services`);
  }

  for (const [key, value] of DEFAULT_SETTINGS) {
    await query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING', [key, value]);
  }

  console.log('Supabase database ready.');
  await pool.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
