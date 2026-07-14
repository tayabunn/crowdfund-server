const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Withdrawal = require('../models/Withdrawal');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Get current user profile (Any authenticated user)
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Convert to a plain object so we can update user.credits on the fly
    const userObj = user.toObject();

    if (user.role === 'Creator') {
      const campaigns = await Campaign.find({ creator_email: user.email });
      const totalRaised = campaigns.reduce((sum, camp) => sum + (camp.amount_raised || 0), 0);
      const pastWithdrawals = await Withdrawal.find({ creator_email: user.email });
      const totalWithdrawnOrPending = pastWithdrawals.reduce((sum, w) => sum + w.withdrawal_credit, 0);
      userObj.credits = totalRaised - totalWithdrawnOrPending;
    }
    
    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
 
// Update user profile (Any authenticated user)
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, email, photo_url } = req.body;
    const userId = req.user.id;

    // If email is being changed, check if it's already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already in use by another account' });
      }
    }

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email;
    if (photo_url !== undefined) updateFields.photo_url = photo_url;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get admin dashboard stats
router.get('/admin/stats', verifyRole(['Admin']), async (req, res) => {
  try {
    const totalSupporters = await User.countDocuments({ role: 'Supporter' });
    const totalCreators = await User.countDocuments({ role: 'Creator' });

    // Calculate total available credits dynamically
    const users = await User.find({});
    let totalAvailableCredits = 0;
    
    const Campaign = require('../models/Campaign');
    const Withdrawal = require('../models/Withdrawal');
    
    const campaigns = await Campaign.find({ status: 'approved' });
    const withdrawals = await Withdrawal.find({});

    for (const u of users) {
      if (u.role === 'Creator') {
        const uCampaigns = campaigns.filter(c => c.creator_email === u.email);
        const totalRaised = uCampaigns.reduce((sum, c) => sum + (c.amount_raised || 0), 0);
        const uWithdrawals = withdrawals.filter(w => w.creator_email === u.email);
        const totalWithdrawnOrPending = uWithdrawals.reduce((sum, w) => sum + w.withdrawal_credit, 0);
        totalAvailableCredits += (totalRaised - totalWithdrawnOrPending);
      } else if (u.role === 'Supporter') {
        totalAvailableCredits += (u.credits || 0);
      }
    }

    // Calculate total payments processed from Payments collection
    const Payment = require('../models/Payment');
    const payments = await Payment.find({ status: 'succeeded' });
    const totalPaymentsProcessed = payments.reduce((sum, p) => sum + p.amount_paid, 0);

    res.json({
      totalSupporters,
      totalCreators,
      totalAvailableCredits,
      totalPaymentsProcessed
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

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
