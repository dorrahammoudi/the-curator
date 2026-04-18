const Tag = require('../models/tag.model');

const getAllTags = async (req, res, next) => {
  try {
    const tags = await Tag.findAll();
    res.json({ success: true, data: tags });
  } catch (error) {
    next(error);
  }
};

const getPopularTags = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const tags = await Tag.getPopular(limit);
    res.json({ success: true, data: tags });
  } catch (error) {
    next(error);
  }
};

const getTagById = async (req, res, next) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ success: false, message: 'Tag non trouvé' });
    }
    res.json({ success: true, data: tag });
  } catch (error) {
    next(error);
  }
};

const createTag = async (req, res, next) => {
  try {
    const { name, category } = req.body;
    
    const existingTag = await Tag.findByName(name);
    if (existingTag) {
      return res.status(400).json({ success: false, message: 'Tag déjà existant' });
    }
    
    const tagId = await Tag.create(name, category);
    res.json({ success: true, data: { id: tagId, name, category } });
  } catch (error) {
    next(error);
  }
};

const updateTag = async (req, res, next) => {
  try {
    const { name, category } = req.body;
    const updated = await Tag.update(req.params.id, name, category);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Tag non trouvé' });
    }
    res.json({ success: true, message: 'Tag mis à jour' });
  } catch (error) {
    next(error);
  }
};

const deleteTag = async (req, res, next) => {
  try {
    const deleted = await Tag.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Tag non trouvé' });
    }
    res.json({ success: true, message: 'Tag supprimé' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllTags, getPopularTags, getTagById, createTag, updateTag, deleteTag };