const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /api/recruiter/overview - Dashboard statistics
router.get('/overview', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all jobs posted by this recruiter
    const jobs = await Job.find({ postedBy: userId });

    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(j => j.isActive).length;
    const totalViews = jobs.reduce((sum, job) => sum + job.views, 0);

    // Get applications for recruiter's jobs
    const jobIds = jobs.map(job => job._id);
    const applications = await Application.find({ job: { $in: jobIds } })
      .populate('applicant', 'name email avatar')
      .populate('job', 'title company');

    const totalApplicants = applications.length;
    const pendingApplications = applications.filter(app => app.status === 'pending').length;
    const shortlistedApplications = applications.filter(app => app.status === 'shortlisted').length;
    const acceptedApplications = applications.filter(app => app.status === 'accepted').length;
    const activeCandidates = pendingApplications + shortlistedApplications;
    const placementRate = totalApplicants > 0
      ? Math.round((acceptedApplications / totalApplicants) * 100)
      : 0;

    // Calculate match statistics
    const avgMatchScore = applications.length > 0
      ? Math.round(applications.reduce((sum, app) => sum + (app.matchScore || 0), 0) / applications.length)
      : 0;

    res.json({
      success: true,
      data: {
        totalJobs,
        activeJobs,
        totalViews,
        totalApplicants,
        activeCandidates,
        acceptedApplications,
        placementRate,
        pendingApplications,
        avgMatchScore,
        recentApplications: applications.slice(0, 5).map(app => ({
          id: app._id,
          applicant: app.applicant,
          job: app.job,
          status: app.status,
          matchScore: app.matchScore,
          appliedAt: app.appliedAt
        }))
      }
    });
  } catch (error) {
    console.error('Recruiter overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// GET /api/recruiter/jobs - Get all jobs posted by recruiter
router.get('/jobs', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { postedBy: new mongoose.Types.ObjectId(userId) };

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    // Get jobs with application counts using aggregation
    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);

    const [jobs, total] = await Promise.all([
      Job.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'applications',
            localField: '_id',
            foreignField: 'job',
            as: 'applications'
          }
        },
        {
          $addFields: {
            applicationsCount: { $size: '$applications' }
          }
        },
        { $project: { applications: 0 } }, // Remove the full applications array
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum }
      ]),
      Job.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get recruiter jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
});

// POST /api/recruiter/jobs - Create new job posting
router.post('/jobs', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const jobData = {
      ...req.body,
      postedBy: userId
    };

    const job = await Job.create(jobData);

    // Return job with applicationsCount (will be 0 for new job)
    res.status(201).json({
      success: true,
      data: {
        ...job.toObject(),
        applicationsCount: 0,
        status: job.isActive ? 'Active' : 'Paused'
      }
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

// GET /api/recruiter/jobs/:id - Get specific job
router.get('/jobs/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const job = await Job.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id), postedBy: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'job',
          as: 'applications'
        }
      },
      {
        $addFields: {
          applicationsCount: { $size: '$applications' }
        }
      },
      { $project: { applications: 0 } }
    ]);

    if (!job || job.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or unauthorized'
      });
    }

    res.json({
      success: true,
      data: job[0]
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

// PUT /api/recruiter/jobs/:id - Update job
router.put('/jobs/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const job = await Job.findOneAndUpdate(
      { _id: id, postedBy: userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or unauthorized'
      });
    }

    // Get applications count
    const applicationsCount = await Application.countDocuments({ job: id });

    res.json({
      success: true,
      data: {
        ...job.toObject(),
        applicationsCount,
        status: job.isActive ? 'Active' : 'Paused'
      }
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job',
      error: error.message
    });
  }
});

// DELETE /api/recruiter/jobs/:id - Delete job
router.delete('/jobs/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const job = await Job.findOneAndDelete({
      _id: id,
      postedBy: userId
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or unauthorized'
      });
    }

    // Also delete all applications for this job
    await Application.deleteMany({ job: id });

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message
    });
  }
});

// PATCH /api/recruiter/jobs/:id/toggle - Toggle job active status
router.patch('/jobs/:id/toggle', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const job = await Job.findOne({ _id: id, postedBy: userId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or unauthorized'
      });
    }

    job.isActive = !job.isActive;
    await job.save();

    // Get applications count
    const applicationsCount = await Application.countDocuments({ job: id });

    res.json({
      success: true,
      data: {
        ...job.toObject(),
        applicationsCount,
        status: job.isActive ? 'Active' : 'Paused'
      }
    });
  } catch (error) {
    console.error('Toggle job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle job status',
      error: error.message
    });
  }
});

// GET /api/recruiter/applications - Get all applications for recruiter's jobs
router.get('/applications', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status, jobId, minScore, search } = req.query;

    // Get all jobs by this recruiter
    const recruiterJobs = await Job.find({ postedBy: userId }).select('_id');
    const jobIds = recruiterJobs.map(job => job._id);

    const query = { job: { $in: jobIds } };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (jobId && jobId !== 'all') {
      query.job = jobId;
    }

    if (minScore) {
      query.matchScore = { $gte: parseInt(minScore) };
    }

    if (search) {
      query.$or = [
        { 'applicant.name': { $regex: search, $options: 'i' } },
        { 'applicant.email': { $regex: search, $options: 'i' } }
      ];
    }

    const applications = await Application.find(query)
      .populate('applicant', 'name email avatar skills experience createdAt')
      .populate('job', 'title company location type')
      .sort({ appliedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    res.json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
});

// GET /api/recruiter/applications/:id - Get specific application details
router.get('/applications/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // First get the application and verify it belongs to recruiter's job
    const application = await Application.findById(id)
      .populate('applicant', 'name email avatar skills experience bio createdAt')
      .populate('job', 'title company location type description requirements');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if recruiter owns this job
    if (application.job.postedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized - you do not own this job posting'
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message
    });
  }
});

// PUT /api/recruiter/applications/:id/status - Update application status
router.put('/applications/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['pending', 'shortlisted', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use: pending, shortlisted, accepted, rejected'
      });
    }

    const application = await Application.findById(id)
      .populate('job', 'title postedBy')
      .populate('applicant', 'name');

    if (!application || !application.job || application.job.postedBy.toString() !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or unauthorized'
      });
    }

    const previousStatus = application.status;

    application.status = status;
    application.updatedAt = Date.now();
    await application.save();

    // Send seeker notification on status transitions triggered by recruiter.
    if (application.applicant?._id && previousStatus !== status && status !== 'pending') {
      const statusTitleMap = {
        accepted: 'Application accepted',
        shortlisted: 'Application shortlisted',
        rejected: 'Application update'
      };

      const statusMessageMap = {
        accepted: `Great news! You have been accepted for ${application.job.title}.`,
        shortlisted: `You have been shortlisted for ${application.job.title}.`,
        rejected: `Your application for ${application.job.title} was not selected this time.`
      };

      await Notification.create({
        recipient: application.applicant._id,
        sender: userId,
        type: 'application_status',
        title: statusTitleMap[status] || 'Application update',
        message: statusMessageMap[status] || `Your application status for ${application.job.title} changed to ${status}.`,
        relatedJob: application.job._id,
        relatedApplication: application._id,
        isRead: false
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message
    });
  }
});

// POST /api/recruiter/applications/:id/reject-quick - Quick reject with optional note
router.post('/applications/:id/reject-quick', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    const application = await Application.findOne({
      _id: id,
      'job.postedBy': userId
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or unauthorized'
      });
    }

    application.status = 'rejected';
    if (notes) application.notes = notes;
    application.updatedAt = Date.now();
    await application.save();

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Quick reject error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject application',
      error: error.message
    });
  }
});

// GET /api/recruiter/analytics - Analytics data
router.get('/analytics', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const jobs = await Job.find({ postedBy: userId });

    const jobIds = jobs.map(job => job._id);

    // Applications over time
    const applications = await Application.find({
      job: { $in: jobIds },
      appliedAt: { $gte: startDate }
    }).populate('job', 'title');

    const applicationsByDate = {};
    applications.forEach(app => {
      const date = new Date(app.appliedAt).toISOString().split('T')[0];
      applicationsByDate[date] = (applicationsByDate[date] || 0) + 1;
    });

    // Job-wise application distribution
    const jobStats = {};
    jobIds.forEach(jobId => {
      const jobApps = applications.filter(app => app.job._id.toString() === jobId.toString());
      jobStats[jobId] = {
        title: jobStats[jobId]?.title || jobs.find(j => j._id.toString() === jobId.toString())?.title,
        count: jobApps.length
      };
    });

    // Status distribution
    const statusCounts = {
      pending: applications.filter(a => a.status === 'pending').length,
      shortlisted: applications.filter(a => a.status === 'shortlisted').length,
      accepted: applications.filter(a => a.status === 'accepted').length,
      rejected: applications.filter(a => a.status === 'rejected').length
    };

    // Match score distribution
    const matchRanges = {
      '0-30': 0,
      '31-50': 0,
      '51-70': 0,
      '71-85': 0,
      '86-100': 0
    };

    applications.forEach(app => {
      const score = app.matchScore || 0;
      if (score <= 30) matchRanges['0-30']++;
      else if (score <= 50) matchRanges['31-50']++;
      else if (score <= 70) matchRanges['51-70']++;
      else if (score <= 85) matchRanges['71-85']++;
      else matchRanges['86-100']++;
    });

    // Success rate
    const totalApps = applications.length;
    const successRate = totalApps > 0
      ? Math.round(((statusCounts.accepted + statusCounts.shortlisted) / totalApps) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        totalApplications: totalApps,
        successRate,
        applicationsByDate,
        jobStats: Object.values(jobStats).sort((a, b) => b.count - a.count).slice(0, 5),
        statusCounts,
        matchDistribution: matchRanges
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

// GET /api/recruiter/profile - Get recruiter profile
router.get('/profile', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');

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
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        location: user.location,
        phone: user.phone,
        bio: user.bio,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// PUT /api/recruiter/profile - Update recruiter profile
router.put('/profile', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, email, company, location, phone, bio } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another account'
        });
      }
    }

    // Update user
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (company !== undefined) updateData.company = company;
    if (location !== undefined) updateData.location = location;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

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
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        location: user.location,
        phone: user.phone,
        bio: user.bio,
        avatar: user.avatar
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// GET /api/recruiter/notifications - Recruiter notifications from recent job applications
router.get('/notifications', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    const recruiterJobs = await Job.find({ postedBy: userId }).select('_id title');
    const jobIds = recruiterJobs.map(job => job._id);

    if (jobIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        meta: {
          unreadCount: 0,
          total: 0
        }
      });
    }

    const [recentApplications, totalApplications] = await Promise.all([
      Application.find({ job: { $in: jobIds } })
        .populate('applicant', 'name email avatar')
        .populate('job', 'title')
        .sort({ createdAt: -1 })
        .limit(parsedLimit),
      Application.countDocuments({ job: { $in: jobIds } })
    ]);

    const notifications = recentApplications.map((application) => {
      const applicantName = application.applicant?.name || 'A job seeker';
      const jobTitle = application.job?.title || 'your job';

      return {
        id: application._id,
        type: 'new_application',
        title: `New application for ${jobTitle}`,
        message: `${applicantName} applied${typeof application.matchScore === 'number' ? ` (${application.matchScore}% match)` : ''}`,
        applicationId: application._id,
        jobId: application.job?._id || null,
        candidate: application.applicant
          ? {
              id: application.applicant._id,
              name: application.applicant.name,
              email: application.applicant.email,
              avatar: application.applicant.avatar
            }
          : null,
        createdAt: application.createdAt || application.appliedAt,
        isRead: false
      };
    });

    res.json({
      success: true,
      data: notifications,
      meta: {
        unreadCount: notifications.length,
        total: totalApplications
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

module.exports = router;
