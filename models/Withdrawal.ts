import mongoose, { Schema, Document } from 'mongoose';

export interface IWithdrawal extends Document {
  creator_name: string;
  creator_email: string;
  withdrawal_credit: number;
  withdrawal_amount: number;
  payment_system: string;
  account_number: string;
  status: 'pending' | 'approved';
  withdraw_date: Date;
}

const WithdrawalSchema: Schema = new Schema({
  creator_name: {
    type: String,
    required: true,
  },
  creator_email: {
    type: String,
    required: true,
  },
  withdrawal_credit: {
    type: Number,
    required: true,
  },
  withdrawal_amount: {
    type: Number,
    required: true,
  },
  payment_system: {
    type: String,
    required: true,
  },
  account_number: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending',
  },
  withdraw_date: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

export default mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema);
