const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const resumeRoutes = require('./routes/resume');
const recommendationRoutes = require('./routes/recommendations');
const chatRoutes = require('./routes/chat');
const recruiterRoutes = require('./routes/recruiter');
const otpRoutes = require('./routes/otp');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5001;
const isProduction = process.env.NODE_ENV === 'production';
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const defaultProductionOrigins = [
  'https://aijob-portal.netlify.app',
  'https://ai-job-portal-six.vercel.app'
];
const allowedOrigins = Array.from(new Set([
  ...configuredOrigins,
  ...(isProduction ? defaultProductionOrigins : ['http://localhost:3000'])
]));

const allowedOriginPatterns = [
  /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server and tools without Origin header.
    if (!origin) return callback(null, true);

    const isExactMatch = allowedOrigins.includes(origin);
    const isPatternMatch = allowedOriginPatterns.some((pattern) => pattern.test(origin));

    if (isExactMatch || isPatternMatch) {
      return callback(null, true);
    }

    console.warn(`CORS blocked for origin: ${origin}`);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return cors(corsOptions)(req, res, next);
  }
  return next();
});
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('AI Job Portal Backend is Running');
});

// Error Boundary
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server Error', error: err.message });
});

// Connect to MongoDB then start server
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in .env file!');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas successfully!');
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
