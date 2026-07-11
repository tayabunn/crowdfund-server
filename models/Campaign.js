const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  story: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  funding_goal: {
    type: Number,
    required: true,
  },
  minimum_contribution: {
    type: Number,
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  reward_info: {
    type: String,
    required: true,
  },
  image_url: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  creator_name: {
    type: String,
    required: true,
  },
  creator_email: {
    type: String,
    required: true,
  },
  amount_raised: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', CampaignSchema);
