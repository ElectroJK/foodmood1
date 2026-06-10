import mongoose from 'mongoose';

const IngredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: String, default: '' },
    normalizedName: { type: String, index: true },
  },
  { _id: false }
);

const RecipeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String },
    cookingTime: { type: Number, required: true, min: 0, default: 30 },
    servings: { type: Number, required: true, min: 1, default: 2 },
    ingredients: { type: [IngredientSchema], required: true },
    instructions: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    // Tracks where the recipe came from. 'system' = seeded locally,
    // 'spoonacular' = upserted from external API call.
    source: { type: String, default: 'system', index: true },
    // External provider ID — used to de-duplicate Spoonacular recipes
    // across multiple recommendation calls.
    externalId: { type: String, index: true },
  },
  { timestamps: true }
);

RecipeSchema.index({ source: 1, externalId: 1 }, { unique: true, sparse: true });
RecipeSchema.index({ name: 'text', 'ingredients.name': 'text' });

export default mongoose.model('Recipe', RecipeSchema);
