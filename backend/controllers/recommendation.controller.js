const Recommendation = require('../models/recommendation.model');
const Resource = require('../models/resource.model');
const Profile = require('../models/profile.model');
const Interaction = require('../models/interaction.model');

const ALPHA = parseFloat(process.env.ALPHA) || 0.7;
const BETA = parseFloat(process.env.BETA) || 0.3;

const calculateCosineSimilarity = (userVector, resourceTags) => {
  let dotProduct = 0;
  let userNorm = 0;
  let resourceNorm = 0;
  
  for (const tag of resourceTags) {
    const userWeight = userVector[tag.tag_id] || 0;
    dotProduct += userWeight * tag.weight;
    userNorm += userWeight * userWeight;
    resourceNorm += tag.weight * tag.weight;
  }
  
  if (userNorm === 0 || resourceNorm === 0) return 0;
  return dotProduct / (Math.sqrt(userNorm) * Math.sqrt(resourceNorm));
};

const generateRecommendations = async (userId) => {
  const userVector = await Profile.getUserTagVector(userId);
  const interactions = await Interaction.getWeightedScore(userId);
  const allResources = await Resource.findAll();
  
  const recommendations = [];
  
  for (const resource of allResources) {
    // Vérifier si déjà recommandé
    const alreadyRecommended = await Recommendation.exists(userId, resource.id);
    if (alreadyRecommended) continue;
    
    const resourceTags = await Resource.getTags(resource.id);
    
    const contentScore = calculateCosineSimilarity(userVector, resourceTags);
    const interaction = interactions.find(i => i.resource_id === resource.id);
    const interactionScore = interaction ? interaction.score : 0;
    
    const finalScore = ALPHA * contentScore + BETA * interactionScore;
    
    if (finalScore > 0.1) {
      await Recommendation.save(userId, resource.id, finalScore);
      recommendations.push({
        ...resource,
        score: finalScore,
        content_score: contentScore,
        interaction_score: interactionScore
      });
    }
  }
  
  recommendations.sort((a, b) => b.score - a.score);
  return recommendations;
};

const getRecommendations = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Récupérer les recommandations existantes
    let recommendations = await Recommendation.getByUser(userId, 20);
    
    // Si pas assez de recommandations, en générer de nouvelles
    if (recommendations.length < 10) {
      await generateRecommendations(userId);
      recommendations = await Recommendation.getByUser(userId, 20);
    }
    
    res.json({ success: true, data: recommendations });
  } catch (error) {
    next(error);
  }
};

const refreshRecommendations = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    
    await Recommendation.clearByUser(userId);
    const recommendations = await generateRecommendations(userId);
    
    res.json({ success: true, data: recommendations });
  } catch (error) {
    next(error);
  }
};

const clickRecommendation = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const resourceId = parseInt(req.params.resourceId);
    
    await Recommendation.markAsClicked(userId, resourceId);
    
    res.json({ success: true, message: 'Recommandation marquée comme cliquée' });
  } catch (error) {
    next(error);
  }
};

const getRecommendationStats = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const stats = await Recommendation.getStats(userId);
    
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getRecommendations, 
  refreshRecommendations, 
  clickRecommendation,
  getRecommendationStats 
};