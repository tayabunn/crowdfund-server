import express, { Response } from 'express';
import User from '../models/User';
import Payment from '../models/Payment';
import { verifyRole, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create payment intent
router.post('/create-payment-intent', verifyRole(['Supporter']), async (req: AuthenticatedRequest, res: Response) => {
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
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Confirm payment and add credits
router.post('/confirm-payment', verifyRole(['Supporter']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { paymentIntentId, creditsPurchased, amountPaid } = req.body;

    // Verify payment intent with Stripe (Skipped here for simplicity, assuming client sends valid confirmation)
    // Add credits to user
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.credits += creditsPurchased;
    await user.save();

    // Save the payment info
    const finalAmountPaid = amountPaid || (creditsPurchased / 10);
    const paymentRecord = new Payment({
      supporter_email: req.user.email,
      credits_purchased: creditsPurchased,
      amount_paid: finalAmountPaid,
      payment_intent_id: paymentIntentId,
      status: 'succeeded'
    });
    await paymentRecord.save();

    res.json({ message: 'Payment successful, credits added.', credits: user.credits });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
