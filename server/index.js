const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const crypto = require('crypto')
const debug = require('debug')('habit-tracker:server')
const db = require('./database')
const authRouter = require('./auth')
const { AppError, errorHandler } = require('./errors')

const app = express()
const PORT = process.env.PORT || 5000
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  }),
)
app.use(bodyParser.json())
app.use(cookieParser())

app.use((req, res, next) => {
  req.requestId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex')
  next()
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/auth', authLimiter, authRouter)

// Habits Endpoints
app.get('/api/habits', async (req, res, next) => {
  try {
    const habits = await db.all('SELECT * FROM habits ORDER BY created_at DESC')
    res.json(habits)
  } catch (err) {
    next(err)
  }
})

app.post('/api/habits', async (req, res, next) => {
  const { name, description, frequency } = req.body
  try {
    const row = await db.get(
      'INSERT INTO habits (name, description, frequency) VALUES (?, ?, ?) RETURNING id',
      [name, description || '', frequency || 'daily'],
    )
    res.json({ id: row.id, name, description, frequency })
  } catch (err) {
    next(err)
  }
})

app.delete('/api/habits/:id', async (req, res, next) => {
  const { id } = req.params
  try {
    await db.run('DELETE FROM habits WHERE id = ?', [id])
    res.json({ message: 'Habit deleted' })
  } catch (err) {
    next(err)
  }
})

// Tracking Endpoints
app.get('/api/tracking', async (req, res, next) => {
  try {
    const tracking = await db.all('SELECT * FROM tracking')
    res.json(tracking)
  } catch (err) {
    next(err)
  }
})

app.get('/api/tracking/:habitId', async (req, res, next) => {
  const { habitId } = req.params
  try {
    const tracking = await db.all('SELECT * FROM tracking WHERE habit_id = ?', [habitId])
    res.json(tracking)
  } catch (err) {
    next(err)
  }
})

app.post('/api/tracking', async (req, res, next) => {
  const { habitId, date, completed } = req.body
  try {
    const existing = await db.get('SELECT * FROM tracking WHERE habit_id = ? AND date = ?', [
      habitId,
      date,
    ])

    if (existing) {
      await db.run('UPDATE tracking SET completed = ? WHERE id = ?', [
        completed ? 1 : 0,
        existing.id,
      ])
    } else {
      await db.run('INSERT INTO tracking (habit_id, date, completed) VALUES (?, ?, ?)', [
        habitId,
        date,
        completed ? 1 : 0,
      ])
    }
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// Suggestions Endpoints
app.get('/api/suggestions/:habitId', async (req, res, next) => {
  const { habitId } = req.params
  try {
    const suggestions = await db.all(
      'SELECT * FROM suggestions WHERE habit_id = ? ORDER BY created_at DESC',
      [habitId],
    )
    res.json(suggestions)
  } catch (err) {
    next(err)
  }
})

app.post('/api/suggestions', async (req, res, next) => {
  const { habitId, suggestion } = req.body
  try {
    const row = await db.get(
      'INSERT INTO suggestions (habit_id, suggestion) VALUES (?, ?) RETURNING id',
      [habitId, suggestion],
    )
    res.json({ id: row.id, habitId, suggestion })
  } catch (err) {
    next(err)
  }
})

const clientBuildPath = path.join(__dirname, '..', 'client', 'dist')
app.use(express.static(clientBuildPath))

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    next(
      new AppError({
        httpStatus: 404,
        category: 'not_found',
        errorCode: 'API_ROUTE_NOT_FOUND',
        userMessage: 'Resource not found.',
        details: null,
      }),
    )
    return
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'))
})

app.use(errorHandler)

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    debug(`Server running on http://localhost:${PORT}`)
  })
}

module.exports = app
