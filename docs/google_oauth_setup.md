# Google OAuth Setup Guide

This guide explains how to obtain the Google OAuth credentials (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`) required for the application.

## Prerequisites

- A Google Account
- Access to the [Google Cloud Console](https://console.cloud.google.com/)

## Step-by-Step Instructions

### 1. Create a Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click on the project dropdown at the top left (next to the Google Cloud logo).
3. Click **New Project**.
4. Enter a project name (e.g., "Habit Tracker Dev") and click **Create**.
5. Select the newly created project from the dropdown.

### 2. Configure OAuth Consent Screen
1. In the left sidebar, navigate to **APIs & Services** > **OAuth consent screen**.
2. Select **External** for User Type (unless you are in a Google Workspace organization) and click **Create**.
3. Fill in the **App Information**:
   - **App name**: Habit Tracker (or your preferred name)
   - **User support email**: Select your email address
   - **Developer contact information**: Enter your email address
4. Click **Save and Continue**.
5. **Scopes**: You can skip adding scopes for now, or add `userinfo.email` and `userinfo.profile`. Click **Save and Continue**.
6. **Test Users**: Add your own email address as a test user so you can log in during development. Click **Add Users**, enter your email, and click **Add**.
7. Click **Save and Continue** and then **Back to Dashboard**.

### 3. Create Credentials
1. In the left sidebar, click on **Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.
3. **Application type**: Select **Web application**.
4. **Name**: Enter a name (e.g., "Habit Tracker Web Client").
5. **Authorized JavaScript origins**:
   - Click **+ Add URI**.
   - Enter: `http://localhost:5173` (Frontend)
   - Click **+ Add URI** again.
   - Enter: `http://localhost:5000` (Backend)
6. **Authorized redirect URIs**:
   - Click **+ Add URI**.
   - Enter: `http://localhost:5000/api/auth/google/callback`
   - *Note: This must match exactly with the `GOOGLE_REDIRECT_URI` in your configuration.*
7. Click **Create**.

### 4. Get Client ID and Secret
1. A dialog will appear with your **Client ID** and **Client Secret**.
2. Copy these values.

### 5. Update Environment Variables
1. Open your `.env` file in the project root.
2. Add or update the following lines with your copied credentials:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

3. Ensure `GOOGLE_REDIRECT_URI` is set correctly (or rely on the default):
```env
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

### 6. Restart the Server
If your server is running, restart it to load the new environment variables.

```bash
docker-compose up -d --build
```
