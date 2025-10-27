import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILike extends Document {
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LikeSchema: Schema = new Schema(
  {
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique likes and fast lookups
LikeSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });
LikeSchema.index({ toUserId: 1, fromUserId: 1 });

export default (mongoose.models.Like as Model<ILike>) ||
  mongoose.model<ILike>('Like', LikeSchema);
