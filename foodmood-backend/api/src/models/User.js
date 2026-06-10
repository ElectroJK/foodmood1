import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Hash is optional because Google-OAuth users never set a local password.
    passwordHash: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // Lifecycle status set by admins from the Admin Dashboard. 'banned' users
    // still keep their data but cannot authenticate; 'inactive' is a passive
    // archive marker used by the admin UI but not enforced server-side.
    status: {
      type: String,
      enum: ['active', 'inactive', 'banned'],
      default: 'active',
      index: true,
    },
    // Activity counter — incremented by the inventory batch endpoint each time
    // the user successfully scans a receipt. Used by the admin dashboard.
    scansCount: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },

    // Email verification — set when the user clicks the link sent on registration.
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, index: true, sparse: true },
    emailVerifyExpiresAt: { type: Date },

    // Google OAuth — set when the user signs in with their Google account.
    googleId: { type: String, unique: true, sparse: true, index: true },
    avatarUrl: { type: String },

    // Aligned with frontend UserStats interface
    stats: {
      foodSavedKg: { type: Number, default: 0 },
      co2Offset: { type: Number, default: 0 },
      moneySaved: { type: Number, default: 0 },
      wasteWarriorLevel: { type: Number, default: 1 },
    },
  },
  { timestamps: true }
);

UserSchema.methods.toPublicJSON = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    status: this.status,
    stats: this.stats,
    emailVerified: this.emailVerified,
    avatarUrl: this.avatarUrl,
    createdAt: this.createdAt,
  };
};

UserSchema.methods.toAdminRow = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    status: this.status || 'active',
    scans: this.scansCount || 0,
    registered: this.createdAt,
    lastActiveAt: this.lastActiveAt,
    emailVerified: !!this.emailVerified,
  };
};

export default mongoose.model('User', UserSchema);
