import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCsrfToken, requestPasswordReset } from '../api';

const RequestResetPage = () => {
  const [csrfToken, setCsrfToken] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCsrfToken()
      .then((res) => {
        setCsrfToken(res.data.csrfToken);
      })
      .catch(() => {
        setError('Unable to initialize reset form');
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!csrfToken || submitting) {
      return;
    }
    setSubmitting(true);
    setError('');
    setInfo('');
    try {
      const res = await requestPasswordReset(email, csrfToken);
      setInfo(
        'If an account exists for this email, a reset link has been sent. For testing, use the reset token returned by the API.',
      );
      if (res.data && res.data.resetTokenPreview) {
        setInfo(
          `Use this password reset token for testing: ${res.data.resetTokenPreview}`,
        );
      }
      setSubmitting(false);
    } catch (err) {
      const message =
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Password reset request failed';
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Reset password
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {info && (
          <div className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-lg px-3 py-2">
            {info}
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

          <button
            type="submit"
            disabled={submitting || !csrfToken}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-60"
          >
            {submitting ? 'Sending reset link...' : 'Send reset link'}
          </button>
        </form>

        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
          Remembered your password?{' '}
          <Link
            to="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RequestResetPage;

