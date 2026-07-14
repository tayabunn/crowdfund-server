const mongoose = require('mongoose');

const ContributionSchema = new mongoose.Schema({
  campaign_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  campaign_title: {
    type: String,
    required: true,
  },
  contribution_amount: {
    type: Number,
    required: true,
  },
  Contribution_amount: {
    type: Number,
  },
  supporter_email: {
    type: String,
    required: true,
  },
  Supporter_email: {
    type: String,
  },
  supporter_name: {
    type: String,
    required: true,
  },
  Supporter_name: {
    type: String,
  },
  creator_name: {
    type: String,
    required: true,
  },
  creator_email: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  current_date: {
    type: Date,
    default: Date.now,
  },
  message: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Contribution', ContributionSchema);
