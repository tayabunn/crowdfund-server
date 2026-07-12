const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Get all approved campaigns (with pagination, search, and category filter)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const search = req.query.search || '';
    const category = req.query.category || '';

    const query = { status: 'approved' };

    // Apply search filter if present
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Apply category filter if present (and not 'All Categories')
    if (category && category !== 'All Categories') {
      query.category = category;
    }

    const skipIndex = (page - 1) * limit;

    const totalCampaigns = await Campaign.countDocuments(query);
    const campaigns = await Campaign.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex);

    res.json({
      campaigns,
      totalCampaigns,
      totalPages: Math.ceil(totalCampaigns / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all pending campaigns (Admin)
router.get('/pending', verifyRole(['Admin']), async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get campaigns by creator
router.get('/creator', verifyRole(['Creator']), async (req, res) => {
  try {
    const campaigns = await Campaign.find({ creator_email: req.user.email }).sort({ deadline: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create campaign (Creator)
router.post('/', verifyRole(['Creator']), async (req, res) => {
  try {
    const newCampaign = new Campaign({ ...req.body, creator_email: req.user.email });
    await newCampaign.save();
    res.status(201).json(newCampaign);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve/Reject Campaign (Admin)
router.patch('/:id/status', verifyRole(['Admin']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Campaign (Creator)
router.put('/:id', verifyRole(['Creator']), async (req, res) => {
  try {
    const { title, story, reward_info } = req.body;
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, creator_email: req.user.email },
      { title, story, reward_info },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ message: 'Campaign not found or unauthorized' });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete Campaign (Creator)
router.delete('/:id', verifyRole(['Creator']), async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, creator_email: req.user.email });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found or unauthorized' });
    // Note: In real app, refund supporters here
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
