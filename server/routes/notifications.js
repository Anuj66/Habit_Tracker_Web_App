const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();
const debug = require('debug')('habit-tracker:routes:notifications');

// Get notification preferences
router.get('/preferences', authenticateToken, async (req, res, next) => {
  try {
    const user = await db.get('SELECT email_notifications_enabled, push_notifications_enabled, phone FROM users WHERE id = ?', [req.user.id]);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Update notification preferences
router.put('/preferences', authenticateToken, async (req, res, next) => {
  const { email_notifications_enabled, push_notifications_enabled, phone } = req.body;
  try {
    await db.run(
      'UPDATE users SET email_notifications_enabled = ?, push_notifications_enabled = ?, phone = ? WHERE id = ?',
      [email_notifications_enabled, push_notifications_enabled, phone, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Subscribe to push notifications
router.post('/subscribe', authenticateToken, async (req, res, next) => {
  const subscription = req.body;
  try {
    // Check if subscription already exists
    const existing = await db.get(
      'SELECT id FROM push_subscriptions WHERE user_id = ? AND endpoint = ?', 
      [req.user.id, subscription.endpoint]
    );
    
    if (!existing) {
      await db.run(
        'INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, new Date().toISOString()]
      );
    }
    
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Unsubscribe from push notifications (optional, client can just stop listening but good for cleanup)
router.post('/unsubscribe', authenticateToken, async (req, res, next) => {
  const { endpoint } = req.body;
  try {
    await db.run('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?', [req.user.id, endpoint]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Get VAPID Public Key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

module.exports = router;
