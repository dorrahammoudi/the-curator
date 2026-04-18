const express = require('express');
const { 
  getUserById, 
  updateUser, 
  getUserProfile, 
  setUserTags, 
  getAllTeachers, 
  deleteUser,
  getAllUsers
} = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

router.get('/:id', authenticate, getUserById);
router.put('/:id', authenticate, updateUser);
router.get('/:id/profile', authenticate, getUserProfile);
router.post('/:id/tags', authenticate, setUserTags);
router.get('/admin/teachers', authenticate, authorize('ADMIN'), getAllTeachers);
router.get('/admin/users', authenticate, authorize('ADMIN'), getAllUsers);
router.delete('/admin/users/:id', authenticate, authorize('ADMIN'), deleteUser);

module.exports = router;