const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    // Password optional for Google OAuth users
  },
  role: {
    type: String,
    enum: ['Seeker', 'Employer', 'Admin'],
    default: 'Seeker'
  },
  // Company name for recruiters/employers
  company: {
    type: String,
    trim: true
  },
  // Additional profile fields for recruiters
  location: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  // Seeker onboarding fields
  searchingFor: {
    type: String,
    trim: true
  },
  profession: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  address: {
    type: String,
    trim: true
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: null
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  googleId: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Password hash karne ka middleware
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password compare karne ka method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
