const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Contribution = require('../models/Contribution');
const User = require('../models/User');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Get all approved active campaigns (with pagination and filtering using Aggregation Framework)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    
    const search = req.query.search || '';
    const category = req.query.category || 'All Categories';
    const minGoal = parseFloat(req.query.minGoal);
    const maxGoal = parseFloat(req.query.maxGoal);
    const status = req.query.status || 'approved';
    const deadlineFilter = req.query.deadline || 'active'; // 'active', 'expired', 'all'

    // Build Match Query
    let matchQuery = {};

    if (status !== 'all') {
      matchQuery.status = status;
    }

    if (deadlineFilter === 'active') {
      matchQuery.deadline = { $gte: new Date() };
    } else if (deadlineFilter === 'expired') {
      matchQuery.deadline = { $lt: new Date() };
    }

    if (search) {
      matchQuery.title = { $regex: search, $options: 'i' };
    }

    if (category !== 'All Categories') {
      matchQuery.category = category;
    }

    if (!isNaN(minGoal) || !isNaN(maxGoal)) {
      matchQuery.funding_goal = {};
      if (!isNaN(minGoal)) {
        matchQuery.funding_goal.$gte = minGoal;
      }
      if (!isNaN(maxGoal)) {
        matchQuery.funding_goal.$lte = maxGoal;
      }
    }

    // Sort order
    const sortBy = req.query.sortBy || 'newest';
    let sortStage = { createdAt: -1 };
    if (sortBy === 'oldest') {
      sortStage = { createdAt: 1 };
    } else if (sortBy === 'goal_desc') {
      sortStage = { funding_goal: -1 };
    } else if (sortBy === 'goal_asc') {
      sortStage = { funding_goal: 1 };
    }

    const pipeline = [
      { $match: matchQuery },
      { $sort: sortStage },
      {
        $facet: {
          metadata: [ { $count: "total" } ],
          data: [ { $skip: skip }, { $limit: limit } ]
        }
      }
    ];

    const result = await Campaign.aggregate(pipeline);
    const campaigns = result[0].data;
    const totalCampaigns = result[0].metadata[0] ? result[0].metadata[0].total : 0;

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
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User profile not found' });

    const newCampaign = new Campaign({ 
      ...req.body, 
      creator_email: req.user.email,
      creator_name: user.name 
    });
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

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    campaign.status = status;
    await campaign.save();

    // Create a notification for the creator
    const Notification = require('../models/Notification');
    let messageText = '';
    if (status === 'rejected') {
      messageText = `Your campaign "${campaign.title}" has been rejected by the admin.`;
    } else if (status === 'approved') {
      messageText = `Your campaign "${campaign.title}" has been approved by the admin!`;
    }

    if (messageText) {
      const notification = new Notification({
        message: messageText,
        toEmail: campaign.creator_email,
        actionRoute: '/dashboard/creator-home',
        time: new Date()
      });
      await notification.save();

      // Dispatch automated email notification
      const { sendEmail } = require('../services/emailService');
      await sendEmail({
        to: campaign.creator_email,
        subject: `Campaign Status Update: ${campaign.title}`,
        text: messageText,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #02a95c; margin-bottom: 16px;">Campaign Status Update</h2>
            <p style="font-size: 14px; color: #333; line-height: 1.5;">${messageText}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 11px; color: #999;">This is an automated system notification from CrowdFund. Please do not reply directly to this email.</p>
          </div>
        `
      });
    }

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

// Get all campaigns for admin management (Admin only)
router.get('/admin/all', verifyRole(['Admin']), async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete Campaign (Creator or Admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    let campaign;
    if (req.user.role === 'Admin') {
      campaign = await Campaign.findById(req.params.id);
    } else if (req.user.role === 'Creator') {
      campaign = await Campaign.findOne({ _id: req.params.id, creator_email: req.user.email });
    } else {
      return res.status(403).json({ message: 'Forbidden: Unauthorized role' });
    }

    if (!campaign) return res.status(404).json({ message: 'Campaign not found or unauthorized' });

    // Find all approved contributions for this campaign
    const approvedContributions = await Contribution.find({ campaign_id: campaign._id, status: 'approved' });

    // Refund each supporter their credits
    for (const contrib of approvedContributions) {
      const supporter = await User.findOne({ email: contrib.supporter_email });
      if (supporter) {
        supporter.credits += contrib.contribution_amount;
        await supporter.save();
      }
    }

    // Delete the campaign
    await Campaign.findByIdAndDelete(campaign._id);

    // Delete associated contributions
    await Contribution.deleteMany({ campaign_id: campaign._id });

    res.json({ message: 'Campaign deleted successfully and approved supporters refunded' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get top 6 funded campaigns
router.get('/top-funded', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: 'approved' })
      .sort({ amount_raised: -1 })
      .limit(6);
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific campaign by ID
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
