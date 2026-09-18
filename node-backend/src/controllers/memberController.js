import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

export async function getAllMembers(req, res) {
  try {
    const [members] = await pool.query(`
      SELECT 
        m.id, 
        m.name, 
        m.phone, 
        m.plain_password, 
        m.created_at,
        u.email as user_email,
        u.role as user_role,
        (SELECT COUNT(*) FROM committee_member cm WHERE cm.member_id = m.id) as committees_count,
        (SELECT COUNT(*) FROM committee_schedules cs WHERE cs.member_id = m.id) as won_schedules_count
      FROM members m
      LEFT JOIN users u ON u.member_id = m.id
      ORDER BY m.name ASC
    `);

    return res.json({ success: true, members });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createMember(req, res) {
  const conn = await pool.getConnection();
  try {
    const { name, phone, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(422).json({ success: false, message: 'Member name is required' });
    }

    let rawPassword = password;
    if (!rawPassword) {
      const firstName = (name.trim().split(' ')[0] || 'member').toLowerCase().replace(/[^a-z0-9]/gi, '');
      const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
      const phoneDigits = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : '1234';
      rawPassword = (firstName || 'member') + phoneDigits;
    }

    await conn.beginTransaction();

    const [memberResult] = await conn.query(
      'INSERT INTO members (name, phone, plain_password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [name.trim(), phone?.trim() || null, rawPassword]
    );

    const memberId = memberResult.insertId;
    const userPhone = phone?.trim() || ('9' + String(memberId).padStart(9, '0'));
    const userEmail = `member${memberId}@kameti.com`;
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    await conn.query(
      'INSERT INTO users (member_id, name, email, phone, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [memberId, name.trim(), userEmail, userPhone, hashedPassword, 'member']
    );

    await conn.commit();

    return res.status(201).json({
      success: true,
      message: `Member & login account created! Password: ${rawPassword}`,
      member: {
        id: memberId,
        name: name.trim(),
        phone: phone?.trim() || null,
        plain_password: rawPassword,
        user_email: userEmail,
        user_phone: userPhone
      }
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
}

export async function updateMember(req, res) {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { name, phone, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(422).json({ success: false, message: 'Member name is required' });
    }

    const [existing] = await conn.query('SELECT * FROM members WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    await conn.beginTransaction();

    if (password && password.trim().length >= 4) {
      await conn.query(
        'UPDATE members SET name = ?, phone = ?, plain_password = ?, updated_at = NOW() WHERE id = ?',
        [name.trim(), phone?.trim() || null, password.trim(), id]
      );
    } else {
      await conn.query(
        'UPDATE members SET name = ?, phone = ?, updated_at = NOW() WHERE id = ?',
        [name.trim(), phone?.trim() || null, id]
      );
    }

    // Update or create linked User account
    const [users] = await conn.query('SELECT * FROM users WHERE member_id = ?', [id]);
    if (users.length === 0) {
      const userPhone = phone?.trim() || ('9' + String(id).padStart(9, '0'));
      const rawPass = password || existing[0].plain_password || 'member123';
      const hashed = await bcrypt.hash(rawPass, 12);
      await conn.query(
        'INSERT INTO users (member_id, name, email, phone, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [id, name.trim(), `member${id}@kameti.com`, userPhone, hashed, 'member']
      );
    } else {
      const u = users[0];
      const updates = ['name = ?'];
      const params = [name.trim()];

      if (phone) {
        updates.push('phone = ?');
        params.push(phone.trim());
      }
      if (password && password.trim().length >= 4) {
        const hashed = await bcrypt.hash(password.trim(), 12);
        updates.push('password = ?');
        params.push(hashed);
      }
      updates.push('updated_at = NOW()');
      params.push(u.id);

      await conn.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    await conn.commit();

    return res.json({
      success: true,
      message: 'Member details & login credentials updated successfully!'
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
}

export async function deleteMember(req, res) {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;

    await conn.beginTransaction();

    await conn.query('DELETE FROM users WHERE member_id = ?', [id]);
    await conn.query('DELETE FROM members WHERE id = ?', [id]);

    await conn.commit();

    return res.json({
      success: true,
      message: 'Member and login account deleted successfully!'
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
}
