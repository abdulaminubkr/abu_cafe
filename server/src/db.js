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

module.exports = { pool, query, queryOne };
