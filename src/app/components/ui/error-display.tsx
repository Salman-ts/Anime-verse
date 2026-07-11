'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

interface ErrorDisplayProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorDisplay({ 
  title = "Something went wrong", 
  message, 
  onRetry 
}: ErrorDisplayProps) {
  return (
    <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
      <CardHeader>
        <CardTitle className="flex items-center text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 mr-2" />
          {title}
        </CardTitle>
        <CardDescription className="text-red-600/80 dark:text-red-400/80">
          {message}
        </CardDescription>
      </CardHeader>
      {onRetry && (
        <CardContent>
          <Button 
            onClick={onRetry}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      )}
    </Card>
  )
}