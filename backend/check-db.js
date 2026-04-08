const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI).then(async () => {
  console.log("Connected to MongoDB.");
  
  const Job = mongoose.model('Job', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const jobs = await Job.find({}).lean();
  console.log(`\nFound ${jobs.length} jobs:`);
  jobs.forEach(job => {
    console.log(`- Title: ${job.title}, PostedBy: ${job.postedBy}, Type: ${typeof job.postedBy}`);
  });
  
  const users = await User.find({ role: 'Recruiter' }).lean();
  console.log(`\nFound ${users.length} recruiters:`);
  users.forEach(user => {
    console.log(`- Name: ${user.name}, Email: ${user.email}, ID: ${user._id}`);
  });
  
  process.exit();
}).catch(err => {
  console.error("Connection failed:", err);
  process.exit(1);
});
