const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// SRS Appendix B — User. SEC-001: password is stored as a bcrypt hash.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address']
    },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' }
  },
  { timestamps: true }
);

userSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.password_hash);
};

// SEC-005 / SEC-001: the hash never leaves the API.
userSchema.methods.toJSON = function () {
  const { _id, name, email, role, createdAt } = this.toObject();
  return { id: _id, name, email, role, createdAt };
};

userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

module.exports = mongoose.model('User', userSchema);
