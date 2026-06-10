import mongoose from 'mongoose';

// Schema mirrors frontend FoodItem (src/app/context/FoodMoodContext.tsx)
const FoodItemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['Dairy', 'Meat', 'Veggies', 'Fruits', 'Bakery', 'Grains', 'Pantry', 'Frozen', 'Beverages', 'Other'],
      default: 'Other',
    },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, enum: ['g', 'kg', 'ml', 'L', 'pcs', 'pack'], default: 'pcs' },
    price: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date, required: true, index: true },
    addedDate: { type: Date, required: true, default: () => new Date() },
    image: { type: String },
    status: {
      type: String,
      enum: ['active', 'consumed', 'discarded', 'shared'],
      default: 'active',
      index: true,
    },
    consumedAt: { type: Date },
  },
  { timestamps: true }
);

// Map DB document → API DTO matching frontend FoodItem
FoodItemSchema.methods.toDTO = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    category: this.category,
    quantity: this.quantity,
    unit: this.unit,
    price: this.price,
    expiryDate: this.expiryDate.toISOString().split('T')[0],
    addedDate: this.addedDate.toISOString().split('T')[0],
    image: this.image,
    status: this.status,
  };
};

export default mongoose.model('FoodItem', FoodItemSchema);
