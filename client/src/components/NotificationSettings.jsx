import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NotificationSettings = () => {
  const [preferences, setPreferences] = useState({
    email_notifications_enabled: true,
    push_notifications_enabled: true,
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [pushStatus, setPushStatus] = useState('Checking...');

  useEffect(() => {
    fetchPreferences();
    checkPushSubscription();
  }, []);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await axios.get('http://localhost:5000/api/notifications/preferences', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreferences(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch preferences', err);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/notifications/preferences', preferences, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Settings saved successfully!');
    } catch (err) {
      console.error('Failed to save preferences', err);
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  // Helper to convert VAPID key
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const checkPushSubscription = async () => {
    if (!('serviceWorker' in navigator)) {
      setPushStatus('Not supported');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      setPushStatus('Subscribed');
    } else {
      setPushStatus('Not subscribed');
    }
  };

  const enablePushNotifications = async () => {
    try {
      if (!('serviceWorker' in navigator)) return;

      const register = await navigator.serviceWorker.register('/service-worker.js');
      
      const token = localStorage.getItem('token');
      // Get VAPID key
      const { data: { publicKey } } = await axios.get('http://localhost:5000/api/notifications/vapid-public-key', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Send to server
      await axios.post('http://localhost:5000/api/notifications/subscribe', subscription, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPushStatus('Subscribed');
      setPreferences(prev => ({ ...prev, push_notifications_enabled: true }));
      handleSave({ preventDefault: () => {} }); // Save enabled state to DB
      alert('Push notifications enabled!');
    } catch (err) {
      console.error('Push registration failed', err);
      alert('Failed to enable push notifications.');
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="notification-settings p-4 border rounded shadow-sm mt-4">
      <h3 className="text-lg font-bold mb-4">Notification Settings</h3>
      
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="email_notifications_enabled"
              checked={preferences.email_notifications_enabled}
              onChange={handleChange}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span>Email Notifications</span>
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="push_notifications_enabled"
              checked={preferences.push_notifications_enabled}
              onChange={handleChange}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span>Push Notifications</span>
          </label>
          <div className="ml-7 text-sm text-gray-500">
            Status: {pushStatus}
            {pushStatus === 'Not subscribed' && (
              <button 
                type="button" 
                onClick={enablePushNotifications}
                className="ml-2 text-blue-500 underline"
              >
                Enable in Browser
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number (for future SMS)</label>
          <input
            type="tel"
            name="phone"
            value={preferences.phone || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            placeholder="+1234567890"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        
        {message && <p className="text-green-600 mt-2">{message}</p>}
      </form>
    </div>
  );
};

export default NotificationSettings;
