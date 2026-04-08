const mongoose = require('mongoose');
require('dotenv').config();

const Job = require('./models/Job');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in .env file!');
  process.exit(1);
}

async function cleanDatabase() {
  try {
    console.log('🧹 Starting database cleanup...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Count before deletion
    const jobCount = await Job.countDocuments();
    const userCount = await User.countDocuments();

    console.log(`📊 Current data: ${jobCount} jobs, ${userCount} users`);

    // Delete all jobs (demo posts)
    const deleteResult = await Job.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} jobs`);

    // Optional: Delete test user only (keep real users)
    // const testUserCount = await User.deleteMany({ email: 'test@example.com' });
    // console.log(`🗑️  Deleted ${testUserCount.deletedCount} test users`);

    // Or delete ALL users (careful!)
    // const allUsersCount = await User.deleteMany({});
    // console.log(`🗑️  Deleted ${allUsersCount.deletedCount} users`);

    console.log('\n✨ Database cleaned successfully!');
    console.log('Note: Only demo jobs were deleted. Real user accounts are preserved.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanDatabase();
