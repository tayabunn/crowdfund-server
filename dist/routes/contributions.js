"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Contribution_1 = __importDefault(require("../models/Contribution"));
const Campaign_1 = __importDefault(require("../models/Campaign"));
const User_1 = __importDefault(require("../models/User"));
const Notification_1 = __importDefault(require("../models/Notification"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const emailService_1 = require("../services/emailService");
const router = express_1.default.Router();
// Make a contribution (Supporter)
router.post('/', (0, authMiddleware_1.verifyRole)(['Supporter']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const { campaign_id, campaign_title, contribution_amount, Contribution_amount, creator_name, creator_email, message, reward_id, reward_title } = req.body;
        const finalAmount = contribution_amount || Contribution_amount;
        // Check if user has enough credits
        const user = await User_1.default.findById(req.user.id);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        if (user.credits < finalAmount) {
            return res.status(400).json({ message: 'Insufficient credits' });
        }
        // Deduct credits
        user.credits -= finalAmount;
        await user.save();
        // If reward selected, increment claimed_count on campaign
        if (reward_id) {
            const campaign = await Campaign_1.default.findById(campaign_id);
            if (campaign && campaign.rewards) {
                const reward = campaign.rewards.find(r => r._id?.toString() === reward_id);
                if (reward) {
                    reward.claimed_count = (reward.claimed_count || 0) + 1;
                    await campaign.save();
                }
            }
        }
        const contribution = new Contribution_1.default({
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
            message: message || '',
            reward_id: reward_id || '',
            reward_title: reward_title || ''
        });
        await contribution.save();
        // Create Notification for Creator
        const notification = new Notification_1.default({
            message: `${user.name} made a contribution of ${finalAmount} credits to ${campaign_title}${reward_title ? ` (Reward: ${reward_title})` : ''}.`,
            toEmail: creator_email,
            actionRoute: '/dashboard/creator-home',
            time: new Date()
        });
        await notification.save();
        // Create Notification for Supporter
        const supporterNotification = new Notification_1.default({
            message: `You contributed ${finalAmount} credits to "${campaign_title}"${reward_title ? ` for perk: ${reward_title}` : ''}.`,
            toEmail: req.user.email,
            actionRoute: `/explore/${campaign_id}`,
            time: new Date()
        });
        await supporterNotification.save();
        // Send email to Creator
        await (0, emailService_1.sendEmail)({
            to: creator_email,
            subject: `New Contribution received: ${campaign_title}`,
            text: `${user.name} made a contribution of ${finalAmount} credits to your campaign "${campaign_title}".`,
            html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #02a95c; margin-bottom: 16px;">New Campaign Contribution Received!</h2>
          <p style="font-size: 14px; color: #333; line-height: 1.5;"><strong>${user.name}</strong> has just contributed <strong>${finalAmount} credits</strong> to your campaign <strong>"${campaign_title}"</strong>${reward_title ? ` selecting tier <strong>"${reward_title}"</strong>` : ''}.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999;">This is an automated system notification from CrowdFund. Please do not reply directly to this email.</p>
        </div>
      `
        });
        // Send email to Supporter
        await (0, emailService_1.sendEmail)({
            to: req.user.email,
            subject: `Contribution Receipt: ${campaign_title}`,
            text: `You have successfully contributed ${finalAmount} credits to "${campaign_title}".`,
            html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #02a95c; margin-bottom: 16px;">Contribution Receipt</h2>
          <p style="font-size: 14px; color: #333; line-height: 1.5;">You have successfully pledged <strong>${finalAmount} credits</strong> to support the campaign <strong>"${campaign_title}"</strong>${reward_title ? ` for reward: <strong>"${reward_title}"</strong>` : ''}.</p>
          <p style="font-size: 14px; color: #333; line-height: 1.5;">This contribution is currently pending validation by the campaign creator.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999;">This is an automated system notification from CrowdFund. Please do not reply directly to this email.</p>
        </div>
      `
        });
        res.status(201).json(contribution);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Get supporter contributions
router.get('/my-contributions', (0, authMiddleware_1.verifyRole)(['Supporter']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
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
            const contributions = await Contribution_1.default.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            const total = await Contribution_1.default.countDocuments(query);
            return res.json({
                contributions,
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: page
            });
        }
        else {
            const contributions = await Contribution_1.default.find(query).sort({ createdAt: -1 });
            return res.json(contributions);
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Get creator pending contributions
router.get('/pending', (0, authMiddleware_1.verifyRole)(['Creator']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const contributions = await Contribution_1.default.find({ creator_email: req.user.email, status: 'pending' });
        res.json(contributions);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Approve or reject contribution (Creator)
router.patch('/:id/status', (0, authMiddleware_1.verifyRole)(['Creator']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const { status } = req.body;
        const contribution = await Contribution_1.default.findOne({ _id: req.params.id, creator_email: req.user.email });
        if (!contribution)
            return res.status(404).json({ message: 'Contribution not found' });
        if (contribution.status !== 'pending')
            return res.status(400).json({ message: 'Already processed' });
        contribution.status = status;
        await contribution.save();
        if (status === 'approved') {
            const campaign = await Campaign_1.default.findById(contribution.campaign_id);
            if (campaign) {
                campaign.amount_raised += contribution.contribution_amount;
                // Auto-check and unlock stretch goals if goal exceeded
                if (campaign.stretch_goals && campaign.stretch_goals.length > 0) {
                    campaign.stretch_goals.forEach(goal => {
                        if (campaign.amount_raised >= goal.amount) {
                            goal.is_unlocked = true;
                        }
                    });
                }
                await campaign.save();
            }
        }
        else if (status === 'rejected') {
            const supporter = await User_1.default.findOne({ email: contribution.supporter_email });
            if (supporter) {
                supporter.credits += contribution.contribution_amount;
                await supporter.save();
            }
        }
        // Notify Supporter
        const notification = new Notification_1.default({
            message: `Your Contribution of ${contribution.contribution_amount} credits to ${contribution.campaign_title} was ${status} by ${contribution.creator_name}`,
            toEmail: contribution.supporter_email || contribution.Supporter_email || '',
            actionRoute: '/dashboard/Supporter-home',
            time: new Date()
        });
        await notification.save();
        // Trigger automated email
        await (0, emailService_1.sendEmail)({
            to: contribution.supporter_email || contribution.Supporter_email || '',
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
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.default = router;
