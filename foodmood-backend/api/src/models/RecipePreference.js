import mongoose from 'mongoose';

const RecipePreferenceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipe: { type: mongoose.Schema.Types.ObjectId, required: true },
    preference: { type: String, enum: ['liked', 'disliked'], required: true },
  },
  { timestamps: true }
);

RecipePreferenceSchema.index({ user: 1, recipe: 1 }, { unique: true });

export default mongoose.model('RecipePreference', RecipePreferenceSchema);
