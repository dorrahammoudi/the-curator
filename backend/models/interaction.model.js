const pool = require('../config/db');

const Interaction = {
  create: async (userId, resourceId, type) => {
    const [result] = await pool.execute(
      'INSERT INTO interactions (user_id, resource_id, type) VALUES (?, ?, ?)',
      [userId, resourceId, type]
    );
    return result.insertId;
  },
  
  getUserInteractions: async (userId) => {
    const [rows] = await pool.execute(
      'SELECT * FROM interactions WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },
  
  getInteractionsForResource: async (resourceId) => {
    const [rows] = await pool.execute(
      'SELECT * FROM interactions WHERE resource_id = ?',
      [resourceId]
    );
    return rows;
  },
  
  getWeightedScore: async (userId) => {
    const [rows] = await pool.execute(`
      SELECT 
        resource_id,
        SUM(CASE 
          WHEN type = 'FAVORITE' THEN 1.0
          WHEN type = 'DOWNLOAD' THEN 0.7
          WHEN type = 'VIEW' THEN 0.3
          WHEN type = 'IGNORE' THEN -0.5
          ELSE 0
        END) as score
      FROM interactions
      WHERE user_id = ?
      GROUP BY resource_id
    `, [userId]);
    return rows;
  }
};

module.exports = Interaction;