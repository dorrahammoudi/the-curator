const AdminResource = require('../models/adminresource.model');

const getAdminResources = async (req, res, next) => {
  try {
    const adminEmail = req.user.email;
    const resources = await AdminResource.getByAdminEmail(adminEmail);
    res.json({ success: true, data: resources });
  } catch (error) {
    next(error);
  }
};

const createAdminResource = async (req, res, next) => {
  try {
    const { title, type, description, tags, file_url } = req.body;
    const adminId = req.user.id;
    const adminEmail = req.user.email;
    const adminName = req.user.name;
    
    let tagsArray = [];
    if (tags) {
      tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }
    
    const resourceId = await AdminResource.create({
      title,
      type,
      description: description || title,
      tags: tagsArray,
      file_url,
      admin_id: adminId,
      admin_email: adminEmail,
      admin_name: adminName
    });
    
    res.json({ success: true, data: { id: resourceId } });
  } catch (error) {
    next(error);
  }
};

const deleteAdminResource = async (req, res, next) => {
  try {
    await AdminResource.delete(req.params.id);
    res.json({ success: true, message: 'Ressource admin supprimée' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminResources, createAdminResource, deleteAdminResource };