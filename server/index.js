const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');
const db = require('./database');
const authRouter = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(bodyParser.json());
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRouter);

// Habits Endpoints
app.get('/api/habits', (req, res) => {
  try {
    const habits = db.prepare('SELECT * FROM habits ORDER BY created_at DESC').all();
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/habits', (req, res) => {
  const { name, description, frequency } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO habits (name, description, frequency) VALUES (?, ?, ?)');
    const info = stmt.run(name, description || '', frequency || 'daily');
    res.json({ id: info.lastInsertRowid, name, description, frequency });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/habits/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM habits WHERE id = ?').run(id);
    res.json({ message: 'Habit deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tracking Endpoints
app.get('/api/tracking', (req, res) => {
    // Get all tracking data
    try {
        const tracking = db.prepare('SELECT * FROM tracking').all();
        res.json(tracking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/tracking/:habitId', (req, res) => {
  const { habitId } = req.params;
  try {
    const tracking = db.prepare('SELECT * FROM tracking WHERE habit_id = ?').all(habitId);
    res.json(tracking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tracking', (req, res) => {
  const { habitId, date, completed } = req.body;
  try {
    // Check if entry exists
    const existing = db.prepare('SELECT * FROM tracking WHERE habit_id = ? AND date = ?').get(habitId, date);
    
    if (existing) {
      db.prepare('UPDATE tracking SET completed = ? WHERE id = ?').run(completed ? 1 : 0, existing.id);
    } else {
      db.prepare('INSERT INTO tracking (habit_id, date, completed) VALUES (?, ?, ?)').run(habitId, date, completed ? 1 : 0);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Suggestions Endpoints
app.get('/api/suggestions/:habitId', (req, res) => {
  const { habitId } = req.params;
  try {
    const suggestions = db.prepare('SELECT * FROM suggestions WHERE habit_id = ? ORDER BY created_at DESC').all(habitId);
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suggestions', (req, res) => {
  const { habitId, suggestion } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO suggestions (habit_id, suggestion) VALUES (?, ?)');
    const info = stmt.run(habitId, suggestion);
    res.json({ id: info.lastInsertRowid, habitId, suggestion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
