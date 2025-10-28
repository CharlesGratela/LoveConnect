import mongoose from 'mongoose';

export interface IPushSubscription {
  userId: mongoose.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const pushSubscriptionSchema = new mongoose.Schema<IPushSubscription>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to ensure one subscription per user per endpoint
pushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

export const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);
