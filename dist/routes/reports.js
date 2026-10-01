"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Report_1 = __importDefault(require("../models/Report"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Report a campaign (Authenticated users)
router.post('/', authMiddleware_1.verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const { campaign_id, campaign_title, reason, details } = req.body;
        if (!campaign_id || !campaign_title || !reason || !details) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const report = new Report_1.default({
            campaign_id,
            campaign_title,
            reporter_email: req.user.email,
            reporter_name: req.user.name || '',
            reason,
            details,
            status: 'pending'
        });
        await report.save();
        res.status(201).json(report);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Get all reports (Admin only)
router.get('/', (0, authMiddleware_1.verifyRole)(['Admin']), async (req, res) => {
    try {
        const reports = await Report_1.default.find().sort({ createdAt: -1 });
        res.json(reports);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Resolve a report (Admin only)
router.patch('/:id/resolve', (0, authMiddleware_1.verifyRole)(['Admin']), async (req, res) => {
    try {
        const report = await Report_1.default.findByIdAndUpdate(req.params.id, { status: 'resolved' }, { new: true });
        if (!report)
            return res.status(404).json({ message: 'Report not found' });
        res.json(report);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.default = router;
