const express = require('express');
const { 
  getRecommendations, 
  refreshRecommendations, 
  clickRecommendation,
  getRecommendationStats 
} = require('../controllers/recommendation.controller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.get('/:userId', authenticate, getRecommendations);
router.post('/:userId/refresh', authenticate, refreshRecommendations);
router.post('/:userId/:resourceId/click', authenticate, clickRecommendation);
router.get('/:userId/stats', authenticate, getRecommendationStats);

module.exports = router;