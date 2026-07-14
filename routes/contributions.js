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
    const { campaign_id, campaign_title, contribution_amount, Contribution_amount, creator_name, creator_email, message } = req.body;
    const finalAmount = contribution_amount || Contribution_amount;
    
    // Check if user has enough credits
    const user = await User.findById(req.user.id);
    if (user.credits < finalAmount) {
      return res.status(400).json({ message: 'Insufficient credits' });
    }

    // Deduct credits temporarily? (Requirements say status is pending initially).
    // The requirement says: After submitting, save with status pending. 
    // We will deduct credits when making the contribution to ensure they don't overspend.
    user.credits -= finalAmount;
    await user.save();

    const contribution = new Contribution({
      campaign_id,
      campaign_title,
      contribution_amount: finalAmount,
      Contribution_amount: finalAmount,
      supporter_email: req.user.email,
      Supporter_email: req.user.email,
      supporter_name: user.name,
      Supporter_name: user.name,
      creator_name,
      creator_email,
      current_date: new Date(),
      message: message || ''
    });
    await contribution.save();

    // Create Notification for Creator
    const notification = new Notification({
      message: `${user.name} made a contribution of ${contribution_amount} credits to ${campaign_title}.`,
      toEmail: creator_email,
      actionRoute: '/dashboard/creator-home',
      time: new Date()
    });
    await notification.save();

    // Create Notification for Supporter
    const supporterNotification = new Notification({
      message: `You contributed ${contribution_amount} credits to "${campaign_title}".`,
      toEmail: req.user.email,
      actionRoute: `/explore/${campaign_id}`,
      time: new Date()
    });
    await supporterNotification.save();

    // Send email to Creator
    const { sendEmail } = require('../services/emailService');
    await sendEmail({
      to: creator_email,
      subject: `New Contribution received: ${campaign_title}`,
      text: `${user.name} made a contribution of ${contribution_amount} credits to your campaign "${campaign_title}".`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #02a95c; margin-bottom: 16px;">New Campaign Contribution Received!</h2>
          <p style="font-size: 14px; color: #333; line-height: 1.5;"><strong>${user.name}</strong> has just contributed <strong>${contribution_amount} credits</strong> to your campaign <strong>"${campaign_title}"</strong>.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999;">This is an automated system notification from CrowdFund. Please do not reply directly to this email.</p>
        </div>
      `
    });

    // Send email to Supporter
    await sendEmail({
      to: req.user.email,
      subject: `Contribution Receipt: ${campaign_title}`,
      text: `You have successfully contributed ${contribution_amount} credits to "${campaign_title}".`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #02a95c; margin-bottom: 16px;">Contribution Receipt</h2>
          <p style="font-size: 14px; color: #333; line-height: 1.5;">You have successfully pledged <strong>${contribution_amount} credits</strong> to support the campaign <strong>"${campaign_title}"</strong>.</p>
          <p style="font-size: 14px; color: #333; line-height: 1.5;">This contribution is currently pending validation by the campaign creator.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999;">This is an automated system notification from CrowdFund. Please do not reply directly to this email.</p>
        </div>
      `
    });

    res.status(201).json(contribution);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get supporter contributions
router.get('/my-contributions', verifyRole(['Supporter']), async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit) || 5;

    const query = {
      $or: [
        { supporter_email: req.user.email },
        { Supporter_email: req.user.email }
      ]
    };

    if (page) {
      const skip = (page - 1) * limit;
      const contributions = await Contribution.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      const total = await Contribution.countDocuments(query);
      return res.json({
        contributions,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      });
    } else {
      const contributions = await Contribution.find(query).sort({ createdAt: -1 });
      return res.json(contributions);
    }
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
      message: `Your Contribution of ${contribution.contribution_amount} credits to ${contribution.campaign_title} was ${status} by ${contribution.creator_name}`,
      toEmail: contribution.supporter_email || contribution.Supporter_email,
      actionRoute: '/dashboard/Supporter-home',
      time: new Date()
    });
    await notification.save();

    // Trigger automated email
    const { sendEmail } = require('../services/emailService');
    await sendEmail({
      to: contribution.supporter_email || contribution.Supporter_email,
      subject: `Contribution ${status === 'approved' ? 'Approved' : 'Rejected'}: ${contribution.campaign_title}`,
      text: `Your Contribution of ${contribution.contribution_amount} credits to ${contribution.campaign_title} was ${status} by ${contribution.creator_name}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #02a95c; margin-bottom: 16px;">Contribution ${status === 'approved' ? 'Approved' : 'Rejected'}</h2>
          <p style="font-size: 14px; color: #333; line-height: 1.5;">Your contribution of <strong>${contribution.contribution_amount} credits</strong> to the campaign <strong>"${contribution.campaign_title}"</strong> was <strong>${status}</strong> by ${contribution.creator_name}.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999;">This is an automated system notification from CrowdFund. Please do not reply directly to this email.</p>
        </div>
      `
    });

    res.json(contribution);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
