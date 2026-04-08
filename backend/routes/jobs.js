const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const authMiddleware = require('../middleware/auth');

// GET all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
});

// GET single job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job',
      error: error.message
    });
  }
});

// POST apply to a job (seeker only)
router.post('/:id/apply', authMiddleware, async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;

    if (req.user.role !== 'Seeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can apply to jobs'
      });
    }

    const job = await Job.findOne({ _id: jobId, isActive: true });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or inactive'
      });
    }

    if (job.postedBy.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot apply to your own job posting'
      });
    }

    const existingApplication = await Application.findOne({ job: jobId, applicant: userId });
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    const application = await Application.create({
      job: jobId,
      applicant: userId,
      resume: req.body.resume || null,
      // Placeholder scoring until AI matching is integrated.
      matchScore: Math.floor(Math.random() * 41) + 60
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    console.error('Apply job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
});

// POST create job (admin/employer only - for now open)
router.post('/', async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job',
      error: error.message
    });
  }
});

module.exports = router;
