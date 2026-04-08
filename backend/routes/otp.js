const express = require('express');
const router = express.Router();
const OTP = require('../models/OTP');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/otp/request - Send OTP for signup
router.post('/request', async (req, res, next) => {
  try {
    const { email, role, company, name, password } = req.body;

    if (!email || !role || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, role, name, and password are required'
      });
    }

    // If role is Employer, company is required
    if (role === 'Employer' && !company) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required for recruiters'
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

    // Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP along with signup data to database
    const otpRecord = await OTP.findOneAndUpdate(
      { email, type: 'signup' },
      {
        email,
        otp,
        type: 'signup',
        signupData: { name, role, company, password },
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        userId: null
      },
      { upsert: true, new: true }
    );

    console.log('✅ OTP saved:', { email, otp, signupData: otpRecord.signupData });

    // Send OTP via email
    const roleDisplay = role === 'Employer' ? 'Recruiter' : 'Job Seeker';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0e1a; color: #fff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f6ef7; font-size: 28px; margin: 0;">HireAI 🔐</h1>
          <p style="color: #9ca3af; margin-top: 10px;">Verify your email address</p>
        </div>

        <div style="background: #1a2332; border-radius: 12px; padding: 30px; margin-bottom: 20px; border: 1px solid #2a3354;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hello ${name}!</p>
          <p style="color: #d1d5db; line-height: 1.6;">You're signing up as a <strong>${roleDisplay}</strong> on HireAI. Use the code below to verify your email:</p>

          <div style="background: #0f1629; border: 2px dashed #4f6ef7; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4f6ef7;">${otp}</div>
            <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">Valid for 10 minutes</p>
          </div>

          <p style="color: #9ca3af; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>

        <div style="text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #1a2332; padding-top: 20px;">
          <p>© 2026 HireAI. All rights reserved.</p>
        </div>
      </div>
    `;

    const emailText = `
      HireAI - Email Verification

      Hello ${name}!

      You're signing up as a ${roleDisplay} on HireAI.

      Your verification code is: ${otp}

      This code is valid for 10 minutes.

      If you didn't request this, please ignore this email.

      © 2026 HireAI
    `;

    try {
      await sendEmail({
        to: email,
        subject: 'HireAI - Verify Your Email',
        html: emailHtml,
        text: emailText
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue anyway - don't block signup if email fails
    }

    res.json({
      success: true,
      message: 'OTP sent to your email',
      // Show OTP in dev mode only
      dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

// POST /api/otp/verify - Verify OTP and create account
router.post('/verify', async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find OTP record
    console.log('🔍 Verifying OTP:', { email, otp });

    const otpRecord = await OTP.findOne({
      email,
      otp,
      type: 'signup',
      expiresAt: { $gt: new Date() } // Not expired
    });

    console.log('📋 OTP Record found:', otpRecord ? { email: otpRecord.email, signupData: otpRecord.signupData } : null);

    if (!otpRecord || !otpRecord.signupData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Check if user already exists (double check)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Get signup data from OTP record
    const { name, role, company, password } = otpRecord.signupData;

    // Create user
    const validRoles = ['Seeker', 'Employer'];
    const userRole = validRoles.includes(role) ? role : 'Seeker';

    const user = await User.create({
      email,
      password,
      name,
      role: userRole,
      ...(role === 'Employer' && { company }) // Add company if recruiter
    });

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

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
    console.error('OTP verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message
    });
  }
});

// POST /api/otp/resend - Resend OTP
router.post('/resend', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
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

    // Find existing OTP record to get signup data
    const existingOTP = await OTP.findOne({ email, type: 'signup' });
    if (!existingOTP || !existingOTP.signupData) {
      return res.status(400).json({
        success: false,
        message: 'No signup request found. Please start signup again.'
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.findOneAndUpdate(
      { email, type: 'signup' },
      {
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      { new: true }
    );

    // Send email
    const { name, role, company } = existingOTP.signupData;
    const roleDisplay = role === 'Employer' ? 'Recruiter' : 'Job Seeker';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0e1a; color: #fff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f6ef7; font-size: 28px; margin: 0;">HireAI 🔐</h1>
          <p style="color: #9ca3af; margin-top: 10px;">Verify your email address</p>
        </div>

        <div style="background: #1a2332; border-radius: 12px; padding: 30px; margin-bottom: 20px; border: 1px solid #2a3354;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hello ${name}!</p>
          <p style="color: #d1d5db; line-height: 1.6;">You requested a new code to verify your ${roleDisplay} account. Use the code below:</p>

          <div style="background: #0f1629; border: 2px dashed #4f6ef7; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4f6ef7;">${otp}</div>
            <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">Valid for 10 minutes</p>
          </div>

          <p style="color: #9ca3af; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>

        <div style="text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #1a2332; padding-top: 20px;">
          <p>© 2026 HireAI. All rights reserved.</p>
        </div>
      </div>
    `;

    const emailText = `
      HireAI - Email Verification (Resend)

      Hello ${name}!

      You requested a new verification code for your ${roleDisplay} account.

      Your new code is: ${otp}

      This code is valid for 10 minutes.

      If you didn't request this, please ignore this email.

      © 2026 HireAI
    `;

    try {
      await sendEmail({
        to: email,
        subject: 'HireAI - Your Verification Code',
        html: emailHtml,
        text: emailText
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.json({
      success: true,
      message: 'OTP resent to your email',
      dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (error) {
    console.error('OTP resend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
      error: error.message
    });
  }
});

module.exports = router;
