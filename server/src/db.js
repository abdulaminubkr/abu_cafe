require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.warn(
    'WARNING: DATABASE_URL is not set. Copy .env.example to .env and fill in ' +
    'your Supabase database password before starting the server.'
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

// query() mirrors node-postgres's normal API: query(text, params) -> { rows, rowCount }
async function query(text, params) {
  return pool.query(text, params);
}

// Convenience: run a query and return just the first row (or undefined).
async function queryOne(text, params) {
  const result = await pool.query(text, params);
  return result.rows[0];
}

async function ensureInternApplicationSchema() {
  if (!process.env.DATABASE_URL) {
    console.warn('Skipping intern registration schema migration because DATABASE_URL is not set.');
    return;
  }

  try {
    await pool.query(`
      ALTER TABLE interns
        ADD COLUMN IF NOT EXISTS jamb_subjects TEXT[] NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS first_name TEXT,
        ADD COLUMN IF NOT EXISTS surname TEXT,
        ADD COLUMN IF NOT EXISTS place_of_birth TEXT,
        ADD COLUMN IF NOT EXISTS state TEXT,
        ADD COLUMN IF NOT EXISTS lga TEXT,
        ADD COLUMN IF NOT EXISTS jamb_profile_code TEXT,
        ADD COLUMN IF NOT EXISTS bring_laptop TEXT,
        ADD COLUMN IF NOT EXISTS graduation_year TEXT,
        ADD COLUMN IF NOT EXISTS training_day TEXT,
        ADD COLUMN IF NOT EXISTS training_time TEXT,
        ADD COLUMN IF NOT EXISTS applicant_marked_paid BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS rules_accepted BOOLEAN NOT NULL DEFAULT FALSE
    `);
  } catch (error) {
    console.warn('Database is not available; starting server without intern schema migration:', error.message);
  }
}

module.exports = { pool, query, queryOne, ensureInternApplicationSchema };
