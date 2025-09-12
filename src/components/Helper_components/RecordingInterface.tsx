import type React from "react"
import { Mic, Square, X } from "lucide-react"

interface RecordingInterfaceProps {
  isRecording: boolean
  formattedTime: string
  onStopClick: () => void
  onCancelClick: () => void
  onMouseDown: (e: React.MouseEvent) => void
  isTransitioning: boolean
  animationPhase: string
}

export const RecordingInterface: React.FC<RecordingInterfaceProps> = ({
  isRecording,
  formattedTime,
  onStopClick,
  onCancelClick,
  onMouseDown,
  isTransitioning,
  animationPhase,
}) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent select-none p-2">
      <div
        className={`
          w-full h-full rounded-[32px] flex items-center justify-between px-6 py-3
          transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] transform-gpu cursor-grab
          ${animationPhase === "expanding"
            ? "scale-95 opacity-95"
            : animationPhase === "collapsing"
              ? "scale-105 opacity-90"
              : "scale-100 opacity-100"
          }
        `}
        onMouseDown={onMouseDown}
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
        <div className="flex items-center gap-4 flex-1 min-w-0 pointer-events-none">
          <div
            className={`
              w-3 h-3 rounded-full transition-all duration-300 flex-shrink-0
              ${isRecording && !isTransitioning
                ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/60"
                : "bg-red-600 opacity-80"
              }
            `}
            style={{
              boxShadow: isRecording
                ? "0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.4)"
                : "0 0 10px rgba(239, 68, 68, 0.4)",
              animation: isRecording ? "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
            }}
          />

          <Mic size={16} className="text-white flex-shrink-0 opacity-90" />

          <span className="text-white text-base font-medium tabular-nums tracking-wide opacity-95">
            {formattedTime}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onStopClick}
            disabled={isTransitioning}
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center
              transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
              ${isTransitioning
                ? "opacity-50 cursor-not-allowed scale-90"
                : "hover:scale-110 active:scale-95 hover:shadow-lg"
              }
            `}
            style={{
              background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
              boxShadow: isTransitioning
                ? "0 2px 8px rgba(220, 38, 38, 0.2)"
                : "0 4px 12px rgba(220, 38, 38, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              border: "0.5px solid rgba(255,255,255,0.1)",
            }}
          >
            <Square size={10} className="text-white fill-current" />
          </button>

          <button
            onClick={onCancelClick}
            disabled={isTransitioning}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
              ${isTransitioning
                ? "opacity-50 cursor-not-allowed scale-90"
                : "hover:scale-110 active:scale-95 hover:shadow-lg"
              }
            `}
            style={{
              background: "linear-gradient(135deg, #4b5563 0%, #374151 100%)",
              boxShadow: isTransitioning
                ? "0 2px 8px rgba(75, 85, 99, 0.2)"
                : "0 4px 12px rgba(75, 85, 99, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              border: "0.5px solid rgba(255,255,255,0.1)",
            }}
          >
            <X size={10} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}