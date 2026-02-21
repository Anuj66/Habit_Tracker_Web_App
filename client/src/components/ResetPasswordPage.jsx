import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCsrfToken, confirmPasswordReset } from '../api';

const useQuery = () => {
  return new URLSearchParams(window.location.search);
};

const ResetPasswordPage = () => {
  const [csrfToken, setCsrfToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const query = useQuery();
  const navigate = useNavigate();

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
    const token = query.get('token');
    if (!token) {
      setError('Missing reset token');
      return;
    }
    if (!csrfToken || submitting) {
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setError('');
    setInfo('');
    try {
      await confirmPasswordReset(token, newPassword, csrfToken);
      setInfo('Password updated successfully. You can now sign in with your new password.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const message =
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Password reset failed';
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Choose a new password
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter a strong password to secure your account.
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
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !csrfToken}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-60"
          >
            {submitting ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

