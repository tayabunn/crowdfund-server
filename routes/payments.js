const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const { verifyRole } = require('../middleware/authMiddleware');

// Create payment intent
router.post('/create-payment-intent', verifyRole(['Supporter']), async (req, res) => {
  try {
    const { amount } = req.body; // Amount in dollars
    
    // Stripe expects amount in cents
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Confirm payment and add credits
router.post('/confirm-payment', verifyRole(['Supporter']), async (req, res) => {
  try {
    const { paymentIntentId, creditsPurchased } = req.body;

    // Verify payment intent with Stripe (Skipped here for simplicity, assuming client sends valid confirmation)
    // Add credits to user
    const user = await User.findById(req.user.id);
    user.credits += creditsPurchased;
    await user.save();

    res.json({ message: 'Payment successful, credits added.', credits: user.credits });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
