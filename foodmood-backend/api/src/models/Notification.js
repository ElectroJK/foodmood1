import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['expiry_warning', 'expiry_critical', 'recipe_suggestion', 'community', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed }, // { itemId, recipeId, ... }
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

NotificationSchema.methods.toDTO = function () {
  return {
    id: this._id.toString(),
    type: this.type,
    title: this.title,
    body: this.body,
    payload: this.payload,
    read: this.read,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('Notification', NotificationSchema);
