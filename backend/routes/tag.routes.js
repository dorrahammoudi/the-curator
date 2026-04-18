const express = require('express');
const { getAllTags, getPopularTags, getTagById, createTag, updateTag, deleteTag } = require('../controllers/tag.controller');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

router.get('/', getAllTags);
router.get('/popular', getPopularTags);
router.get('/:id', getTagById);
router.post('/', authenticate, authorize('ENSEIGNANT', 'ADMIN'), createTag);
router.put('/:id', authenticate, authorize('ADMIN'), updateTag);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteTag);

module.exports = router;