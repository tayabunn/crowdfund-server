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
  supporter_email: {
    type: String,
    required: true,
  },
  supporter_name: {
    type: String,
    required: true,
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
  }
}, { timestamps: true });

module.exports = mongoose.model('Contribution', ContributionSchema);
