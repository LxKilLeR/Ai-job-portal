const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  type: {
    type: String,
    enum: ['application_status', 'new_application', 'system'],
    default: 'system'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  relatedJob: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  relatedApplication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    default: null
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
