const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  campaign_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  campaign_title: {
    type: String,
    required: true,
  },
  reporter_email: {
    type: String,
    required: true,
  },
  reporter_name: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'resolved'],
    default: 'pending',
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
