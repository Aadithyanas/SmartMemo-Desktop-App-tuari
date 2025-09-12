"use client"

import { useEffect, useState } from "react"
import { cn } from "../../../lib/utils"

interface ClickEffectProps {
  isActive: boolean
  className?: string
}

interface Effect {
  id: number
  timestamp: number
}

export function ClickEffect({ isActive, className }: ClickEffectProps) {
  const [effects, setEffects] = useState<Effect[]>([])

  useEffect(() => {
    if (isActive) {
      const newEffect: Effect = {
        id: Date.now(),
        timestamp: Date.now(),
      }

      setEffects((prev) => [...prev, newEffect])

      // Remove effect after animation completes
      const timer = setTimeout(() => {
        setEffects((prev) => prev.filter((effect) => effect.id !== newEffect.id))
      }, 1200)

      return () => clearTimeout(timer)
    }
  }, [isActive])

  const renderWaveEffect = (effect: Effect) => (
    <div key={effect.id} className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div className="wave-effect" />
      <div className="wave-effect wave-delay-1" />
      <div className="wave-effect wave-delay-2" />
    </div>
  )

  return (
    <div className={cn("absolute inset-0 overflow-hidden rounded-full", className)}>
      {effects.map(renderWaveEffect)}

      <style jsx>{`
        .wave-effect {
          position: absolute;
          width: 30px;
          height: 30px;
          border: 3px solid rgba(59, 130, 246, 0.6);
          border-radius: 50%;
          animation: wave 1.2s ease-out forwards;
        }

        .wave-delay-1 {
          animation-delay: 0.2s;
          border-color: rgba(59, 130, 246, 0.4);
        }

        .wave-delay-2 {
          animation-delay: 0.4s;
          border-color: rgba(59, 130, 246, 0.2);
        }

        @keyframes wave {
          0% {
            width: 30px;
            height: 30px;
            opacity: 1;
          }
          100% {
            width: 200px;
            height: 200px;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
