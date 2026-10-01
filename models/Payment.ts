import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  supporter_email: string;
  credits_purchased: number;
  amount_paid: number;
  payment_intent_id: string;
  payment_date: Date;
  status: string;
}

const PaymentSchema: Schema = new Schema({
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

export default mongoose.model<IPayment>('Payment', PaymentSchema);
