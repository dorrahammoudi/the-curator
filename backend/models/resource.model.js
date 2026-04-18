const pool = require('../config/db');

const Resource = {
  // Créer une ressource
  create: async (resourceData) => {
    const { title, type, description, tags, file_url, teacher_id, teacher_name, departement } = resourceData;
    
    const [result] = await pool.execute(
      `INSERT INTO resources 
      (title, type, description, tags, file_url, teacher_id, teacher_name, departement, views, downloads, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NOW())`,
      [title, type, description, JSON.stringify(tags || []), file_url || null, teacher_id, teacher_name, departement || '']
    );
    return result.insertId;
  },
  
  // Récupérer toutes les ressources
  getAll: async () => {
    const [rows] = await pool.execute(`
      SELECT r.*, u.name as user_name 
      FROM resources r
      LEFT JOIN users u ON r.teacher_id = u.id
      ORDER BY r.created_at DESC
    `);
    return rows.map(row => ({ 
      ...row, 
      tags: JSON.parse(row.tags || '[]'),
      teacherName: row.teacher_name || row.user_name
    }));
  },
  
  // Récupérer une ressource par ID
  findById: async (id) => {
    const [rows] = await pool.execute(`
      SELECT r.*, u.name as user_name 
      FROM resources r
      LEFT JOIN users u ON r.teacher_id = u.id
      WHERE r.id = ?
    `, [id]);
    if (rows[0]) {
      rows[0].tags = JSON.parse(rows[0].tags || '[]');
      rows[0].teacherName = rows[0].teacher_name || rows[0].user_name;
    }
    return rows[0];
  },
  
  // Mettre à jour une ressource
  update: async (id, data) => {
    const { title, type, description, tags, file_url } = data;
    const [result] = await pool.execute(
      'UPDATE resources SET title = ?, type = ?, description = ?, tags = ?, file_url = ? WHERE id = ?',
      [title, type, description, JSON.stringify(tags || []), file_url || null, id]
    );
    return result.affectedRows > 0;
  },
  
  // Incrémenter les vues
  incrementViews: async (id) => {
    const [result] = await pool.execute(
      'UPDATE resources SET views = views + 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },
  
  // Incrémenter les téléchargements
  incrementDownloads: async (id) => {
    const [result] = await pool.execute(
      'UPDATE resources SET downloads = downloads + 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },
  
  // Supprimer une ressource
  delete: async (id) => {
    const [result] = await pool.execute('DELETE FROM resources WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
  
  // Récupérer les ressources par enseignant
  getByTeacherId: async (teacherId) => {
    const [rows] = await pool.execute(
      'SELECT * FROM resources WHERE teacher_id = ? ORDER BY created_at DESC',
      [teacherId]
    );
    return rows.map(row => ({ ...row, tags: JSON.parse(row.tags || '[]') }));
  }
};

module.exports = Resource;