const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  supporter_email: {
    type: String,
    required: true,
  },
  credits_purchased: {
    type: Number,
    required: true,
  },
  amount_paid: {
    type: Number,
    required: true,
  },
  payment_intent_id: {
    type: String,
    required: true,
  },
  payment_date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    default: 'succeeded',
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
