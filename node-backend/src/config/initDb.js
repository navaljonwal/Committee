import pool from './db.js';
import bcrypt from 'bcryptjs';

export async function initializeDatabase() {
  try {
    console.log('🔄 Checking / Initializing database tables...');

    // 1. Members table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS members (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        name varchar(150) NOT NULL,
        phone varchar(20) DEFAULT NULL,
        plain_password varchar(255) NOT NULL DEFAULT 'member123',
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        email varchar(255) DEFAULT NULL,
        phone varchar(20) DEFAULT NULL,
        email_verified_at timestamp NULL DEFAULT NULL,
        password varchar(255) NOT NULL,
        role varchar(20) NOT NULL DEFAULT 'member',
        remember_token varchar(100) DEFAULT NULL,
        member_id bigint(20) unsigned DEFAULT NULL,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY users_email_unique (email),
        UNIQUE KEY users_phone_unique (phone),
        KEY users_member_id_foreign (member_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Committees table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS committees (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        name varchar(150) NOT NULL,
        total_amount decimal(15,2) NOT NULL,
        total_members int(11) NOT NULL DEFAULT 20,
        deduction_rate decimal(5,2) NOT NULL DEFAULT 1.50,
        special_month_index int(11) NOT NULL DEFAULT 19,
        start_date date NOT NULL,
        status enum('active','completed') NOT NULL DEFAULT 'active',
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Committee Schedules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS committee_schedules (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        committee_id bigint(20) unsigned NOT NULL,
        month_no int(11) NOT NULL,
        index_n int(11) NOT NULL,
        deduction_amount decimal(15,2) NOT NULL,
        custom_deduction_amount decimal(15,2) DEFAULT NULL,
        is_custom_bid tinyint(1) NOT NULL DEFAULT 0,
        net_payout decimal(15,2) NOT NULL,
        installment_per_member decimal(15,2) NOT NULL,
        member_id bigint(20) unsigned DEFAULT NULL,
        draw_date date DEFAULT NULL,
        payout_status varchar(20) NOT NULL DEFAULT 'unpaid',
        payout_date date DEFAULT NULL,
        payout_mode varchar(20) DEFAULT NULL,
        payout_upi_amount decimal(15,2) NOT NULL DEFAULT 0.00,
        payout_upi_ref varchar(255) DEFAULT NULL,
        payout_cash_amount decimal(15,2) NOT NULL DEFAULT 0.00,
        payout_cash_notes text DEFAULT NULL,
        payout_remarks varchar(255) DEFAULT NULL,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY committee_schedules_committee_id_foreign (committee_id),
        KEY committee_schedules_member_id_foreign (member_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Committee Member pivot
    await pool.query(`
      CREATE TABLE IF NOT EXISTS committee_member (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        committee_id bigint(20) unsigned NOT NULL,
        member_id bigint(20) unsigned NOT NULL,
        seats int(11) NOT NULL DEFAULT 1,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY committee_member_committee_id_foreign (committee_id),
        KEY committee_member_member_id_foreign (member_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Committee Member Payments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS committee_member_payments (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        schedule_id bigint(20) unsigned NOT NULL,
        member_id bigint(20) unsigned NOT NULL,
        seat_no int(11) NOT NULL DEFAULT 1,
        amount_paid decimal(15,2) NOT NULL,
        penalty_amount decimal(15,2) NOT NULL DEFAULT 0.00,
        remarks varchar(255) DEFAULT NULL,
        payment_status enum('pending','paid') NOT NULL DEFAULT 'pending',
        payment_date date DEFAULT NULL,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY committee_member_payments_schedule_id_foreign (schedule_id),
        KEY committee_member_payments_member_id_foreign (member_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Member Bids
    await pool.query(`
      CREATE TABLE IF NOT EXISTS member_bids (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        schedule_id bigint(20) unsigned NOT NULL,
        member_id bigint(20) unsigned NOT NULL,
        bid_amount decimal(15,2) NOT NULL,
        remarks varchar(255) DEFAULT NULL,
        status varchar(20) NOT NULL DEFAULT 'pending',
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY member_bids_schedule_id_foreign (schedule_id),
        KEY member_bids_member_id_foreign (member_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Check & create default admin if not exists
    const [adminRows] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (adminRows.length === 0) {
      console.log('👤 Seeding default admin user (admin@kameti.com / admin123)...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        "INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
        ['System Admin', 'admin@kameti.com', '9999999999', hashedPassword, 'admin']
      );
      console.log('✅ Default admin user created successfully.');
    }

    console.log('✅ Database schema verified and ready.');
    return true;
  } catch (error) {
    console.error('⚠️ Database schema initialization notice:', error.message);
    return false;
  }
}
