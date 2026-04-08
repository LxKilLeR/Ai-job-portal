const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');

// POST upload resume (with extracted data)
router.post('/upload', async (req, res) => {
  try {
    const { userId, fileName, fileUrl, extractedSkills, extractedExperience, extractedEducation, parsedData } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const resume = await Resume.create({
      userId,
      fileName: fileName || 'resume.pdf',
      fileUrl: fileUrl || '',
      extractedSkills: extractedSkills || [],
      extractedExperience: extractedExperience || '',
      extractedEducation: extractedEducation || '',
      parsedData: parsedData || {}
    });

    res.json({
      success: true,
      data: resume
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload resume',
      error: error.message
    });
  }
});

// GET user's resume
router.get('/user/:userId', async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.params.userId }).sort({ createdAt: -1 });

    if (!resume) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: resume
    });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume',
      error: error.message
    });
  }
});

module.exports = router;
