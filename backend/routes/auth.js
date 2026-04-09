const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Application = require('../models/Application');
const authMiddleware = require('../middleware/auth');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Signup with email/password
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and name'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user with validated role
    const validRoles = ['Seeker', 'Recruiter'];
    const userRole = validRoles.includes(role) ? role : 'Seeker';

    // Map 'Recruiter' to 'Employer' for database consistency
    const dbRole = userRole === 'Recruiter' ? 'Employer' : userRole;

    const user = await User.create({
      email,
      password, // Will be hashed by pre-save middleware
      name,
      role: dbRole
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        location: user.location,
        phone: user.phone,
        bio: user.bio,
        avatar: user.avatar,
        searchingFor: user.searchingFor,
        profession: user.profession,
        skills: user.skills,
        address: user.address,
        profileCompleted: user.profileCompleted
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during signup',
      error: error.message
    });
  }
});

// Login with email/password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        location: user.location,
        phone: user.phone,
        bio: user.bio,
        avatar: user.avatar,
        searchingFor: user.searchingFor,
        profession: user.profession,
        skills: user.skills,
        address: user.address,
        profileCompleted: user.profileCompleted,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
});

// Google OAuth
router.post('/google', async (req, res) => {
  try {
    const { token, role } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'No token provided' });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'] || email.split('@')[0];
    const avatar = payload['picture'] || null;

    const validRoles = ['Seeker', 'Employer', 'Recruiter'];
    const requestedRole = validRoles.includes(role) ? role : null;
    const dbRole = requestedRole === 'Recruiter' ? 'Employer' : requestedRole;

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      if (!dbRole) {
        return res.status(400).json({
          success: false,
          message: 'Please select Job Seeker or Recruiter before Google signup'
        });
      }

      user = await User.create({
        email,
        name,
        googleId,
        avatar,
        role: dbRole
      });
    } else {
      // Update googleId if not set
      if (!user.googleId) {
        user.googleId = googleId;
        if (avatar) user.avatar = avatar;
        await user.save();
      }
    }

    // Generate JWT
    const newToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token: newToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        location: user.location,
        phone: user.phone,
        bio: user.bio,
        avatar: user.avatar,
        searchingFor: user.searchingFor,
        profession: user.profession,
        skills: user.skills,
        address: user.address,
        profileCompleted: user.profileCompleted,
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ success: false, message: 'Invalid Google token' });
  }
});

// GET /api/auth/me - Get current authenticated user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        location: user.location,
        phone: user.phone,
        bio: user.bio,
        avatar: user.avatar,
        searchingFor: user.searchingFor,
        profession: user.profession,
        skills: user.skills,
        address: user.address,
        profileCompleted: user.profileCompleted
      }
    });
  } catch (error) {
    console.error('Get current user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// GET /api/auth/seeker-overview - Dashboard stats for seekers
router.get('/seeker-overview', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('_id role');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'Seeker') {
      return res.status(403).json({
        success: false,
        message: 'Only seekers can access this overview'
      });
    }

    const seekerApplications = await Application.find({ applicant: user._id }).select('status matchScore');

    const applicationsCount = seekerApplications.length;
    const activeApplications = seekerApplications.filter((app) => ['pending', 'shortlisted'].includes(app.status)).length;
    const acceptedApplications = seekerApplications.filter((app) => app.status === 'accepted').length;
    const avgMatchScore = applicationsCount > 0
      ? Math.round(seekerApplications.reduce((sum, app) => sum + (app.matchScore || 0), 0) / applicationsCount)
      : 0;

    res.json({
      success: true,
      data: {
        applicationsCount,
        activeApplications,
        acceptedApplications,
        savedJobsCount: 0,
        profileViews: 0,
        matchScore: avgMatchScore
      }
    });
  } catch (error) {
    console.error('Get seeker overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seeker overview',
      error: error.message
    });
  }
});

// PUT /api/auth/profile-setup - Complete first-time seeker profile
router.put('/profile-setup', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { searchingFor, profession, skills, address } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'Seeker') {
      return res.status(403).json({
        success: false,
        message: 'Only seekers can complete this profile setup'
      });
    }

    if (!searchingFor || !profession || !skills || !address) {
      return res.status(400).json({
        success: false,
        message: 'searchingFor, profession, skills and address are required'
      });
    }

    const normalizedSkills = Array.isArray(skills)
      ? skills.map((item) => String(item).trim()).filter(Boolean)
      : String(skills)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

    user.searchingFor = String(searchingFor).trim();
    user.profession = String(profession).trim();
    user.skills = normalizedSkills;
    user.address = String(address).trim();
    user.profileCompleted = true;

    await user.save();

    res.json({
      success: true,
      message: 'Profile setup completed successfully',
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        location: user.location,
        phone: user.phone,
        bio: user.bio,
        avatar: user.avatar,
        searchingFor: user.searchingFor,
        profession: user.profession,
        skills: user.skills,
        address: user.address,
        profileCompleted: user.profileCompleted
      }
    });
  } catch (error) {
    console.error('Profile setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete profile setup',
      error: error.message
    });
  }
});

module.exports = router;
