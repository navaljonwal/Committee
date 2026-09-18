import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'kameti_jwt_secret_super_secure_key_2026',
      { algorithms: ['HS256'] }
    );
    
    // Fetch fresh user from DB
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, member_id FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User account no longer exists' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', error: error.message });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Administrator role required' });
  }
  next();
}

export function requireMember(req, res, next) {
  if (!req.user || (req.user.role !== 'member' && req.user.role !== 'admin')) {
    return res.status(403).json({ success: false, message: 'Access denied: Member role required' });
  }
  next();
}
