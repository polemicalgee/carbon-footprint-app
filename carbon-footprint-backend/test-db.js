require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Testing PostgreSQL Connection...\n');

const dbUrl = process.env.DATABASE_URL;
console.log('📝 Connection String:', dbUrl ? '✓ Loaded from .env' : '✗ NOT FOUND');
if (!dbUrl) {
  console.error('❌ DATABASE_URL is missing in .env file');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('❌ Pool error:', err.message);
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Connection Failed:', err.message);
    console.error('\n📋 Troubleshooting:');
    console.error('   1. Check if DATABASE_URL is correct in .env');
    console.error('   2. Verify your internet connection');
    console.error('   3. Check if Neon PostgreSQL service is active');
    console.error('   4. Try creating a new connection in Neon dashboard');
  } else {
    console.log('✅ Connection Successful!');
    console.log('   Database Time:', res.rows[0].now);
  }
  pool.end();
  process.exit(err ? 1 : 0);
});

setTimeout(() => {
  console.error('⏱️  Connection timeout - database not responding');
  pool.end();
  process.exit(1);
}, 15000);
