const webpush = require('web-push');
const debug = require('debug')('habit-tracker:push');

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(
    'mailto:noreply@habit-tracker.com',
    publicVapidKey,
    privateVapidKey
  );
} else {
  console.warn('VAPID keys not found. Web Push notifications will not work.');
}

const sendPushNotification = async (subscription, payload) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    debug('Push notification sent successfully');
  } catch (error) {
    debug('Error sending push notification:', error);
    throw error;
  }
};

module.exports = { sendPushNotification };
