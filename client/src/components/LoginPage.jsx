import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCsrfToken, login } from '../api';

const LoginPage = ({ useAuthHook }) => {
  const { setUser } = useAuthHook();
  const [csrfToken, setCsrfToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    getCsrfToken()
      .then((res) => {
        setCsrfToken(res.data.csrfToken);
      })
      .catch(() => {
        setError('Unable to initialize login form');
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!csrfToken || submitting) {
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await login({ email, password }, csrfToken);
      setUser(res.data.user);
      const from = location.state && location.state.from ? location.state.from : { pathname: '/' };
      navigate(from);
    } catch (err) {
      const message =
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Login failed';
      setError(message);
      setSubmitting(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleGithub = () => {
    window.location.href = 'http://localhost:5000/api/auth/github';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sign in</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Access your habits, progress, and insights securely.
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !csrfToken}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          <span className="text-xs uppercase tracking-wide text-slate-400">or continue with</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleGoogle}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <span>Google</span>
          </button>
          <button
            type="button"
            onClick={handleGithub}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <span>GitHub</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <Link
            to="/reset-password"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Forgot your password?
          </Link>
          <p className="text-slate-500 dark:text-slate-400">
            New here?{' '}
            <Link
              to="/register"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

