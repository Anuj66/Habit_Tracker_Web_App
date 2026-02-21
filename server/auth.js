const express = require('express');
const csrf = require('csurf');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./database');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const CSRF_COOKIE_NAME = 'csrf_secret';
const AUTH_COOKIE_NAME = 'auth_token';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URI =
  process.env.GITHUB_REDIRECT_URI || 'http://localhost:5000/api/auth/github/callback';

const csrfProtection = csrf({
  cookie: {
    key: CSRF_COOKIE_NAME,
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
});

function signToken(user) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be set');
  }
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME);
}

function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function createUser({ email, passwordHash, name, emailVerified }) {
  const stmt =
    'INSERT INTO users (email, password_hash, name, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)';
  const info = db.prepare(stmt).run(email, passwordHash || null, name || null, emailVerified ? 1 : 0);
  return getUserById(info.lastInsertRowid);
}

function updateUserLoginSuccess(userId) {
  db.prepare(
    'UPDATE users SET failed_login_attempts = 0, lockout_until = NULL, last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
  ).run(userId);
}

function recordFailedLogin(user) {
  const maxAttempts = 5;
  const lockoutMinutes = 15;
  const attempts = (user.failed_login_attempts || 0) + 1;

  if (attempts >= maxAttempts) {
    const lockoutUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000).toISOString();
    db.prepare(
      'UPDATE users SET failed_login_attempts = ?, lockout_until = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    ).run(attempts, lockoutUntil, user.id);
    return { locked: true, lockoutUntil };
  }

  db.prepare(
    'UPDATE users SET failed_login_attempts = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
  ).run(attempts, user.id);
  return { locked: false };
}

function isUserLocked(user) {
  if (!user.lockout_until) {
    return false;
  }
  const now = new Date();
  const lockoutUntil = new Date(user.lockout_until);
  return lockoutUntil > now;
}

function createVerificationToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = bcrypt.hashSync(token, 10);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    'INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
  ).run(userId, tokenHash, expiresAt);
  return token;
}

function createPasswordResetToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = bcrypt.hashSync(token, 10);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  db.prepare(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
  ).run(userId, tokenHash, expiresAt);
  return token;
}

function findValidVerificationToken(token) {
  const candidates = db
    .prepare(
      'SELECT * FROM email_verification_tokens WHERE used = 0 AND datetime(expires_at) > datetime("now")',
    )
    .all();
  for (const candidate of candidates) {
    if (bcrypt.compareSync(token, candidate.token_hash)) {
      return candidate;
    }
  }
  return null;
}

function findValidPasswordResetToken(token) {
  const candidates = db
    .prepare(
      'SELECT * FROM password_reset_tokens WHERE used = 0 AND datetime(expires_at) > datetime("now")',
    )
    .all();
  for (const candidate of candidates) {
    if (bcrypt.compareSync(token, candidate.token_hash)) {
      return candidate;
    }
  }
  return null;
}

function validateEmail(email) {
  if (typeof email !== 'string') {
    return false;
  }
  const trimmed = email.trim();
  if (!trimmed) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function validatePassword(password) {
  if (typeof password !== 'string') {
    return false;
  }
  return password.length >= 8;
}

function sanitizeName(name) {
  if (typeof name !== 'string') {
    return null;
  }
  return name.trim().slice(0, 100);
}

function ensureJwtSecret(req, res) {
  if (!JWT_SECRET) {
    res.status(500).json({ error: 'Server configuration error' });
    return false;
  }
  return true;
}

function authMiddleware(req, res, next) {
  if (!ensureJwtSecret(req, res)) {
    return;
  }
  const token = req.cookies[AUTH_COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = getUserById(payload.sub);
    if (!user) {
      clearAuthCookie(res);
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    req.user = user;
    next();
  } catch (e) {
    clearAuthCookie(res);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

router.get('/csrf', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

router.post('/register', csrfProtection, async (req, res) => {
  const { email, password, name } = req.body;

  if (!validateEmail(email) || !validatePassword(password)) {
    res.status(400).json({ error: 'Invalid email or password' });
    return;
  }

  const existing = getUserByEmail(email.trim().toLowerCase());
  if (existing) {
    res.status(409).json({ error: 'Email already in use' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser({
    email: email.trim().toLowerCase(),
    passwordHash,
    name: sanitizeName(name),
    emailVerified: false,
  });

  const verificationToken = createVerificationToken(user.id);

  res.json({
    user: { id: user.id, email: user.email, name: user.name, emailVerified: false },
    emailVerificationTokenPreview: verificationToken,
  });
});

router.post('/login', csrfProtection, async (req, res) => {
  const { email, password } = req.body;

  if (!validateEmail(email) || typeof password !== 'string') {
    res.status(400).json({ error: 'Invalid credentials' });
    return;
  }

  const user = getUserByEmail(email.trim().toLowerCase());
  if (!user || !user.password_hash) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  if (isUserLocked(user)) {
    res.status(423).json({ error: 'Account locked due to failed attempts' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const result = recordFailedLogin(user);
    if (result.locked) {
      res.status(423).json({ error: 'Account locked due to failed attempts' });
      return;
    }
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  updateUserLoginSuccess(user.id);

  if (!user.email_verified) {
    res.status(403).json({ error: 'Email not verified' });
    return;
  }

  if (!ensureJwtSecret(req, res)) {
    return;
  }
  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ user: { id: user.id, email: user.email, name: user.name, emailVerified: !!user.email_verified } });
});

router.post('/logout', csrfProtection, (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = req.user;
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: !!user.email_verified,
    },
  });
});

router.post('/verify-email', csrfProtection, (req, res) => {
  const { token } = req.body;
  if (typeof token !== 'string' || !token) {
    res.status(400).json({ error: 'Invalid token' });
    return;
  }

  const record = findValidVerificationToken(token);
  if (!record) {
    res.status(400).json({ error: 'Invalid or expired token' });
    return;
  }

  db.prepare('UPDATE email_verification_tokens SET used = 1 WHERE id = ?').run(record.id);
  db.prepare(
    'UPDATE users SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
  ).run(record.user_id);

  const user = getUserById(record.user_id);
  if (!user) {
    res.status(400).json({ error: 'User no longer exists' });
    return;
  }

  if (!ensureJwtSecret(req, res)) {
    return;
  }
  const tokenJwt = signToken(user);
  setAuthCookie(res, tokenJwt);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: !!user.email_verified,
    },
  });
});

router.post('/password-reset/request', csrfProtection, (req, res) => {
  const { email } = req.body;
  if (!validateEmail(email)) {
    res.status(400).json({ error: 'Invalid email' });
    return;
  }

  const user = getUserByEmail(email.trim().toLowerCase());
  if (!user) {
    res.json({ success: true });
    return;
  }

  const resetToken = createPasswordResetToken(user.id);

  res.json({ success: true, resetTokenPreview: resetToken });
});

router.post('/password-reset/confirm', csrfProtection, async (req, res) => {
  const { token, newPassword } = req.body;
  if (typeof token !== 'string' || !validatePassword(newPassword)) {
    res.status(400).json({ error: 'Invalid token or password' });
    return;
  }

  const record = findValidPasswordResetToken(token);
  if (!record) {
    res.status(400).json({ error: 'Invalid or expired token' });
    return;
  }

  const user = getUserById(record.user_id);
  if (!user) {
    res.status(400).json({ error: 'User no longer exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  db.prepare(
    'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
  ).run(passwordHash, user.id);

  db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(record.id);

  res.json({ success: true });
});

router.get('/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res.status(500).json({ error: 'Google OAuth not configured' });
    return;
  }

  const state = crypto.randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    include_granted_scopes: 'true',
    state,
    prompt: 'consent',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    res.status(400).send('Missing authorization code');
    return;
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res.status(500).send('Google OAuth not configured');
    return;
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) {
      res.status(400).send('Failed to exchange code for token');
      return;
    }
    const tokenData = await tokenRes.json();

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userInfoRes.ok) {
      res.status(400).send('Failed to fetch user profile');
      return;
    }
    const profile = await userInfoRes.json();

    const email = profile.email && profile.email.toLowerCase();
    if (!validateEmail(email)) {
      res.status(400).send('Unable to determine email from Google profile');
      return;
    }

    let user = getUserByEmail(email);
    if (!user) {
      user = createUser({
        email,
        passwordHash: null,
        name: sanitizeName(profile.name || profile.given_name || ''),
        emailVerified: true,
      });
    }

    db.prepare(
      'INSERT OR IGNORE INTO auth_identities (user_id, provider, provider_user_id) VALUES (?, ?, ?)',
    ).run(user.id, 'google', profile.sub);

    updateUserLoginSuccess(user.id);

    if (!ensureJwtSecret(req, res)) {
      return;
    }
    const token = signToken(user);
    setAuthCookie(res, token);

    const redirectTarget = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    res.redirect(redirectTarget);
  } catch (e) {
    res.status(500).send('Google OAuth error');
  }
});

router.get('/github', (req, res) => {
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    res.status(500).json({ error: 'GitHub OAuth not configured' });
    return;
  }

  const state = crypto.randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: 'user:email',
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

router.get('/github/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    res.status(400).send('Missing authorization code');
    return;
  }

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    res.status(500).send('GitHub OAuth not configured');
    return;
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI,
      }),
    });
    if (!tokenRes.ok) {
      res.status(400).send('Failed to exchange code for token');
      return;
    }
    const tokenData = await tokenRes.json();

    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) {
      res.status(400).send('Failed to fetch GitHub user');
      return;
    }
    const userData = await userRes.json();

    const emailRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!emailRes.ok) {
      res.status(400).send('Failed to fetch GitHub emails');
      return;
    }
    const emails = await emailRes.json();
    const primaryEmail =
      emails.find((e) => e.primary && e.verified) ||
      emails.find((e) => e.verified) ||
      emails[0];

    if (!primaryEmail || !validateEmail(primaryEmail.email)) {
      res.status(400).send('Unable to determine email from GitHub profile');
      return;
    }

    const email = primaryEmail.email.toLowerCase();
    let user = getUserByEmail(email);
    if (!user) {
      user = createUser({
        email,
        passwordHash: null,
        name: sanitizeName(userData.name || userData.login || ''),
        emailVerified: true,
      });
    }

    db.prepare(
      'INSERT OR IGNORE INTO auth_identities (user_id, provider, provider_user_id) VALUES (?, ?, ?)',
    ).run(user.id, 'github', String(userData.id));

    updateUserLoginSuccess(user.id);

    if (!ensureJwtSecret(req, res)) {
      return;
    }
    const token = signToken(user);
    setAuthCookie(res, token);

    const redirectTarget = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    res.redirect(redirectTarget);
  } catch (e) {
    res.status(500).send('GitHub OAuth error');
  }
});

module.exports = router;

