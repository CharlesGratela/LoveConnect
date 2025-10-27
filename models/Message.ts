import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  matchId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  text: string;
  read: boolean;
  createdAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient message queries
MessageSchema.index({ matchId: 1, createdAt: -1 });
MessageSchema.index({ receiverId: 1, read: 1 });

export default (mongoose.models.Message as Model<IMessage>) ||
  mongoose.model<IMessage>('Message', MessageSchema);
