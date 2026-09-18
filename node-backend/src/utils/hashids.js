/**
 * Hashids Utility — URL ID Obfuscation
 * 
 * Encodes numeric database IDs into short random-looking strings so that
 * internal IDs are never exposed in the browser URL.
 * 
 * Example:  11  →  "xK9mP"
 *           42  →  "Lm7Rq"
 * 
 * The same HASH_SECRET must be set in both backend and frontend environments.
 * Default secret is used for local development.
 */

import Hashids from 'hashids';

const SECRET = process.env.HASH_SECRET || 'kameti_hash_secret_9x2q_2026';
const MIN_LENGTH = 6;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

const hashids = new Hashids(SECRET, MIN_LENGTH, ALPHABET);

/**
 * Encode a numeric ID to a URL-safe hash string
 * @param {number} id 
 * @returns {string}
 */
export function encodeId(id) {
  return hashids.encode(id);
}

/**
 * Decode a hash string back to a numeric ID
 * @param {string} hash 
 * @returns {number|null}
 */
export function decodeId(hash) {
  const decoded = hashids.decode(hash);
  if (!decoded || decoded.length === 0) return null;
  return decoded[0];
}
