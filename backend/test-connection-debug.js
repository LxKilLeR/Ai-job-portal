const mongoose = require('mongoose');

// Using the exact URI from your .env after encoding
const uri = 'mongodb+srv://rajyadav001015_db_user:%3CB9uB%40.MpZ%40Qfrr3%3E@hireai.pq8q9dd.mongodb.net/?appName=HireAi';

console.log('Testing MongoDB connection...');
console.log('URI:', uri);

mongoose.set('debug', true);

mongoose.connect(uri)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully!');
    console.log('Connection state:', mongoose.connection.readyState);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    if (err.code) console.error('Error code:', err.code);
    process.exit(1);
  });
