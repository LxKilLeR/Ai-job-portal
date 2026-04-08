const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Hybrid'],
    default: 'Full-time'
  },
  salary: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  remote: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    required: true
  },
  requirements: [{
    type: String
  }],
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Additional recruiter-specific fields
  views: {
    type: Number,
    default: 0
  },
  applicationsCount: {
    type: Number,
    default: 0
  },
  experienceLevel: {
    type: String,
    enum: ['Entry', 'Mid', 'Senior', 'Lead', 'Executive'],
    default: 'Mid'
  },
  industry: {
    type: String,
    trim: true
  },
  benefits: [{
    type: String,
    trim: true
  }],
  deadline: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for recruiter's job queries
jobSchema.index({ postedBy: 1, createdAt: -1 });
jobSchema.index({ isActive: 1, createdAt: -1 });
jobSchema.index({ skills: 1 });

module.exports = mongoose.model('Job', jobSchema);
