/**
 * Password hashing, built entirely on Node's built-in `crypto` module --
 * no bcrypt dependency needed.
 *
 * New passwords are hashed in the same "scrypt:N:r:p$salt$hexdigest" format
 * that Werkzeug (the Python/Flask version of this app) used, so the two
 * default accounts already seeded in Supabase (Super Admin / Admin) keep
 * working without any changes to the database.
 */
const crypto = require('crypto');

const N = 32768;
const r = 8;
const p = 1;
const KEYLEN = 64;

function randomSalt(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

function hashPassword(password) {
  const salt = randomSalt();
  const derived = crypto.scryptSync(password, salt, KEYLEN, {
    N, r, p, maxmem: 128 * N * r * 2,
  });
  return `scrypt:${N}:${r}:${p}$${salt}$${derived.toString('hex')}`;
}

function verifyPassword(password, storedHash) {
  try {
    const [algoPart, salt, hexdigest] = storedHash.split('$');
    const parts = algoPart.split(':');
    if (parts[0] !== 'scrypt' || !salt || !hexdigest) return false;
    const [, hN, hr, hp] = parts;
    const keylen = hexdigest.length / 2;
    const derived = crypto.scryptSync(password, salt, keylen, {
      N: parseInt(hN), r: parseInt(hr), p: parseInt(hp),
      maxmem: 128 * parseInt(hN) * parseInt(hr) * 2,
    });
    const a = Buffer.from(derived.toString('hex'));
    const b = Buffer.from(hexdigest);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}

module.exports = { hashPassword, verifyPassword };
