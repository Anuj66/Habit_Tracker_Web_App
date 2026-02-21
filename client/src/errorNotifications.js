let handler = null

export const registerErrorHandler = (fn) => {
  handler = fn
}

export const unregisterErrorHandler = () => {
  handler = null
}

export const notifyError = (payload) => {
  if (typeof handler === 'function') {
    handler(payload)
  }
}

