import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCsrfToken, verifyEmail } from '../api';

const useQuery = () => {
  return new URLSearchParams(window.location.search);
};

const VerifyEmailPage = () => {
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const query = useQuery();

  useEffect(() => {
    const token = query.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token');
      return;
    }

    getCsrfToken()
      .then((res) => {
        const csrfToken = res.data.csrfToken;
        return verifyEmail(token, csrfToken);
      })
      .then(() => {
        setStatus('success');
        setMessage('Email verified successfully. Redirecting to your dashboard.');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      })
      .catch((err) => {
        const text =
          err.response && err.response.data && err.response.data.error
            ? err.response.data.error
            : 'Verification failed';
        setStatus('error');
        setMessage(text);
      });
  }, [navigate, query]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verify email</h1>
        {status === 'pending' && (
          <p className="text-slate-600 dark:text-slate-300">Verifying your email address...</p>
        )}
        {status !== 'pending' && (
          <p
            className={
              status === 'success'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;

