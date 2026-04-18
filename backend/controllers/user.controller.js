const User = require('../models/user.model');
const Profile = require('../models/profile.model');

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const updated = await User.update(req.params.id, req.body);
    res.json({ success: true, updated });
  } catch (error) {
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    const tags = await Profile.getUserTags(req.params.id);
    res.json({ success: true, data: { ...user, tags } });
  } catch (error) {
    next(error);
  }
};

const setUserTags = async (req, res, next) => {
  try {
    const { tags } = req.body;
    await Profile.setUserTags(req.params.id, tags);
    res.json({ success: true, message: 'Tags mis à jour' });
  } catch (error) {
    next(error);
  }
};

const getAllTeachers = async (req, res, next) => {
  try {
    const teachers = await User.getAllTeachers();
    res.json({ success: true, data: teachers });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const deleted = await User.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (error) {
    next(error);
  }
};
const getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    let users;
    
    if (role === 'ENSEIGNANT') {
      users = await User.getAllTeachers();
    } else if (role === 'ETUDIANT') {
      users = await User.getAllStudents();
    } else {
      users = await User.getAll();
    }
    
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};
module.exports = { getUserById, updateUser, getUserProfile, setUserTags, getAllTeachers, deleteUser, getAllUsers };