const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Get all users (Admin only)
router.get('/', verifyRole(['Admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role (Admin only)
router.put('/:id/role', verifyRole(['Admin']), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['Supporter', 'Creator', 'Admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove user (Admin only)
router.delete('/:id', verifyRole(['Admin']), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
