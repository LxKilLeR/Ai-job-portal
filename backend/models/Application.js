const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resume: {
    type: String, // URL to resume file
    default: null
  },
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'shortlisted', 'accepted', 'rejected'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one application per job per user
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
