const isDevelopment = process.env.NODE_ENV === 'development'
const logLevel = process.env.NEXT_PUBLIC_LOG_LEVEL || (isDevelopment ? 'debug' : 'error')

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
} as const

type LogLevel = keyof typeof LOG_LEVELS

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[logLevel as LogLevel] || LOG_LEVELS[level] >= LOG_LEVELS.error
}

const sanitizeLogData = (input: any): string => {
  try {
    const sanitized = JSON.parse(JSON.stringify(input, (key, value) => {
      const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential', 'email']
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        return '[REDACTED]'
      }
      if (typeof value === 'string') {
        return value.replace(/[\r\n\t\x00-\x1f\x7f-\x9f]/g, ' ').substring(0, 500)
      }
      return value
    }))
    return JSON.stringify(sanitized)
  } catch {
    return '[UNPARSEABLE]'
  }
}

export const logger = {
  info: (message: string, data?: any) => {
    if (shouldLog('info')) {
      const timestamp = new Date().toISOString()
      console.info(`[${timestamp}] INFO: ${message}`, data ? sanitizeLogData(data) : '')
    }
  },
  
  warn: (message: string, data?: any) => {
    if (shouldLog('warn')) {
      const timestamp = new Date().toISOString()
      console.warn(`[${timestamp}] WARN: ${message}`, data ? sanitizeLogData(data) : '')
    }
  },
  
  error: (message: string, error?: any) => {
    if (shouldLog('error')) {
      const timestamp = new Date().toISOString()
      console.error(`[${timestamp}] ERROR: ${message}`, error ? sanitizeLogData(error) : '')
    }
  },
  
  debug: (message: string, data?: any) => {
    if (shouldLog('debug')) {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] DEBUG: ${message}`, data ? sanitizeLogData(data) : '')
    }
  }
}