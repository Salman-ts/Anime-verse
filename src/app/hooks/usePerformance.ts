import { useEffect } from 'react'
import { logger } from '../utils/logger'

export function usePerformance(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (renderTime > 100) { // Log slow renders
        logger.warn(`Slow render detected in ${componentName}`, { renderTime })
      }
    }
  }, [componentName])
}

export function measureAsync<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = performance.now()
  
  return operation().finally(() => {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    if (duration > 1000) { // Log slow operations
      logger.warn(`Slow operation: ${operationName}`, { duration })
    }
  })
}