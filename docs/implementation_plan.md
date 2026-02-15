# Habit Tracker Web Application Implementation Plan

## Overview
A web application to track daily habits, visualize progress with graphs, and provide improvement suggestions.

## Tech Stack
- **Frontend**: React (Vite), React Router, Recharts (for graphs), Axios (for API calls), CSS Modules or Styled Components (simple CSS for now).
- **Backend**: Node.js, Express.
- **Database**: SQLite (using `better-sqlite3` for simplicity and local storage).

## Architecture
The project will be divided into two main folders:
- `client`: React frontend.
- `server`: Node.js backend.

## Data Model

### Habits Table
- `id`: INTEGER PRIMARY KEY
- `name`: TEXT (Name of the habit)
- `description`: TEXT (Optional description)
- `frequency`: TEXT (e.g., 'daily')
- `created_at`: DATETIME

### Tracking Table
- `id`: INTEGER PRIMARY KEY
- `habit_id`: INTEGER (Foreign Key)
- `date`: TEXT (YYYY-MM-DD)
- `completed`: BOOLEAN

### Suggestions Table (Optional, or part of Habit)
- `id`: INTEGER PRIMARY KEY
- `habit_id`: INTEGER (Foreign Key)
- `suggestion`: TEXT
- `created_at`: DATETIME

## API Endpoints

### Habits
- `GET /api/habits`: Get all habits.
- `POST /api/habits`: Create a new habit.
- `DELETE /api/habits/:id`: Delete a habit.

### Tracking
- `GET /api/tracking/:habitId`: Get tracking history for a habit.
- `POST /api/tracking`: Mark a habit as completed/uncompleted for a specific date.

### Suggestions
- `GET /api/suggestions/:habitId`: Get suggestions for a habit.
- `POST /api/suggestions`: Add a suggestion for a habit.

## Features
1.  **Dashboard**: List of habits for today with checkboxes to mark as done.
2.  **Progress View**:
    - Sidebar/Tab navigation to switch between "Daily Tracker" and "Progress".
    - Graphs showing completion rates over time (e.g., last 7 days, last 30 days).
    - "Suggestion of Improvement" section displayed alongside the graph for each habit.
3.  **Habit Management**: Add/Delete habits.

## Folder Structure
```
Habit_Tracker_Web_App/
├── client/          # React App
├── server/          # Express App
├── docs/            # Documentation
└── README.md
```
