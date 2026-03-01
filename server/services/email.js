const nodemailer = require('nodemailer');
const debug = require('debug')('habit-tracker:email');

// For development, we'll use a test account if no real credentials are provided
const createTransporter = async () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback to Ethereal for testing
  debug('No SMTP config found, creating Ethereal test account...');
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  
  debug(`Ethereal test account created: ${testAccount.user}`);
  return transporter;
};

let transporterPromise = createTransporter();

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = await transporterPromise;
    const info = await transporter.sendMail({
      from: '"Habit Tracker" <noreply@habit-tracker.com>',
      to,
      subject,
      html,
    });

    debug(`Email sent: ${info.messageId}`);
    if (nodemailer.getTestMessageUrl(info)) {
      debug(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      console.log(`Email Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = { sendEmail };
