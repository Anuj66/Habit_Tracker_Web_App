const db = require('./database')
const debug = require('debug')('habit-tracker:error')

class AppError extends Error {
  constructor({
    message,
    httpStatus = 500,
    category,
    errorCode,
    details,
    userMessage,
    level,
    isOperational = true,
  }) {
    super(message || userMessage || 'Error')
    this.httpStatus = httpStatus
    this.category = category || (httpStatus >= 500 ? 'server_error' : 'client_error')
    this.errorCode = errorCode || (httpStatus >= 500 ? 'SERVER_UNEXPECTED_EXCEPTION' : null)
    this.details = details
    this.userMessage =
      userMessage ||
      (httpStatus >= 500
        ? 'Something went wrong. Please try again later.'
        : message || 'Request failed')
    this.level = level || (httpStatus >= 500 ? 'error' : 'warn')
    this.isOperational = isOperational
  }
}

const normalizeError = (err) => {
  if (err instanceof AppError) {
    return err
  }

  const httpStatus = err.statusCode || err.status || 500
  const category = httpStatus >= 500 ? 'server_error' : 'client_error'

  return new AppError({
    message: err.message,
    httpStatus,
    category,
    errorCode: httpStatus >= 500 ? 'SERVER_UNEXPECTED_EXCEPTION' : null,
    details: { rawMessage: err.message },
    isOperational: false,
  })
}

const errorHandler = (err, req, res, next) => {
  const normalized = normalizeError(err)

  const statusCode = normalized.httpStatus || 500
  const category = normalized.category || (statusCode >= 500 ? 'server_error' : 'client_error')
  const errorCode =
    normalized.errorCode || (statusCode >= 500 ? 'SERVER_UNEXPECTED_EXCEPTION' : null)

  const requestId = req.requestId || null
  const environment = process.env.NODE_ENV || 'development'

  const payloadDetails = {
    ...(normalized.details || {}),
    path: req.path,
    method: req.method,
    query: req.query,
    params: req.params,
    requestId,
  }

  const responseBody = {
    statusCode,
    errorCode,
    category,
    message: normalized.userMessage,
    details: statusCode < 500 ? normalized.details || null : null,
    requestId,
    timestamp: new Date().toISOString(),
  }

  try {
    const stmt = db.prepare(
      'INSERT INTO error_events (level, category, status_code, error_code, message, details, path, method, request_id, user_id, environment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    const detailsJson = JSON.stringify({
      ...payloadDetails,
      stack: environment === 'development' ? err.stack : undefined,
    })
    stmt.run(
      normalized.level || (statusCode >= 500 ? 'error' : 'warn'),
      category,
      statusCode,
      errorCode,
      err.message || normalized.userMessage,
      detailsJson,
      req.path,
      req.method,
      requestId,
      req.user && req.user.id ? req.user.id : null,
      environment,
    )
  } catch (loggingError) {
    debug('Failed to log error event %o', loggingError)
  }

  if (res.headersSent) {
    next()
    return
  }

  res.status(statusCode).json(responseBody)
}

module.exports = {
  AppError,
  errorHandler,
}
