import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMatch extends Document {
  user1Id: mongoose.Types.ObjectId;
  user2Id: mongoose.Types.ObjectId;
  matchedAt: Date;
  createdAt: Date;
}

const MatchSchema: Schema = new Schema(
  {
    user1Id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user2Id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    matchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique matches and fast lookups
MatchSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });
MatchSchema.index({ user2Id: 1, user1Id: 1 });

export default (mongoose.models.Match as Model<IMatch>) ||
  mongoose.model<IMatch>('Match', MatchSchema);
