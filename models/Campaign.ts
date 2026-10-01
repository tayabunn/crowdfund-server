import mongoose, { Schema, Document } from 'mongoose';

export interface IReward {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  amount: number;
  estimated_delivery?: string;
  items?: string[];
  claimed_count: number;
  max_slots?: number;
}

export interface IStretchGoal {
  _id?: mongoose.Types.ObjectId;
  amount: number;
  title: string;
  description: string;
  is_unlocked: boolean;
}

export interface ICampaignUpdate {
  _id?: mongoose.Types.ObjectId;
  title: string;
  content: string;
  date: Date;
  author_name: string;
}

export interface ICommentReply {
  _id?: mongoose.Types.ObjectId;
  user_name: string;
  user_email: string;
  user_photo?: string;
  user_role: string;
  text: string;
  date: Date;
}

export interface IComment {
  _id?: mongoose.Types.ObjectId;
  user_name: string;
  user_email: string;
  user_photo?: string;
  user_role: string;
  text: string;
  date: Date;
  replies: ICommentReply[];
}

export interface ICampaign extends Document {
  title: string;
  story: string;
  category: string;
  funding_goal: number;
  minimum_contribution: number;
  deadline: Date;
  reward_info: string;
  image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  creator_name: string;
  creator_email: string;
  amount_raised: number;
  funding_type: 'flexible' | 'fixed';
  rewards: IReward[];
  stretch_goals: IStretchGoal[];
  updates: ICampaignUpdate[];
  comments: IComment[];
}

const RewardSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  estimated_delivery: { type: String, default: '' },
  items: [{ type: String }],
  claimed_count: { type: Number, default: 0 },
  max_slots: { type: Number }
});

const StretchGoalSchema = new Schema({
  amount: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  is_unlocked: { type: Boolean, default: false }
});

const CampaignUpdateSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
  author_name: { type: String, required: true }
});

const CommentReplySchema = new Schema({
  user_name: { type: String, required: true },
  user_email: { type: String, required: true },
  user_photo: { type: String, default: '' },
  user_role: { type: String, default: 'Supporter' },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const CommentSchema = new Schema({
  user_name: { type: String, required: true },
  user_email: { type: String, required: true },
  user_photo: { type: String, default: '' },
  user_role: { type: String, default: 'Supporter' },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now },
  replies: [CommentReplySchema]
});

const CampaignSchema: Schema = new Schema({
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
  },
  funding_type: {
    type: String,
    enum: ['flexible', 'fixed'],
    default: 'flexible',
  },
  rewards: [RewardSchema],
  stretch_goals: [StretchGoalSchema],
  updates: [CampaignUpdateSchema],
  comments: [CommentSchema]
}, { timestamps: true });

export default mongoose.model<ICampaign>('Campaign', CampaignSchema);
