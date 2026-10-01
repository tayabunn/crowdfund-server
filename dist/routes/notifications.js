"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Notification_1 = __importDefault(require("../models/Notification"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Get all notifications for the logged-in user
router.get('/', authMiddleware_1.verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const notifications = await Notification_1.default.find({ toEmail: req.user.email }).sort({ time: -1 });
        res.json(notifications);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Mark all notifications as read
router.patch('/read-all', authMiddleware_1.verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        await Notification_1.default.updateMany({ toEmail: req.user.email, read: false }, { read: true });
        res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Mark a specific notification as read
router.patch('/:id/read', authMiddleware_1.verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const notification = await Notification_1.default.findOneAndUpdate({ _id: req.params.id, toEmail: req.user.email }, { read: true }, { new: true });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json(notification);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.default = router;
