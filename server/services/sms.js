const debug = require('debug')('habit-tracker:sms');

const sendSms = async (to, message) => {
  // Placeholder for SMS service integration (e.g., Twilio, AWS SNS)
  // Since we don't have API keys, we'll just log it.
  
  debug(`[MOCK SMS] To: ${to}, Message: ${message}`);
  console.log(`[MOCK SMS] Sending SMS to ${to}: ${message}`);
  
  // Example Twilio implementation would look like:
  /*
  const client = require('twilio')(accountSid, authToken);
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: to
  });
  */
  
  return Promise.resolve({ success: true, mock: true });
};

module.exports = { sendSms };
