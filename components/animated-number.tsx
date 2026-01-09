"use client"

import { useEffect, useRef, useState } from "react"

interface AnimatedNumberProps {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
  duration?: number
}

export function AnimatedNumber({
  value,
  decimals = 2,
  prefix = "",
  suffix = "",
  className = "",
  duration = 800,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValueRef = useRef(value)
  const animationFrameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const startValue = prevValueRef.current
    const endValue = value
    const startTime = Date.now()

    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)

      // Easing function (ease-out)
      const easeProgress = 1 - Math.pow(1 - progress, 3)

      const currentValue = startValue + (endValue - startValue) * easeProgress

      setDisplayValue(currentValue)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        prevValueRef.current = endValue
      }
    }

    if (startValue !== endValue) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [value, duration])

  const formattedValue = displayValue.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span className={className}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  )
}
