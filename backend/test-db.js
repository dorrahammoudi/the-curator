require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
  console.log('Test de connexion...');
  console.log('Host:', process.env.DB_HOST);
  console.log('Port:', process.env.DB_PORT);
  console.log('User:', process.env.DB_USER);
  console.log('Password:', process.env.DB_PASSWORD ? '******' : 'VIDE');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 8889,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });
    console.log('✅ Connexion MySQL réussie !');
    await connection.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

test();
