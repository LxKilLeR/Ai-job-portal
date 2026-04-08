const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP
const createTransporter = () => {
  // Check if we have SMTP configuration
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    // Production SMTP configuration
    return nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort) || 587,
      secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  }

  // Development: Use ethereal.email test account (auto-generated)
  // Or fallback to console.log if no config
  return null;
};

const sendEmail = async (options) => {
  const { to, subject, html, text } = options;

  // Get transporter
  const transporter = createTransporter();

  // If no transporter (dev mode without SMTP), log to console
  if (!transporter) {
    console.log('\n========================================');
    console.log('📧 EMAIL (Development Mode - Console Only)');
    console.log('========================================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html || text}`);
    console.log('========================================\n');

    // In dev mode, we can also use ethereal to generate a test email URL
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      try {
        // Create a test account on ethereal.email
        const testAccount = await nodemailer.createTestAccount();
        const devTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });

        const info = await devTransporter.sendMail({
          from: '"HireAI" <noreply@hireai.com>',
          to,
          subject,
          html,
          text
        });

        console.log(`\n✅ Test email sent via ethereal.email`);
        console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        console.log('');
      } catch (err) {
        console.log('Note: Could not create ethereal test account. Email logged to console only.');
      }
    }

    return { success: true, message: 'Email logged to console' };
  }

  // Production: Actually send email
  try {
    const info = await transporter.sendMail({
      from: `"HireAI" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text
    });

    console.log(`✅ Email sent to ${to}: ${subject}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};

module.exports = sendEmail;
