/**
 * Hash Param Decoder Middleware
 * 
 * Automatically decodes hashed URL parameters back to numeric IDs
 * before the request reaches any controller.
 * 
 * Usage:
 *   router.get('/:id', decodeHash('id'), getCommitteeDetail);
 *   router.post('/:scheduleId/winner', decodeHash('scheduleId'), updateWinner);
 */

import { decodeId } from '../utils/hashids.js';

/**
 * Creates middleware that decodes a specific route param from hash to numeric ID
 * @param {...string} paramNames - The route param names to decode (e.g. 'id', 'scheduleId')
 * @returns {Function} Express middleware
 */
export function decodeHash(...paramNames) {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const hash = req.params[paramName];
      if (!hash) continue;

      // If already a plain number (legacy/direct), pass through
      if (/^\d+$/.test(hash)) {
        req.params[paramName] = parseInt(hash, 10);
        continue;
      }

      const numericId = decodeId(hash);
      if (numericId === null) {
        return res.status(400).json({
          success: false,
          message: `Invalid resource identifier: ${paramName}`
        });
      }
      req.params[paramName] = numericId;
    }
    next();
  };
}
