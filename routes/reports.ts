import express, { Response } from 'express';
import Report from '../models/Report';
import { verifyToken, verifyRole, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = express.Router();

// Report a campaign (Authenticated users)
router.post('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { campaign_id, campaign_title, reason, details } = req.body;
    
    if (!campaign_id || !campaign_title || !reason || !details) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const report = new Report({
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
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all reports (Admin only)
router.get('/', verifyRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resolve a report (Admin only)
router.patch('/:id/resolve', verifyRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved' },
      { new: true }
    );
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
