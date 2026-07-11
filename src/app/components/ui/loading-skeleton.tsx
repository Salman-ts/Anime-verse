import { cn } from './utils'

interface LoadingSkeletonProps {
  className?: string
  variant?: 'text' | 'card' | 'avatar'
}

export function LoadingSkeleton({ className, variant = 'text' }: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-muted rounded'
  
  const variantClasses = {
    text: 'h-4 w-full',
    card: 'w-full h-full',
    avatar: 'w-10 h-10 rounded-full'
  }

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)} />
  )
}