const pool = require('../config/db');

const Tag = {
  create: async (name, category) => {
    const [result] = await pool.execute(
      'INSERT INTO tags (name, category) VALUES (?, ?)',
      [name, category || null]
    );
    return result.insertId;
  },
  
  findAll: async () => {
    const [rows] = await pool.execute('SELECT * FROM tags ORDER BY name');
    return rows;
  },
  
  findById: async (id) => {
    const [rows] = await pool.execute('SELECT * FROM tags WHERE id = ?', [id]);
    return rows[0];
  },
  
  findByName: async (name) => {
    const [rows] = await pool.execute('SELECT * FROM tags WHERE name = ?', [name]);
    return rows[0];
  },
  
  findOrCreate: async (name, category) => {
    let tag = await Tag.findByName(name);
    if (!tag) {
      const id = await Tag.create(name, category);
      tag = { id, name, category };
    }
    return tag;
  },
  
  update: async (id, name, category) => {
    const [result] = await pool.execute(
      'UPDATE tags SET name = ?, category = ? WHERE id = ?',
      [name, category || null, id]
    );
    return result.affectedRows > 0;
  },
  
  delete: async (id) => {
    const [result] = await pool.execute('DELETE FROM tags WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
  
  getPopular: async (limit = 10) => {
    const [rows] = await pool.execute(`
      SELECT t.*, COUNT(rt.resource_id) as usage_count 
      FROM tags t 
      LEFT JOIN resource_tags rt ON t.id = rt.tag_id 
      GROUP BY t.id 
      ORDER BY usage_count DESC 
      LIMIT ?
    `, [limit]);
    return rows;
  }
};

module.exports = Tag;