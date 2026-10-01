import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  message: string;
  toEmail: string;
  actionRoute: string;
  read: boolean;
  time: Date;
}

const NotificationSchema: Schema = new Schema({
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
  read: {
    type: Boolean,
    default: false,
  },
  time: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);
