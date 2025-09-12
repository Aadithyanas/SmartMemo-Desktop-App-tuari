import type React from "react";
import { Mic, X, FileText } from "lucide-react";

interface TranscribeButtonProps {
  onTranscribeClick: () => void;
  onCancelClick: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  error: string;
  isTransitioning: boolean;
  animationPhase: string;
}

export const TranscribeButton: React.FC<TranscribeButtonProps> = ({
  onTranscribeClick,
  onCancelClick,
  onMouseDown,
  error,
  isTransitioning,
  animationPhase,
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-transparent select-none p-2">
      <div
        className={`
          w-full rounded-[32px] flex items-center justify-between px-6 py-3 
          transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] transform-gpu cursor-grab
          ${animationPhase === "transcribe" ? "scale-100 opacity-100" : "scale-95 opacity-90"}
        `}
        onMouseDown={onMouseDown}
        style={{
          background: `linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(25,25,25,0.95) 50%, rgba(0,0,0,0.95) 100%)`,
          border: "none",
          boxShadow: "none",
        }}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0 pointer-events-none">
          <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0 shadow-lg shadow-green-500/60" />
          <Mic size={16} className="text-white flex-shrink-0 opacity-90" />
          <span className="text-white text-base font-medium tracking-wide opacity-95">
            Transcribe
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onTranscribeClick}
            disabled={isTransitioning}
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center
              transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
              ${
                isTransitioning
                  ? "opacity-50 cursor-not-allowed scale-90"
                  : "hover:scale-110 active:scale-95 hover:shadow-lg"
              }
            `}
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              boxShadow: isTransitioning
                ? "0 2px 8px rgba(59, 130, 246, 0.2)"
                : "0 4px 12px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              border: "0.5px solid rgba(255,255,255,0.1)",
            }}
          >
            <FileText size={10} className="text-white" />
          </button>

          <button
            onClick={onCancelClick}
            disabled={isTransitioning}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
              ${
                isTransitioning
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
  );
};