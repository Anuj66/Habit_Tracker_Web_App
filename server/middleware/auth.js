const jwt = require('jsonwebtoken');
const db = require('../database');
const debug = require('debug')('habit-tracker:auth-middleware');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const AUTH_COOKIE_NAME = 'auth_token';

const authenticateToken = async (req, res, next) => {
  let token = req.cookies[AUTH_COOKIE_NAME];
  
  if (!token) {
    // Check Authorization header as fallback
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    debug('No token found');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await db.get('SELECT * FROM users WHERE id = ?', [payload.sub]);
    
    if (!user) {
      debug('User not found');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    debug('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = { authenticateToken };
