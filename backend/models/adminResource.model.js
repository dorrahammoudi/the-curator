const pool = require('../config/db');

const AdminResource = {
  // Créer une ressource admin
  create: async (resourceData) => {
    const { title, type, description, tags, file_url, admin_id, admin_email, admin_name } = resourceData;
    
    const [result] = await pool.execute(
      `INSERT INTO admin_resources 
      (title, type, description, tags, file_url, admin_id, admin_email, admin_name, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [title, type, description, JSON.stringify(tags || []), file_url || null, admin_id, admin_email, admin_name]
    );
    return result.insertId;
  },
  
  // Récupérer les ressources admin par email
  getByAdminEmail: async (adminEmail) => {
    const [rows] = await pool.execute(
      'SELECT * FROM admin_resources WHERE admin_email = ? ORDER BY created_at DESC',
      [adminEmail]
    );
    return rows.map(row => ({ ...row, tags: JSON.parse(row.tags || '[]') }));
  },
  
  // Récupérer toutes les ressources admin
  getAll: async () => {
    const [rows] = await pool.execute(
      'SELECT * FROM admin_resources ORDER BY created_at DESC'
    );
    return rows.map(row => ({ ...row, tags: JSON.parse(row.tags || '[]') }));
  },
  
  // Supprimer une ressource admin
  delete: async (id) => {
    const [result] = await pool.execute('DELETE FROM admin_resources WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = AdminResource;