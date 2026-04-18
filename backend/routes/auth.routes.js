const express = require('express');
const { register, login } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);  // Le rôle est déjà dans le body

module.exports = router;