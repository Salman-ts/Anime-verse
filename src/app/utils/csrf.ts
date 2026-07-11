export const generateCSRFToken = (): string => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export const getCSRFToken = (): string => {
  if (typeof window === 'undefined') return ''
  
  let token = sessionStorage.getItem('csrf_token')
  if (!token) {
    token = generateCSRFToken()
    sessionStorage.setItem('csrf_token', token)
  }
  return token
}

export const validateCSRFToken = (token: string): boolean => {
  if (typeof window === 'undefined') return false
  const storedToken = sessionStorage.getItem('csrf_token')
  
  if (!token || !storedToken || token.length !== storedToken.length) {
    return false
  }
  
  // Simple constant-time comparison for browser environment
  if (token.length !== storedToken.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i)
  }
  return result === 0
}

export const addCSRFHeaders = (headers: Record<string, string> = {}): Record<string, string> => {
  return {
    ...headers,
    'X-CSRF-Token': getCSRFToken()
  }
}