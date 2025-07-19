import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'gradient' | 'stats'
  hoverable?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  hoverable = false
}) => {
  const baseClasses = 'rounded-xl transition-all duration-300'
  
  const variantClasses = {
    default: 'bg-white/10 backdrop-blur-md border border-white/20',
    glass: 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-card',
    gradient: 'bg-gradient-to-br from-affinia-primary/20 to-affinia-accent/20 border border-affinia-primary/30',
    stats: 'bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/30'
  }
  
  const hoverClasses = hoverable ? 'hover:scale-[1.02] hover:shadow-neon cursor-pointer' : ''
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`
  
  return (
    <div className={classes}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`p-6 pb-4 ${className}`}>
      {children}
    </div>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`p-6 pt-4 ${className}`}>
      {children}
    </div>
  )
}