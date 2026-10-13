'use client'

import { useRef, type HTMLAttributes } from 'react'

interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

/**
 * SpotlightCard - Glass-Neumorphic card with spotlight hover effect
 * The spotlight follows the mouse cursor creating a premium interactive feel
 * Used across the app for consistent premium hover interactions
 */
export default function SpotlightCard({ children, className = '', style, ...props }: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    cardRef.current.style.setProperty('--mouse-x', `${x}px`)
    cardRef.current.style.setProperty('--mouse-y', `${y}px`)
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    // Move spotlight off-screen when mouse leaves
    cardRef.current.style.setProperty('--mouse-x', '-200px')
    cardRef.current.style.setProperty('--mouse-y', '-200px')
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`spotlight-card ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  )
}