"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const Campaign_1 = __importDefault(require("../models/Campaign"));
const Contribution_1 = __importDefault(require("../models/Contribution"));
const User_1 = __importDefault(require("../models/User"));
const Notification_1 = __importDefault(require("../models/Notification"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const emailService_1 = require("../services/emailService");
const router = express_1.default.Router();
// Get all approved active campaigns (with pagination and filtering)
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
        }
        else if (deadlineFilter === 'expired') {
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
        }
        else if (sortBy === 'goal_desc') {
            sortStage = { funding_goal: -1 };
        }
        else if (sortBy === 'goal_asc') {
            sortStage = { funding_goal: 1 };
        }
        else if (sortBy === 'popular') {
            sortStage = { amount_raised: -1 };
        }
        const pipeline = [
            { $match: matchQuery },
            { $sort: sortStage },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [{ $skip: skip }, { $limit: limit }]
                }
            }
        ];
        const result = await Campaign_1.default.aggregate(pipeline);
        const campaigns = result[0].data;
        const totalCampaigns = result[0].metadata[0] ? result[0].metadata[0].total : 0;
        res.json({
            campaigns,
            totalCampaigns,
            totalPages: Math.ceil(totalCampaigns / limit),
            currentPage: page
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Get user bookmarked campaigns
router.get('/bookmarks/my-saved', authMiddleware_1.verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const user = await User_1.default.findById(req.user.id).populate('bookmarks');
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json(user.bookmarks || []);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Toggle bookmark for campaign
router.post('/:id/bookmark', authMiddleware_1.verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const user = await User_1.default.findById(req.user.id);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const campaignId = new mongoose_1.default.Types.ObjectId(idStr);
        const existingIndex = user.bookmarks.findIndex(b => b.toString() === idStr);
        let isSaved = false;
        if (existingIndex > -1) {
            user.bookmarks.splice(existingIndex, 1);
            isSaved = false;
        }
        else {
            user.bookmarks.push(campaignId);
            isSaved = true;
        }
        await user.save();
        res.json({ isSaved, bookmarksCount: user.bookmarks.length });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Post an update to campaign (Creator only)
router.post('/:id/updates', (0, authMiddleware_1.verifyRole)(['Creator']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }
        const campaign = await Campaign_1.default.findOne({ _id: req.params.id, creator_email: req.user.email });
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found or unauthorized' });
        }
        campaign.updates.push({
            title,
            content,
            date: new Date(),
            author_name: campaign.creator_name
        });
        await campaign.save();
        // Broadcast in-app notification to all campaign contributors
        const contributions = await Contribution_1.default.find({ campaign_id: campaign._id });
        const uniqueEmails = Array.from(new Set(contributions.map(c => c.supporter_email)));
        for (const email of uniqueEmails) {
            const notif = new Notification_1.default({
                message: `New update posted on "${campaign.title}": ${title}`,
                toEmail: email,
                actionRoute: `/explore/${campaign._id}?tab=updates`,
                time: new Date()
            });
            await notif.save();
        }
        res.status(201).json(campaign.updates);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Post a comment to campaign (Any Authenticated User)
router.post('/:id/comments', authMiddleware_1.verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Comment text is required' });
        }
        const user = await User_1.default.findById(req.user.id);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const campaign = await Campaign_1.default.findById(req.params.id);
        if (!campaign)
            return res.status(404).json({ message: 'Campaign not found' });
        campaign.comments.unshift({
            user_name: user.name,
            user_email: user.email,
            user_photo: user.photo_url || '',
            user_role: user.role,
            text: text.trim(),
            date: new Date(),
            replies: []
        });
        await campaign.save();
        // Notify campaign creator if commenter is someone else
        if (campaign.creator_email !== user.email) {
            const notif = new Notification_1.default({
                message: `${user.name} commented on your campaign "${campaign.title}".`,
                toEmail: campaign.creator_email,
                actionRoute: `/explore/${campaign._id}?tab=comments`,
                time: new Date()
            });
            await notif.save();
        }
        res.status(201).json(campaign.comments);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Reply to a comment (Any Authenticated User)
router.post('/:id/comments/:commentId/reply', authMiddleware_1.verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Reply text is required' });
        }
        const user = await User_1.default.findById(req.user.id);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const campaign = await Campaign_1.default.findById(req.params.id);
        if (!campaign)
            return res.status(404).json({ message: 'Campaign not found' });
        const comment = campaign.comments.find(c => c._id?.toString() === req.params.commentId);
        if (!comment)
            return res.status(404).json({ message: 'Comment not found' });
        comment.replies.push({
            user_name: user.name,
            user_email: user.email,
            user_photo: user.photo_url || '',
            user_role: user.role,
            text: text.trim(),
            date: new Date()
        });
        await campaign.save();
        res.status(201).json(campaign.comments);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Get all pending campaigns (Admin)
router.get('/pending', (0, authMiddleware_1.verifyRole)(['Admin']), async (req, res) => {
    try {
        const campaigns = await Campaign_1.default.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.json(campaigns);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Get campaigns by creator
router.get('/creator', (0, authMiddleware_1.verifyRole)(['Creator']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const campaigns = await Campaign_1.default.find({ creator_email: req.user.email }).sort({ deadline: -1 });
        res.json(campaigns);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Create campaign (Creator)
router.post('/', (0, authMiddleware_1.verifyRole)(['Creator']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const user = await User_1.default.findById(req.user.id);
        if (!user)
            return res.status(404).json({ message: 'User profile not found' });
        const newCampaign = new Campaign_1.default({
            ...req.body,
            creator_email: req.user.email,
            creator_name: user.name
        });
        await newCampaign.save();
        res.status(201).json(newCampaign);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Approve/Reject Campaign (Admin)
router.patch('/:id/status', (0, authMiddleware_1.verifyRole)(['Admin']), async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const campaign = await Campaign_1.default.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }
        campaign.status = status;
        await campaign.save();
        // Create a notification for the creator
        let messageText = '';
        if (status === 'rejected') {
            messageText = `Your campaign "${campaign.title}" has been rejected by the admin.`;
        }
        else if (status === 'approved') {
            messageText = `Your campaign "${campaign.title}" has been approved by the admin!`;
        }
        if (messageText) {
            const notification = new Notification_1.default({
                message: messageText,
                toEmail: campaign.creator_email,
                actionRoute: '/dashboard/creator-home',
                time: new Date()
            });
            await notification.save();
            // Dispatch automated email notification
            await (0, emailService_1.sendEmail)({
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
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Update Campaign (Creator)
router.put('/:id', (0, authMiddleware_1.verifyRole)(['Creator']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const { title, story, reward_info, rewards, stretch_goals, funding_type } = req.body;
        const campaign = await Campaign_1.default.findOneAndUpdate({ _id: req.params.id, creator_email: req.user.email }, { $set: { title, story, reward_info, rewards, stretch_goals, funding_type } }, { new: true });
        if (!campaign)
            return res.status(404).json({ message: 'Campaign not found or unauthorized' });
        res.json(campaign);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Get all campaigns for admin management (Admin only)
router.get('/admin/all', (0, authMiddleware_1.verifyRole)(['Admin']), async (req, res) => {
    try {
        const campaigns = await Campaign_1.default.find().sort({ createdAt: -1 });
        res.json(campaigns);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Delete Campaign (Creator or Admin)
router.delete('/:id', authMiddleware_1.verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        let campaign;
        if (req.user.role === 'Admin') {
            campaign = await Campaign_1.default.findById(req.params.id);
        }
        else if (req.user.role === 'Creator') {
            campaign = await Campaign_1.default.findOne({ _id: req.params.id, creator_email: req.user.email });
        }
        else {
            return res.status(403).json({ message: 'Forbidden: Unauthorized role' });
        }
        if (!campaign)
            return res.status(404).json({ message: 'Campaign not found or unauthorized' });
        // Find all contributions (both approved and pending) for this campaign
        const contributions = await Contribution_1.default.find({ campaign_id: campaign._id });
        // Refund each supporter their credits
        for (const contrib of contributions) {
            const supporter = await User_1.default.findOne({ email: contrib.supporter_email });
            if (supporter) {
                supporter.credits += contrib.contribution_amount;
                await supporter.save();
            }
        }
        // Delete the campaign
        await Campaign_1.default.findByIdAndDelete(campaign._id);
        // Delete associated contributions
        await Contribution_1.default.deleteMany({ campaign_id: campaign._id });
        res.json({ message: 'Campaign deleted successfully and all contributors refunded' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Get top 6 funded campaigns
router.get('/top-funded', async (req, res) => {
    try {
        const campaigns = await Campaign_1.default.find({ status: 'approved' })
            .sort({ amount_raised: -1 })
            .limit(6);
        res.json(campaigns);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Get specific campaign by ID
router.get('/:id', async (req, res) => {
    try {
        const campaign = await Campaign_1.default.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }
        res.json(campaign);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.default = router;
