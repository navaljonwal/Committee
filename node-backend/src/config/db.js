import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

function getPoolConfig() {
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

  // SSL config for cloud providers (Aiven, TiDB, Railway, CleverCloud, etc.)
  const useSsl = process.env.DB_SSL === 'true' || 
    (process.env.NODE_ENV === 'production' && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST));
  
  const sslConfig = useSsl ? { rejectUnauthorized: false } : undefined;

  if (dbUrl) {
    try {
      const parsedUrl = new URL(dbUrl);
      return {
        host: parsedUrl.hostname,
        port: parseInt(parsedUrl.port || '3306', 10),
        user: decodeURIComponent(parsedUrl.username),
        password: decodeURIComponent(parsedUrl.password),
        database: parsedUrl.pathname.replace(/^\//, ''),
        ssl: sslConfig,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        decimalNumbers: true,
        timezone: '+00:00'
      };
    } catch (e) {
      console.warn('Could not parse DATABASE_URL as URL, falling back to connection string:', e.message);
      return {
        uri: dbUrl,
        ssl: sslConfig,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        decimalNumbers: true,
        timezone: '+00:00'
      };
    }
  }

  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kameti_db',
    ssl: sslConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
    timezone: '+00:00'
  };
}

export const pool = mysql.createPool(getPoolConfig());

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MySQL database:', error.message);
    return false;
  }
}

export default pool;

