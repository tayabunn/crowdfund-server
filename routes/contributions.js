const express = require('express');
const router = express.Router();
const Contribution = require('../models/Contribution');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { verifyRole } = require('../middleware/authMiddleware');

// Make a contribution (Supporter)
router.post('/', verifyRole(['Supporter']), async (req, res) => {
  try {
    const { campaign_id, campaign_title, contribution_amount, creator_name, creator_email } = req.body;
    
    // Check if user has enough credits
    const user = await User.findById(req.user.id);
    if (user.credits < contribution_amount) {
      return res.status(400).json({ message: 'Insufficient credits' });
    }

    // Deduct credits temporarily? (Requirements say status is pending initially).
    // The requirement says: After submitting, save with status pending. 
    // We will deduct credits when making the contribution to ensure they don't overspend.
    user.credits -= contribution_amount;
    await user.save();

    const contribution = new Contribution({
      campaign_id,
      campaign_title,
      contribution_amount,
      supporter_email: req.user.email,
      supporter_name: user.name,
      creator_name,
      creator_email
    });
    await contribution.save();

    // Create Notification for Creator
    const notification = new Notification({
      message: `${user.name} made a contribution of ${contribution_amount} credits to ${campaign_title}.`,
      toEmail: creator_email,
      actionRoute: '/dashboard/creator-home'
    });
    await notification.save();

    res.status(201).json(contribution);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get supporter contributions
router.get('/my-contributions', verifyRole(['Supporter']), async (req, res) => {
  try {
    const contributions = await Contribution.find({ supporter_email: req.user.email }).sort({ createdAt: -1 });
    res.json(contributions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get creator pending contributions
router.get('/pending', verifyRole(['Creator']), async (req, res) => {
  try {
    const contributions = await Contribution.find({ creator_email: req.user.email, status: 'pending' });
    res.json(contributions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve or reject contribution (Creator)
router.patch('/:id/status', verifyRole(['Creator']), async (req, res) => {
  try {
    const { status } = req.body;
    const contribution = await Contribution.findOne({ _id: req.params.id, creator_email: req.user.email });
    
    if (!contribution) return res.status(404).json({ message: 'Contribution not found' });
    if (contribution.status !== 'pending') return res.status(400).json({ message: 'Already processed' });

    contribution.status = status;
    await contribution.save();

    if (status === 'approved') {
      const campaign = await Campaign.findById(contribution.campaign_id);
      campaign.amount_raised += contribution.contribution_amount;
      await campaign.save();
    } else if (status === 'rejected') {
      const supporter = await User.findOne({ email: contribution.supporter_email });
      supporter.credits += contribution.contribution_amount;
      await supporter.save();
    }

    // Notify Supporter
    const notification = new Notification({
      message: `Your contribution of ${contribution.contribution_amount} credits to ${contribution.campaign_title} was ${status} by ${contribution.creator_name}`,
      toEmail: contribution.supporter_email,
      actionRoute: '/dashboard/supporter-home'
    });
    await notification.save();

    res.json(contribution);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
