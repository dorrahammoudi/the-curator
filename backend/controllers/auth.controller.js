const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: '7d' }
  );
};

const ADMIN_DOMAINS = ['admin.rnu.tn', 'admin.curator.edu', 'admin.institution.tn'];

const isValidAdminEmail = (email) => {
  const domain = email.split('@')[1];
  return ADMIN_DOMAINS.includes(domain);
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, filiere, niveau } = req.body;
    
    if (role === 'ADMIN' && !isValidAdminEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Les comptes administrateurs doivent utiliser une adresse email avec le domaine @admin.rnu.tn' 
      });
    }
    
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userId = await User.create({ 
      name, 
      email, 
      password: hashedPassword, 
      role, 
      filiere, 
      niveau 
    });
    
    const user = await User.findById(userId);
    const token = generateToken(user);
    
    res.json({ 
      success: true, 
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }
    
    if (role && user.role !== role) {
      let roleMessage = '';
      if (user.role === 'ETUDIANT') roleMessage = 'Étudiant';
      else if (user.role === 'ENSEIGNANT') roleMessage = 'Enseignant';
      else if (user.role === 'ADMIN') roleMessage = 'Administrateur';
      
      return res.status(401).json({ 
        success: false, 
        message: `Ce compte est associé au rôle "${roleMessage}". Veuillez sélectionner le bon rôle.`
      });
    }
    
    if (user.role === 'ADMIN' && !isValidAdminEmail(email)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Les comptes administrateurs doivent utiliser une adresse email avec le domaine @admin.rnu.tn' 
      });
    }
    
    const token = generateToken(user);
    
    res.json({ 
      success: true, 
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };