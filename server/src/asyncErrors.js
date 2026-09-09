/**
 * Express 4 does NOT automatically catch rejected promises from async route
 * handlers -- if `await query(...)` throws (e.g. the database connection
 * fails), the request just hangs forever with no response and no error sent
 * to the client, instead of surfacing a clear error.
 *
 * This patches Router.prototype's method shortcuts (get/post/put/delete/etc.)
 * so every handler's return value is wrapped in Promise.resolve(...).catch(next),
 * forwarding any error to the centralized error handler in index.js.
 * Must be required before any route files (which call express.Router()).
 */
const { Router } = require('express');

const METHODS = ['get', 'post', 'put', 'delete', 'patch', 'all'];

function wrap(fn) {
  // Leave non-function arguments (paths, arrays of middleware from other
  // libraries) and 4-arg error-handling middleware untouched.
  if (typeof fn !== 'function' || fn.length >= 4) return fn;
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

METHODS.forEach((method) => {
  const original = Router.prototype[method];
  Router.prototype[method] = function (...args) {
    return original.apply(this, args.map(wrap));
  };
});
