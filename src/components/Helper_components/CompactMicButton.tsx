import type React from "react"
import { Mic } from "lucide-react"
import { useState } from "react"

interface CompactMicButtonProps {
  onMicClick: () => void
  onMouseDown: (e: React.MouseEvent) => void
  isExpanding: boolean
}

export const CompactMicButton: React.FC<CompactMicButtonProps> = ({ 
  onMicClick, 
  onMouseDown, 
  isExpanding 
}) => {
  const [isHovering, setIsHovering] = useState(false)
  const [isMicHovering, setIsMicHovering] = useState(false)

  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent select-none p-2">
      <div
        className={`
          w-full h-full rounded-[32px] flex items-center justify-center relative
          transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] transform-gpu
          ${isExpanding ? "scale-105 opacity-90" : isHovering ? "scale-[1.02]" : "scale-100"}
        `}
        onMouseDown={onMouseDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(0,0,0,0.95) 0%, 
              rgba(25,25,25,0.95) 50%,
              rgba(0,0,0,0.95) 100%
            )
          `,
          backdropFilter: "none",
          border: "none",
          boxShadow: `
            nonw
          `,
        }}
      >
        {isHovering && (
          <div
            className="absolute inset-0 rounded-[32px] opacity-30 animate-pulse"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
        )}

        <div className="flex items-center gap-3 px-5 py-2">
          <div
            className={`
              relative w-8 h-8 rounded-full flex items-center justify-center
              transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer
              ${isMicHovering ? "scale-110 shadow-lg" : "scale-100"}
            `}
            onClick={onMicClick}
            onMouseEnter={() => setIsMicHovering(true)}
            onMouseLeave={() => setIsMicHovering(false)}
            style={{
              background: isMicHovering
                ? "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)"
                : "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)",
              border: "0.5px solid rgba(255,255,255,0.2)",
              boxShadow: isMicHovering
                ? "0 4px 16px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.3)"
                : "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <Mic
              size={14}
              className={`
                text-white transition-all duration-300
                ${isMicHovering ? "scale-110" : "scale-100"}
              `}
            />

            {isMicHovering && (
              <div
                className="absolute inset-0 rounded-full border border-white/30"
                style={{
                  animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                }}
              />
            )}
          </div>

          <span className="text-white text-sm font-medium tracking-wide pointer-events-none opacity-90">
            Mic
          </span>
        </div>
      </div>
    </div>
  )
}