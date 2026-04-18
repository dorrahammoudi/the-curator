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

const getRecommendationsForUser = async (userId, limit = 20) => {
  const userVector = await Profile.getUserTagVector(userId);
  const interactions = await Interaction.getWeightedScore(userId);
  const allResources = await Resource.findAll();
  
  const recommendations = [];
  
  for (const resource of allResources) {
    const resourceTags = await Resource.getTags(resource.id);
    
    const contentScore = calculateCosineSimilarity(userVector, resourceTags);
    const interaction = interactions.find(i => i.resource_id === resource.id);
    const interactionScore = interaction ? interaction.score : 0;
    
    const finalScore = ALPHA * contentScore + BETA * interactionScore;
    
    recommendations.push({
      ...resource,
      score: finalScore,
      content_score: contentScore,
      interaction_score: interactionScore
    });
  }
  
  recommendations.sort((a, b) => b.score - a.score);
  
  return recommendations.slice(0, limit);
};

module.exports = { getRecommendationsForUser, calculateCosineSimilarity };