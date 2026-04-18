const Resource = require('../models/resource.model');

const getResources = async (req, res, next) => {
  try {
    const resources = await Resource.getAll();
    res.json({ success: true, data: resources });
  } catch (error) {
    next(error);
  }
};

const getResourceById = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Ressource non trouvée' });
    }
    res.json({ success: true, data: resource });
  } catch (error) {
    next(error);
  }
};

const createResource = async (req, res, next) => {
  try {
    const { title, type, description, tags, date, teacher_id, teacher_name, departement } = req.body;
    
    console.log('📝 Création ressource:', { title, type, teacher_id, teacher_name });
    
    let tagsArray = [];
    if (tags) {
      tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }
    
    const resourceId = await Resource.create({
      title,
      type,
      description: description || title,
      tags: tagsArray,
      file_url: null,
      teacher_id: teacher_id || req.user.id,
      teacher_name: teacher_name || req.user.name,
      departement: departement || ''
    });
    
    const resource = await Resource.findById(resourceId);
    res.json({ success: true, data: resource });
  } catch (error) {
    console.error('Erreur création ressource:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateResource = async (req, res, next) => {
  try {
    const { title, type, description, tags, file_url } = req.body;
    const updated = await Resource.update(req.params.id, {
      title,
      type,
      description,
      tags,
      file_url
    });
    
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Ressource non trouvée' });
    }
    
    res.json({ success: true, message: 'Ressource mise à jour' });
  } catch (error) {
    next(error);
  }
};

const deleteResource = async (req, res, next) => {
  try {
    const deleted = await Resource.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Ressource non trouvée' });
    }
    res.json({ success: true, message: 'Ressource supprimée' });
  } catch (error) {
    next(error);
  }
};

const incrementViews = async (req, res, next) => {
  try {
    await Resource.incrementViews(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const incrementDownloads = async (req, res, next) => {
  try {
    await Resource.incrementDownloads(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  incrementViews,
  incrementDownloads
};