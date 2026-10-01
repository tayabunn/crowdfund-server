import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  photo_url?: string;
  role: 'Supporter' | 'Creator' | 'Admin';
  credits: number;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  photo_url: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['Supporter', 'Creator', 'Admin'],
    default: 'Supporter',
  },
  credits: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
