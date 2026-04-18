const express = require('express');
const { 
  getResources, 
  getResourceById,
  createResource, 
  updateResource, 
  deleteResource,
  incrementViews,
  incrementDownloads
} = require('../controllers/resource.controller');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticate, getResources);
router.get('/:id', authenticate, getResourceById);
router.post('/', authenticate, authorize('ENSEIGNANT', 'ADMIN'), createResource);
router.put('/:id', authenticate, authorize('ENSEIGNANT', 'ADMIN'), updateResource);
router.delete('/:id', authenticate, authorize('ENSEIGNANT', 'ADMIN'), deleteResource);
router.put('/:id/views', authenticate, incrementViews);
router.put('/:id/downloads', authenticate, incrementDownloads);

module.exports = router;