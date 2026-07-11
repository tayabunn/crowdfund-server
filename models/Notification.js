const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  toEmail: {
    type: String,
    required: true,
  },
  actionRoute: {
    type: String,
    required: true,
  },
  time: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
