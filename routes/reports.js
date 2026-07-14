const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Report a campaign (Authenticated users)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { campaign_id, campaign_title, reason, details } = req.body;
    
    if (!campaign_id || !campaign_title || !reason || !details) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const report = new Report({
      campaign_id,
      campaign_title,
      reporter_email: req.user.email,
      reporter_name: req.user.name,
      reason,
      details,
      status: 'pending'
    });

    await report.save();
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all reports (Admin only)
router.get('/', verifyRole(['Admin']), async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resolve a report (Admin only)
router.patch('/:id/resolve', verifyRole(['Admin']), async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved' },
      { new: true }
    );
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
