import mongoose from 'mongoose';

const CommunityListingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    itemName: { type: String, required: true, trim: true },
    quantity: { type: String, required: true }, // free text e.g. "2 kg"
    image: { type: String },
    // GeoJSON Point for proximity queries
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    status: {
      type: String,
      enum: ['available', 'claimed', 'expired'],
      default: 'available',
      index: true,
    },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

CommunityListingSchema.index({ location: '2dsphere' });

CommunityListingSchema.methods.toDTO = function (currentUserName, distanceMeters) {
  return {
    id: this._id.toString(),
    itemName: this.itemName,
    quantity: this.quantity,
    image: this.image,
    userName: currentUserName || 'Anonymous',
    lat: this.location.coordinates[1],
    lng: this.location.coordinates[0],
    distance:
      distanceMeters !== undefined
        ? distanceMeters < 1000
          ? `${Math.round(distanceMeters)}m away`
          : `${(distanceMeters / 1000).toFixed(1)}km away`
        : undefined,
    status: this.status,
  };
};

export default mongoose.model('CommunityListing', CommunityListingSchema);
