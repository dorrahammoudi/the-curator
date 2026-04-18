const pool = require('../config/db');

const Recommendation = {
  // Créer ou mettre à jour une recommandation
  save: async (userId, resourceId, score) => {
    const [existing] = await pool.execute(
      'SELECT id FROM recommendations WHERE user_id = ? AND resource_id = ?',
      [userId, resourceId]
    );
    
    if (existing.length > 0) {
      await pool.execute(
        'UPDATE recommendations SET score = ?, created_at = NOW() WHERE id = ?',
        [score, existing[0].id]
      );
      return existing[0].id;
    } else {
      const [result] = await pool.execute(
        'INSERT INTO recommendations (user_id, resource_id, score) VALUES (?, ?, ?)',
        [userId, resourceId, score]
      );
      return result.insertId;
    }
  },
  
  // Récupérer les recommandations pour un utilisateur
  getByUser: async (userId, limit = 20) => {
    const [rows] = await pool.execute(`
      SELECT r.*, res.title, res.type, res.file_url, u.name as teacher_name
      FROM recommendations r
      JOIN resources res ON r.resource_id = res.id
      LEFT JOIN users u ON res.teacher_id = u.id
      WHERE r.user_id = ?
      ORDER BY r.score DESC, r.created_at DESC
      LIMIT ?
    `, [userId, limit]);
    return rows;
  },
  
  // Enregistrer qu'un utilisateur a cliqué sur une recommandation
  markAsClicked: async (userId, resourceId) => {
    const [result] = await pool.execute(
      'UPDATE recommendations SET clicked = 1 WHERE user_id = ? AND resource_id = ?',
      [userId, resourceId]
    );
    return result.affectedRows > 0;
  },
  
  // Supprimer les anciennes recommandations d'un utilisateur
  deleteOldRecommendations: async (userId, keepCount = 50) => {
    const [result] = await pool.execute(
      'DELETE FROM recommendations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, keepCount]
    );
    return result.affectedRows;
  },
  
  // Nettoyer toutes les recommandations d'un utilisateur
  clearByUser: async (userId) => {
    const [result] = await pool.execute(
      'DELETE FROM recommendations WHERE user_id = ?',
      [userId]
    );
    return result.affectedRows;
  },
  
  // Récupérer les recommandations non cliquées
  getUnclickedByUser: async (userId, limit = 10) => {
    const [rows] = await pool.execute(`
      SELECT r.*, res.title, res.type
      FROM recommendations r
      JOIN resources res ON r.resource_id = res.id
      WHERE r.user_id = ? AND r.clicked = 0
      ORDER BY r.score DESC
      LIMIT ?
    `, [userId, limit]);
    return rows;
  },
  
  // Obtenir les statistiques des recommandations pour un utilisateur
  getStats: async (userId) => {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN clicked = 1 THEN 1 ELSE 0 END) as clicked_count,
        AVG(score) as avg_score
      FROM recommendations
      WHERE user_id = ?
    `, [userId]);
    return rows[0];
  },
  
  // Récupérer les meilleures recommandations globales
  getTopRecommendations: async (limit = 10) => {
    const [rows] = await pool.execute(`
      SELECT 
        r.resource_id,
        res.title,
        AVG(r.score) as avg_score,
        COUNT(r.user_id) as user_count
      FROM recommendations r
      JOIN resources res ON r.resource_id = res.id
      GROUP BY r.resource_id
      ORDER BY avg_score DESC
      LIMIT ?
    `, [limit]);
    return rows;
  },
  
  // Vérifier si une ressource a déjà été recommandée à un utilisateur
  exists: async (userId, resourceId) => {
    const [rows] = await pool.execute(
      'SELECT id FROM recommendations WHERE user_id = ? AND resource_id = ?',
      [userId, resourceId]
    );
    return rows.length > 0;
  },
  
  // Mettre à jour le score d'une recommandation
  updateScore: async (userId, resourceId, score) => {
    const [result] = await pool.execute(
      'UPDATE recommendations SET score = ? WHERE user_id = ? AND resource_id = ?',
      [score, userId, resourceId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Recommendation;