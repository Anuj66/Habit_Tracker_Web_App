# Habit Tracker Web App

A simple full-stack web application to track daily habits and monitor progress.

## Tech Stack
- **Frontend**: React, Vite, Recharts, Axios
- **Backend**: Node.js, Express, SQLite

## Setup & Run

### 1. Backend (Server)
The backend runs on port 5000 and handles data storage using a local SQLite database.

```bash
cd server
npm install  # If not already installed
node index.js
```

### 2. Frontend (Client)
The frontend is a React app running on Vite.

```bash
cd client
npm install  # If not already installed
npm run dev
```

Open your browser and navigate to the URL shown (usually `http://localhost:5173`).

## Features
- **Daily Tracker**: Add habits and mark them as completed for the day.
- **Progress View**: Visualize your consistency over the last 7 days with bar charts.
- **Suggestions**: Add and view improvement notes/suggestions for each habit.
