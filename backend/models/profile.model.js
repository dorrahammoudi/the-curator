const pool = require('../config/db');

const Profile = {
  setUserTags: async (userId, tags) => {
    await pool.execute('DELETE FROM student_profile_tags WHERE user_id = ?', [userId]);
    
    for (const tag of tags) {
      await pool.execute(
        'INSERT INTO student_profile_tags (user_id, tag_id, weight) VALUES (?, ?, ?)',
        [userId, tag.tag_id, tag.weight || 1.0]
      );
    }
  },
  
  getUserTags: async (userId) => {
    const [rows] = await pool.execute(`
      SELECT t.*, spt.weight 
      FROM student_profile_tags spt 
      JOIN tags t ON spt.tag_id = t.id 
      WHERE spt.user_id = ?
    `, [userId]);
    return rows;
  },
  
  getUserTagVector: async (userId) => {
    const [rows] = await pool.execute(`
      SELECT tag_id, weight 
      FROM student_profile_tags 
      WHERE user_id = ?
    `, [userId]);
    
    const vector = {};
    for (const row of rows) {
      vector[row.tag_id] = row.weight;
    }
    return vector;
  }
};

module.exports = Profile;