import mongoose, { Schema, Document, models, model } from 'mongoose';
import { ProgressData } from '../src/services/progressService';

export interface IProgress extends ProgressData, Document {
  userId: string;
}

const ProgressSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  completedLessons: [String],
  scores: { type: Map, of: Number },
  detailedScores: { type: Map, of: Schema.Types.Mixed },
  lastActivity: String,
  points: Number,
  badges: [{
    id: String,
    name: String,
    icon: String,
    description: String,
    unlocked: Boolean,
  }],
  username: String,
  completionDates: { type: Map, of: String },
}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
  minimize: false, // Đảm bảo các object rỗng được lưu
});

export default models.Progress || model<IProgress>('Progress', ProgressSchema);