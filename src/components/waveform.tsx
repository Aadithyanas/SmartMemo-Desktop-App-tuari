"use client"

export function Waveform() {
  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="w-1 bg-primary rounded-full waveform-bar"
          style={{
            animationDelay: `${i * 0.1}s`,
            height: `${Math.random() * 16 + 4}px`,
          }}
        />
      ))}
    </div>
  )
}
