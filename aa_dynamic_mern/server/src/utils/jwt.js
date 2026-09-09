/**
 * Minimal JWT (HS256) implementation using Node's built-in `crypto` module.
 * Avoids adding the `jsonwebtoken` package for something this small.
 * Supports exactly what this app needs: sign(payload, expiresInSeconds) and verify(token).
 */
const crypto = require('crypto');

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(input) {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  while (input.length % 4) input += '=';
  return Buffer.from(input, 'base64').toString();
}

function sign(payload, secret, expiresInSeconds = 60 * 60 * 24 * 7) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds };

  const headerEnc = base64url(JSON.stringify(header));
  const payloadEnc = base64url(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerEnc}.${payloadEnc}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${headerEnc}.${payloadEnc}.${signature}`;
}

function verify(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [headerEnc, payloadEnc, signature] = parts;

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${headerEnc}.${payloadEnc}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('Invalid signature');
  }

  const payload = JSON.parse(base64urlDecode(payloadEnc));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Token expired');
  }
  return payload;
}

module.exports = { sign, verify };
