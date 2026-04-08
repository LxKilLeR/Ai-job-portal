const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['signup', 'login'],
    default: 'signup'
  },
  signupData: {
    // Stores signup form data: { name, role, company, password }
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() + 10); // 10 minutes expiry
      return date;
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index to auto-delete expired OTPs (TTL index)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index to prevent multiple OTPs for same email
otpSchema.index({ email: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('OTP', otpSchema);
