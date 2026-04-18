const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'academic_recommendation',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

console.log('📊 Configuration DB:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  password: dbConfig.password ? '******' : '(vide)'
});

const pool = mysql.createPool(dbConfig);

// Tester la connexion
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion à MySQL réussie !');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL:', error.message);
    console.log('\n💡 Vérifiez que:');
    console.log('   1. MySQL est démarré (MAMP/WAMP/XAMPP)');
    console.log('   2. Le mot de passe dans .env est correct');
    console.log('   3. La base de données "academic_recommendation" existe');
    return false;
  }
};

testConnection();

module.exports = pool;