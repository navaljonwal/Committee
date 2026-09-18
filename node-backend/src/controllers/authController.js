import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export async function login(req, res) {
  try {
    const { identity, password } = req.body;

    if (!identity || !password) {
      return res.status(422).json({
        success: false,
        message: 'Please provide Email, Phone, or Name and Password'
      });
    }

    const cleanIdentity = identity.trim();

    // Query user by email, phone, or name
    const [users] = await pool.query(
      `SELECT id, member_id, name, email, phone, password, role 
       FROM users 
       WHERE email = ? OR phone = ? OR name = ? 
       LIMIT 1`,
      [cleanIdentity, cleanIdentity, cleanIdentity]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your Email / Phone / Name and Password.'
      });
    }

    const user = users[0];
    
    // Normalise Laravel $2y$ prefix to $2a$ for standard compatibility if needed
    let dbHash = user.password;
    if (dbHash.startsWith('$2y$')) {
      dbHash = '$2a$' + dbHash.slice(4);
    }

    const isMatch = await bcrypt.compare(password, dbHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your Email / Phone / Name and Password.'
      });
    }

    // Generate JWT
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      member_id: user.member_id
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'kameti_jwt_secret_super_secure_key_2026',
      { expiresIn: '7d' }
    );

    // Set cookie for browser sessions
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // local development
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        member_id: user.member_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      error: error.message
    });
  }
}

export async function me(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    // Fetch member details if linked
    let member = null;
    if (req.user.member_id) {
      const [members] = await pool.query('SELECT * FROM members WHERE id = ?', [req.user.member_id]);
      if (members.length > 0) {
        member = members[0];
      }
    }

    return res.json({
      success: true,
      user: req.user,
      member
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function logout(req, res) {
  res.clearCookie('token');
  return res.json({ success: true, message: 'Logged out successfully' });
}
