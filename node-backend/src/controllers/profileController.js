import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

export async function updateProfile(req, res) {
  try {
    const user = req.user;
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(422).json({ success: false, message: 'Name and email are required' });
    }

    // Check unique email
    const [existingEmail] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1',
      [email.trim(), user.id]
    );
    if (existingEmail.length > 0) {
      return res.status(422).json({ success: false, message: 'Email is already taken by another account' });
    }

    // Check unique phone if provided
    if (phone && phone.trim()) {
      const [existingPhone] = await pool.query(
        'SELECT id FROM users WHERE phone = ? AND id != ? LIMIT 1',
        [phone.trim(), user.id]
      );
      if (existingPhone.length > 0) {
        return res.status(422).json({ success: false, message: 'Phone number is already in use' });
      }
    }

    await pool.query(
      'UPDATE users SET name = ?, email = ?, phone = ?, updated_at = NOW() WHERE id = ?',
      [name.trim(), email.trim(), phone?.trim() || null, user.id]
    );

    if (user.member_id) {
      await pool.query(
        'UPDATE members SET name = ?, phone = ?, updated_at = NOW() WHERE id = ?',
        [name.trim(), phone?.trim() || null, user.member_id]
      );
    }

    return res.json({
      success: true,
      message: 'Profile information updated successfully!',
      user: {
        id: user.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updatePassword(req, res) {
  try {
    const user = req.user;
    const { current_password, password, password_confirmation } = req.body;

    if (!current_password || !password) {
      return res.status(422).json({ success: false, message: 'Current password and new password are required' });
    }

    if (password.length < 6) {
      return res.status(422).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    if (password_confirmation && password !== password_confirmation) {
      return res.status(422).json({ success: false, message: 'Password confirmation does not match' });
    }

    const [userRows] = await pool.query('SELECT password FROM users WHERE id = ?', [user.id]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let dbHash = userRows[0].password;
    if (dbHash.startsWith('$2y$')) {
      dbHash = '$2a$' + dbHash.slice(4);
    }

    const isMatch = await bcrypt.compare(current_password, dbHash);
    if (!isMatch) {
      return res.status(422).json({ success: false, message: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [newHash, user.id]);

    return res.json({
      success: true,
      message: 'Password changed successfully! Next time please use your new password.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
