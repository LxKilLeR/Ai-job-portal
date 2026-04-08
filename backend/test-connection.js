require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('❌ MONGO_URI is not defined in your .env file!');
  process.exit(1);
}

console.log('Testing MongoDB connection...');
console.log('URI:', uri.replace(/:([^@]+)@/, ':***@')); // Mask password

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
    process.exit(1);
  });
