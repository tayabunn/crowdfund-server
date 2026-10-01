"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const Payment_1 = __importDefault(require("../models/Payment"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// Create payment intent
router.post('/create-payment-intent', (0, authMiddleware_1.verifyRole)(['Supporter']), async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Confirm payment and add credits
router.post('/confirm-payment', (0, authMiddleware_1.verifyRole)(['Supporter']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const { paymentIntentId, creditsPurchased, amountPaid } = req.body;
        // Verify payment intent with Stripe (Skipped here for simplicity, assuming client sends valid confirmation)
        // Add credits to user
        const user = await User_1.default.findById(req.user.id);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        user.credits += creditsPurchased;
        await user.save();
        // Save the payment info
        const finalAmountPaid = amountPaid || (creditsPurchased / 10);
        const paymentRecord = new Payment_1.default({
            supporter_email: req.user.email,
            credits_purchased: creditsPurchased,
            amount_paid: finalAmountPaid,
            payment_intent_id: paymentIntentId,
            status: 'succeeded'
        });
        await paymentRecord.save();
        res.json({ message: 'Payment successful, credits added.', credits: user.credits });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.default = router;
