const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
const Job = require('../models/Job');
const User = require('../models/User');

const toTokens = (value) =>
  String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);

const uniqueTokens = (values) => [...new Set(values.flatMap(toTokens))];

// GET job recommendations for a user based on their resume skills
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    // Get all active jobs posted by recruiters
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });

    if (!jobs.length) {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Resume/profile are optional; if available, we rank by title intent first then skills.
    let userSkills = [];
    let titleIntentTokens = [];

    if (userId) {
      const user = await User.findById(userId).select('profession searchingFor skills');
      const resume = await Resume.findOne({ userId }).sort({ createdAt: -1 });

      const profileSkills = Array.isArray(user?.skills) ? user.skills : [];
      const resumeSkills = Array.isArray(resume?.extractedSkills) ? resume.extractedSkills : [];
      userSkills = [...new Set([...profileSkills, ...resumeSkills].map((skill) => String(skill || '').trim()).filter(Boolean))];

      titleIntentTokens = uniqueTokens([
        user?.profession,
        user?.searchingFor,
        ...userSkills
      ]);

      if (resume?.extractedSkills?.length) {
        userSkills = [...new Set([...userSkills, ...resume.extractedSkills].map((skill) => String(skill || '').trim()).filter(Boolean))];
      }
    }

    // Calculate match using title-first strategy, then refine with skills.
    const recommendations = jobs.map(job => {
      const jobSkills = job.skills || [];

      const normalizedJobSkills = jobSkills.map((skill) => String(skill || '').toLowerCase().trim());
      const normalizedUserSkills = userSkills.map((skill) => String(skill || '').toLowerCase().trim());
      const jobTitleTokens = uniqueTokens([job.title, job.type, job.industry]);

      const matchedTitleTokens = titleIntentTokens.filter((token) =>
        jobTitleTokens.some((jobToken) => jobToken.includes(token) || token.includes(jobToken))
      );

      const titleScore = titleIntentTokens.length
        ? Math.round((matchedTitleTokens.length / titleIntentTokens.length) * 100)
        : 0;

      // Find matching skills
      const matchingSkills = jobSkills.filter((skill, index) =>
        normalizedUserSkills.some(userSkill =>
          userSkill.includes(normalizedJobSkills[index]) ||
          normalizedJobSkills[index].includes(userSkill)
        )
      );

      const skillScore = normalizedJobSkills.length
        ? Math.round((matchingSkills.length / normalizedJobSkills.length) * 100)
        : 0;

      // Primary weight on title/role intent, then skills.
      const weightedScore = titleIntentTokens.length
        ? Math.round((titleScore * 0.6) + (skillScore * 0.4))
        : skillScore;

      const matchScore = Math.max(0, Math.min(weightedScore, 100));

      let reason = '';
      if (titleScore > 0 && matchScore >= 80) {
        reason = 'Strong title + skill alignment for your target role.';
      } else if (titleScore > 0 && matchScore >= 50) {
        reason = `Role intent matches and ${matchingSkills.length}/${jobSkills.length || 0} skills align.`;
      } else if (titleScore > 0) {
        reason = `Role intent matches, but skill overlap is limited (${matchingSkills.length}/${jobSkills.length || 0}).`;
      } else if (skillScore > 0) {
        reason = `No strong title match, but ${matchingSkills.length}/${jobSkills.length || 0} skills are relevant.`;
      } else if (matchScore >= 50) {
        reason = 'Good match based on available profile signals.';
      } else {
        reason = 'Low relevance for your current role preference and skills.';
      }

      return {
        id: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        salary: job.salary,
        skills: job.skills,
        remote: job.remote,
        titleScore,
        skillScore,
        matchedTitleTokens,
        matchedSkillsCount: matchingSkills.length,
        totalSkillsCount: jobSkills.length,
        matchScore,
        reason
      };
    })
    .filter((rec) => {
      if (!titleIntentTokens.length && !userSkills.length) return true;
      return rec.titleScore > 0 || rec.matchedSkillsCount > 0;
    })
    .sort((a, b) => {
      // Title match priority first, then skill match and final score.
      if (b.titleScore !== a.titleScore) {
        return b.titleScore - a.titleScore;
      }
      if (b.matchedSkillsCount !== a.matchedSkillsCount) {
        return b.matchedSkillsCount - a.matchedSkillsCount;
      }
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return 0;
    })
    .slice(0, 10); // Top 10

    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: error.message
    });
  }
});

module.exports = router;
