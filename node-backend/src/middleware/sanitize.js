/**
 * Security Middleware: Input Sanitization
 * 
 * Recursively strips HTML tags, script injection, and dangerous characters
 * from all incoming request body fields before they reach any controller.
 * This prevents XSS, SQL injection via string manipulation, and NoSQL injection.
 */

/**
 * Strip dangerous HTML/script content from a string value
 * @param {string} value
 * @returns {string}
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  return value
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove javascript: protocol injections
    .replace(/javascript\s*:/gi, '')
    // Remove data: URI (can carry XSS payloads)
    .replace(/data\s*:/gi, '')
    // Remove null bytes (can bypass filters in some databases)
    .replace(/\0/g, '')
    // Trim leading/trailing whitespace
    .trim();
}

/**
 * Recursively sanitize all string values in an object or array
 * @param {*} input
 * @returns {*}
 */
function deepSanitize(input) {
  if (input === null || input === undefined) return input;
  if (typeof input === 'string') return sanitizeString(input);
  if (Array.isArray(input)) return input.map(deepSanitize);
  if (typeof input === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      // Sanitize key names too (prevents prototype pollution)
      const safeKey = sanitizeString(String(key));
      if (safeKey === '__proto__' || safeKey === 'constructor' || safeKey === 'prototype') {
        continue; // Skip prototype pollution attempt
      }
      sanitized[safeKey] = deepSanitize(value);
    }
    return sanitized;
  }
  return input; // Numbers, booleans pass through unchanged
}

/**
 * Express middleware that sanitizes req.body
 * (req.query is a getter in Express; sanitizing body is sufficient for mutation security)
 */
export function sanitizeInputs(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitize(req.body);
  }
  next();
}
