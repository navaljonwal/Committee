import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || '';
export const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://') || process.env.DB_CONNECTION === 'pgsql';

let poolInstance = null;

if (isPostgres) {
  const { Pool: PgPool } = pg;
  const pgPool = new PgPool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  function preparePgQuery(sql, params = []) {
    let paramIndex = 0;
    const flatParams = [];

    let cleanSql = sql
      .replace(/`/g, '')
      .replace(/CURDATE\(\)/gi, 'CURRENT_DATE')
      .replace(/\bis_custom_bid\s*=\s*1\b/gi, 'is_custom_bid = true')
      .replace(/\bis_custom_bid\s*=\s*0\b/gi, 'is_custom_bid = false');

    cleanSql = cleanSql.replace(/\?/g, () => {
      const val = params[paramIndex++];
      if (Array.isArray(val)) {
        if (val.length === 0) return 'NULL';

        // 2D Array: Bulk INSERT e.g. VALUES ? where val = [ [r1c1, r1c2], [r2c1, r2c2] ]
        if (Array.isArray(val[0])) {
          const rowPlaceholders = val.map((row) => {
            if (Array.isArray(row)) {
              const cols = row.map((cell) => {
                const safeVal = (cell === undefined || (typeof cell === 'number' && isNaN(cell))) ? null : cell;
                flatParams.push(safeVal);
                return '$' + flatParams.length;
              });
              return `(${cols.join(', ')})`;
            } else {
              const safeVal = (row === undefined || (typeof row === 'number' && isNaN(row))) ? null : row;
              flatParams.push(safeVal);
              return `($${flatParams.length})`;
            }
          });
          return rowPlaceholders.join(', ');
        } else {
          // 1D Array: e.g. WHERE id IN (?)
          const placeholders = val.map((item) => {
            const safeVal = (item === undefined || (typeof item === 'number' && isNaN(item))) ? null : item;
            flatParams.push(safeVal);
            return '$' + flatParams.length;
          });
          return placeholders.join(', ');
        }
      } else {
        const safeVal = (val === undefined || (typeof val === 'number' && isNaN(val))) ? null : val;
        flatParams.push(safeVal);
        return '$' + flatParams.length;
      }
    });

    // Strip trailing semicolon if present
    cleanSql = cleanSql.trim().replace(/;+$/, '');

    // Auto-append RETURNING id for INSERT queries if not already present
    if (/^INSERT\s+INTO/i.test(cleanSql) && !/RETURNING/i.test(cleanSql)) {
      cleanSql = `${cleanSql} RETURNING id`;
    }

    return { sql: cleanSql, params: flatParams };
  }

  async function executePg(clientOrPool, sql, params) {
    const { sql: preparedSql, params: preparedParams } = preparePgQuery(sql, params);
    const res = await clientOrPool.query(preparedSql, preparedParams);

    const isInsert = /^INSERT\s+INTO/i.test(sql.trim());
    const isUpdateOrDelete = /^(UPDATE|DELETE)\s+/i.test(sql.trim());

    if (isInsert) {
      const firstRow = res.rows[0];
      const insertId = firstRow?.id ? Number(firstRow.id) : null;
      return [{ insertId, affectedRows: res.rowCount }, res.fields];
    }

    if (isUpdateOrDelete) {
      return [{ affectedRows: res.rowCount, changedRows: res.rowCount }, res.fields];
    }

    return [res.rows, res.fields];
  }

  poolInstance = {
    async query(sql, params) {
      return executePg(pgPool, sql, params);
    },
    async getConnection() {
      const client = await pgPool.connect();
      return {
        async query(sql, params) {
          return executePg(client, sql, params);
        },
        async beginTransaction() {
          await client.query('BEGIN');
        },
        async commit() {
          await client.query('COMMIT');
        },
        async rollback() {
          await client.query('ROLLBACK');
        },
        release() {
          client.release();
        }
      };
    }
  };
} else {
  // MySQL Pool (for local XAMPP MySQL or Cloud MySQL)
  const useSsl = process.env.DB_SSL === 'true' || 
    (process.env.NODE_ENV === 'production' && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST));
  const sslConfig = useSsl ? { rejectUnauthorized: false } : undefined;

  let mysqlConfig;
  if (dbUrl) {
    try {
      const parsedUrl = new URL(dbUrl);
      mysqlConfig = {
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
    } catch {
      mysqlConfig = {
        uri: dbUrl,
        ssl: sslConfig,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        decimalNumbers: true,
        timezone: '+00:00'
      };
    }
  } else {
    mysqlConfig = {
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

  poolInstance = mysql.createPool(mysqlConfig);
}

export const pool = poolInstance;

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const dbType = isPostgres ? 'PostgreSQL (Neon / Cloud)' : (process.env.DB_NAME || 'MySQL kameti_db');
    console.log(`✅ Connected to database successfully: ${dbType}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    return false;
  }
}

export default pool;
