const express = require('express');
const { getAdminResources, createAdminResource, deleteAdminResource } = require('../controllers/adminResource.controller');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticate, authorize('ADMIN'), getAdminResources);
router.post('/', authenticate, authorize('ADMIN'), createAdminResource);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteAdminResource);

module.exports = router;