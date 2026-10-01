import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  campaign_id: mongoose.Types.ObjectId;
  campaign_title: string;
  reporter_email: string;
  reporter_name: string;
  reason: string;
  details: string;
  status: 'pending' | 'resolved';
}

const ReportSchema: Schema = new Schema({
  campaign_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  campaign_title: {
    type: String,
    required: true,
  },
  reporter_email: {
    type: String,
    required: true,
  },
  reporter_name: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'resolved'],
    default: 'pending',
  }
}, { timestamps: true });

export default mongoose.model<IReport>('Report', ReportSchema);
