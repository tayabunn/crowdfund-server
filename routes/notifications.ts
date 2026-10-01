import express, { Response } from 'express';
import Notification from '../models/Notification';
import { verifyToken, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = express.Router();

// Get all notifications for the logged-in user
router.get('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const notifications = await Notification.find({ toEmail: req.user.email }).sort({ time: -1 });
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark all notifications as read
router.patch('/read-all', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    await Notification.updateMany(
      { toEmail: req.user.email, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark a specific notification as read
router.patch('/:id/read', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, toEmail: req.user.email },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
