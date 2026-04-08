const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  extractedSkills: [{
    type: String,
    trim: true
  }],
  extractedExperience: {
    type: String
  },
  extractedEducation: {
    type: String
  },
  parsedData: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Resume', resumeSchema);
