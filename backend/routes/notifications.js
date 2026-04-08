const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/notifications - Get notifications for logged-in user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .populate('relatedJob', 'title company'),
      Notification.countDocuments({ recipient: userId, isRead: false })
    ]);

    res.json({
      success: true,
      data: notifications,
      meta: {
        unreadCount,
        total: notifications.length
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

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.updateMany({ recipient: userId, isRead: false }, { $set: { isRead: true } });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Read all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message
    });
  }
});

module.exports = router;
