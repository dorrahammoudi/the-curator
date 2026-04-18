const pool = require('../config/db');

const User = {
  create: async (userData) => {
    const { name, email, password, role, filiere, niveau } = userData;
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role, filiere, niveau) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, password, role || 'ETUDIANT', filiere || null, niveau || null]
    );
    return result.insertId;
  },
  
  findByEmail: async (email) => {
    const [rows] = await pool.execute(
      'SELECT id, name, email, password, role, filiere, niveau, created_at FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  },
  
  findById: async (id) => {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, filiere, niveau, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },
  
  update: async (id, data) => {
    const { name, filiere, niveau, departement, specialite, titre, telephone, adresse } = data;
    const [result] = await pool.execute(
      'UPDATE users SET name = ?, filiere = ?, niveau = ? WHERE id = ?',
      [name, filiere || null, niveau || null, id]
    );
    return result.affectedRows > 0;
  },
  
  updatePassword: async (id, password) => {
    const [result] = await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [password, id]
    );
    return result.affectedRows > 0;
  },
  
  getAllTeachers: async () => {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, filiere, niveau, created_at FROM users WHERE role = "ENSEIGNANT" ORDER BY created_at DESC'
    );
    return rows;
  },
  
  getAllStudents: async () => {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, filiere, niveau, created_at FROM users WHERE role = "ETUDIANT" ORDER BY created_at DESC'
    );
    return rows;
  },
  
  getAll: async () => {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, filiere, niveau, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  },
  
  delete: async (id) => {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = User;