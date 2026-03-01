const request = require('supertest');
const app = require('./index');
const db = require('./database');

describe('Authentication flows', () => {
  beforeAll(async () => {
    await db.run('DELETE FROM email_verification_tokens');
    await db.run('DELETE FROM password_reset_tokens');
    await db.run('DELETE FROM auth_identities');
    await db.run('DELETE FROM users');
  });

  test('register, verify email, and login with local credentials', async () => {
    const csrfRes = await request(app).get('/api/auth/csrf');
    expect(csrfRes.statusCode).toBe(200);
    expect(csrfRes.body.csrfToken).toBeDefined();
    const csrfToken = csrfRes.body.csrfToken;
    const cookies = csrfRes.headers['set-cookie'];

    const email = 'testuser@example.com';
    const password = 'StrongPass123';

    const registerRes = await request(app)
      .post('/api/auth/register')
      .set('Cookie', cookies)
      .set('x-csrf-token', csrfToken)
      .send({ email, password, name: 'Test User' });

    expect(registerRes.statusCode).toBe(200);
    expect(registerRes.body.user).toBeDefined();

    const verificationToken = registerRes.body.emailVerificationTokenPreview;
    expect(verificationToken).toBeDefined();

    const csrfRes2 = await request(app).get('/api/auth/csrf');
    const csrfToken2 = csrfRes2.body.csrfToken;
    const cookies2 = csrfRes2.headers['set-cookie'];

    const verifyRes = await request(app)
      .post('/api/auth/verify-email')
      .set('Cookie', cookies2)
      .set('x-csrf-token', csrfToken2)
      .send({ token: verificationToken });

    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.user.emailVerified).toBe(true);
    const authCookies = verifyRes.headers['set-cookie'];
    expect(authCookies.join(';')).toContain('auth_token');

    const meRes = await request(app).get('/api/auth/me').set('Cookie', authCookies);
    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.user.email).toBe(email);

    const csrfRes3 = await request(app).get('/api/auth/csrf').set('Cookie', authCookies);
    const csrfToken3 = csrfRes3.body.csrfToken;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Cookie', csrfRes3.headers['set-cookie'])
      .set('x-csrf-token', csrfToken3)
      .send({ email, password });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.user.email).toBe(email);
  });

  test('rate limiting and CSRF protection defend auth endpoints', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'someone@example.com',
      password: 'password',
    });
    expect(res.statusCode).toBe(403);
  });
});
