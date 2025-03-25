"use client"

import { useEffect, useState } from "react"

interface ProgressBarProps {
  progress: number
  color?: string
  height?: number
  showPercentage?: boolean
  className?: string
  label?: string
  animate?: boolean
}

export function ProgressBar({
  progress,
  color = "#4F6BF4",
  height = 8,
  showPercentage = true,
  className = "",
  label,
  animate = true,
}: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  // Animate progress bar when progress changes
  useEffect(() => {
    if (!animate) {
      setDisplayProgress(progress)
      return
    }

    // If no change, don't animate
    if (displayProgress === progress) return

    // Animate progress over time
    const animationDuration = 500 // ms
    const startTime = Date.now()
    const startProgress = displayProgress

    const animateProgress = () => {
      const elapsed = Date.now() - startTime
      const animProgress = Math.min(elapsed / animationDuration, 1)

      // Calculate current animation value using easing
      const easedProgress = 1 - Math.pow(1 - animProgress, 3) // Cubic ease-out
      const currentValue = startProgress + (progress - startProgress) * easedProgress

      setDisplayProgress(currentValue)

      if (animProgress < 1) {
        requestAnimationFrame(animateProgress)
      } else {
        setDisplayProgress(progress)
      }
    }

    requestAnimationFrame(animateProgress)
  }, [progress, displayProgress, animate])

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm font-medium">{label}</span>}
          {showPercentage && <span className="text-xs text-gray-500">{Math.round(progress)}%</span>}
        </div>
      )}
      <div className="bg-gray-100 rounded-full overflow-hidden" style={{ height: `${height}px` }}>
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${displayProgress}%`,
            backgroundColor: color,
          }}
        ></div>
      </div>
    </div>
  )
}

