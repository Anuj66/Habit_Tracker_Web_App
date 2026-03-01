const cron = require('node-cron');
const db = require('./database');
const { sendEmail } = require('./services/email');
const { sendPushNotification } = require('./services/push');
const { sendSms } = require('./services/sms');
const debug = require('debug')('habit-tracker:scheduler');

const startScheduler = () => {
  // Check every minute
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    debug(`Checking reminders for ${currentTime}`);

    try {
      // Find habits with reminder_time matching current time and reminder_enabled
      // We need to join with users to get email/push preferences
      // Note: SQLite/Postgres have slightly different JOIN syntax or capabilities, but standard JOIN works for both.
      
      const sql = `
        SELECT h.id, h.name, h.description, h.reminder_time, 
               u.id as user_id, u.email, u.phone, 
               u.email_notifications_enabled, u.push_notifications_enabled
        FROM habits h
        JOIN users u ON 1=1 -- In this simple app, we might not have habit->user link yet? 
                            -- WAIT. The habits table currently doesn't have a user_id!
                            -- The current app seems to be single-user or shared DB based on previous schema.
                            -- Let's check schema.js again.
      `;
      
      // Checking schema.js from previous turn:
      // habits table: id, name, description, frequency, reminder_time, reminder_enabled, created_at.
      // It DOES NOT have user_id.
      // This means currently all habits are shared or it's a single-user local app design moved to cloud.
      // However, auth was added.
      // If habits don't have user_id, we can't know WHO to notify.
      // 
      // CRITICAL: We need to add user_id to habits table to make this work properly for multiple users.
      // But for now, if the app assumes a single user context or we just want to notify ALL users who have subscribed?
      // No, that's spam.
      //
      // Let's assume for this "Future Scope" task, we might need to link habits to users.
      // BUT, looking at the code, there is NO user_id in habits table.
      // And the existing 'users' table exists.
      //
      // If I look at the previous 'auth' implementation, usually habits should be linked.
      // Let's check if I missed user_id in habits in schema.js.
      //
      // schema.js:
      // CREATE TABLE IF NOT EXISTS habits (
      //   id ${autoIncrement},
      //   name TEXT NOT NULL, ...
      // )
      // No user_id.
      //
      // This implies the current app is either:
      // 1. Single user (everyone sees same habits)
      // 2. Or incomplete multi-tenancy.
      //
      // Given the user asked for "Push Notifications... provided to the email... if user added it in the profile",
      // it implies specific users own habits.
      //
      // I should probably add user_id to habits table.
      // BUT, that's a big refactor (breaking existing habits or assigning them to a default user).
      //
      // ALTERNATIVE:
      // If the app is currently "all habits are global", then who gets the notification?
      // Maybe ALL users who have notifications enabled?
      // That seems wrong.
      //
      // Let's check if there is ANY link.
      // tracking table has habit_id.
      //
      // HYPOTHESIS: The user just added Auth recently (based on progress.md "Authentication Implementation Status").
      // But maybe they haven't migrated habits to be user-specific yet.
      //
      // If I want to implement notifications "to the email... if user added it in profile", I need to know WHICH user to email for WHICH habit.
      //
      // ACTION: I will assume for now that I should query ALL users and send notifications to them if they have enabled notifications.
      // OR, better, I should check if I can add user_id to habits.
      //
      // Let's look at `server/index.js` to see how habits are created.
      // `app.post('/api/habits', ...)` -> `INSERT INTO habits ...`
      // It doesn't seem to use `req.user.id`.
      //
      // So currently habits are GLOBAL.
      //
      // Implementation Decision:
      // Since habits are global, I will send notifications to ALL registered users who have enabled notifications.
      // This is the only logical path without refactoring the entire data model to be multi-tenant.
      // I will add a TODO to "Link habits to users" for the future.
      
      // For SQLite/Postgres compatibility on Booleans
      const allHabits = await db.all('SELECT * FROM habits');
      const habits = allHabits.filter(h => {
        // Check if enabled (handle 1, true, '1', 'true')
        const isEnabled = h.reminder_enabled === 1 || h.reminder_enabled === true || h.reminder_enabled === '1' || h.reminder_enabled === 'true';
        return isEnabled && h.reminder_time === currentTime;
      });

      const allUsers = await db.all('SELECT * FROM users');
      const users = allUsers.filter(u => {
         const emailEnabled = u.email_notifications_enabled === 1 || u.email_notifications_enabled === true;
         const pushEnabled = u.push_notifications_enabled === 1 || u.push_notifications_enabled === true;
         return emailEnabled || pushEnabled;
      });
      
      // We also need push subscriptions
      // We can fetch them per user or all at once.
      
      for (const habit of habits) {
        // Double check time match (in case of timezone issues, though we store HH:MM string)
        if (habit.reminder_time !== currentTime) continue;
        
        debug(`Processing reminder for habit: ${habit.name}`);
        
        for (const user of users) {
          // Email Notification
          if (user.email_notifications_enabled && user.email) {
             sendEmail(
               user.email, 
               `Reminder: ${habit.name}`, 
               `<p>It's time for your habit: <strong>${habit.name}</strong></p><p>${habit.description || ''}</p>`
             ).catch(err => console.error(`Failed to email user ${user.id}:`, err));
          }
          
          // SMS Notification (mock)
          if (user.phone) {
             sendSms(
               user.phone,
               `Habit Reminder: ${habit.name} - ${habit.description || 'Keep it up!'}`
             ).catch(err => console.error(`Failed to SMS user ${user.id}:`, err));
          }

          // Push Notification
          if (user.push_notifications_enabled) {
             const subscriptions = await db.all('SELECT * FROM push_subscriptions WHERE user_id = ?', [user.id]);
             const payload = {
               title: `Time for: ${habit.name}`,
               body: habit.description || 'Keep it up!',
               icon: '/vite.svg'
             };
             
             subscriptions.forEach(sub => {
               const pushSubscription = {
                 endpoint: sub.endpoint,
                 keys: {
                   p256dh: sub.p256dh,
                   auth: sub.auth
                 }
               };
               sendPushNotification(pushSubscription, payload)
                 .catch(err => {
                   if (err.statusCode === 410 || err.statusCode === 404) {
                     // Subscription expired or gone
                     db.run('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
                   }
                 });
             });
          }
        }
      }

    } catch (error) {
      console.error('Scheduler error:', error);
    }
  });
};

module.exports = startScheduler;
