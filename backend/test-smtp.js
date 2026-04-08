require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing SMTP with:');
console.log('User:', process.env.SMTP_USER);
console.log('Pass length:', process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP FAILED:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  } else {
    console.log('SMTP CONNECTED!');
    transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: 'HireAI Test OTP: 123456',
      html: '<h2>Your OTP is: <strong style="color:#4F6EF7">123456</strong></h2>'
    }, function(err, info) {
      if (err) {
        console.error('SEND FAILED:', err.message);
      } else {
        console.log('EMAIL SENT! ID:', info.messageId);
      }
      process.exit(0);
    });
  }
});
