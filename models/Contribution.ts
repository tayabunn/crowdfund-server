import mongoose, { Schema, Document } from 'mongoose';

export interface IContribution extends Document {
  campaign_id: mongoose.Types.ObjectId;
  campaign_title: string;
  contribution_amount: number;
  Contribution_amount?: number;
  supporter_email: string;
  Supporter_email?: string;
  supporter_name: string;
  Supporter_name?: string;
  creator_name: string;
  creator_email: string;
  status: 'pending' | 'approved' | 'rejected';
  current_date: Date;
  message: string;
  reward_id?: string;
  reward_title?: string;
}

const ContributionSchema: Schema = new Schema({
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
  },
  reward_id: {
    type: String,
    default: ''
  },
  reward_title: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export default mongoose.model<IContribution>('Contribution', ContributionSchema);
