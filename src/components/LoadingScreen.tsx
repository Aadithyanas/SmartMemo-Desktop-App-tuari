import React, { useEffect, useState } from 'react';


function LoadingScreen() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [glowIntensity, setGlowIntensity] = useState(0.5);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        const newProgress = prev + Math.random() * 15;
        return newProgress > 100 ? 100 : newProgress;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const glowInterval = setInterval(() => {
      setGlowIntensity(() => 0.3 + Math.sin(Date.now() * 0.003) * 0.4);
    }, 50);
    return () => clearInterval(glowInterval);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 50%, #0a0a0a 0%, #000000 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Main Logo Container */}
      <div
        style={{
          position: 'relative',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: `
            radial-gradient(circle at 30% 30%, rgba(147, 51, 234, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
            conic-gradient(from 0deg, #9333ea, #3b82f6, #10b981, #f59e0b, #9333ea)
          `,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem',
          animation: 'rotate 6s linear infinite',
          border: '3px solid transparent',
          boxShadow: `
            0 0 ${20 + glowIntensity * 40}px rgba(147, 51, 234, ${glowIntensity}),
            0 0 ${40 + glowIntensity * 60}px rgba(59, 130, 246, ${glowIntensity * 0.7}),
            inset 0 0 20px rgba(0, 0, 0, 0.8)
          `,
          zIndex: 2,
        }}
      >
        {/* Inner Circle */}
        <div
          style={{
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.7) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* AI Neural Network Logo */}
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" style={{ opacity: 0.9 }}>
            {/* Central AI Core */}
            <circle
              cx="50"
              cy="50"
              r="12"
              fill="url(#coreGradient)"
              stroke="#9333ea"
              strokeWidth="2"
            />

            {/* Neural Network Nodes */}
            <circle cx="25" cy="25" r="4" fill="#3b82f6" opacity="0.8" />
            <circle cx="75" cy="25" r="4" fill="#10b981" opacity="0.8" />
            <circle cx="25" cy="75" r="4" fill="#f59e0b" opacity="0.8" />
            <circle cx="75" cy="75" r="4" fill="#ef4444" opacity="0.8" />
            <circle cx="50" cy="15" r="3" fill="#8b5cf6" opacity="0.7" />
            <circle cx="15" cy="50" r="3" fill="#06b6d4" opacity="0.7" />
            <circle cx="85" cy="50" r="3" fill="#84cc16" opacity="0.7" />
            <circle cx="50" cy="85" r="3" fill="#f97316" opacity="0.7" />

            {/* Neural Connections */}
            <line x1="50" y1="50" x2="25" y2="25" stroke="url(#connectionGradient1)" strokeWidth="2" opacity="0.6" />
            <line x1="50" y1="50" x2="75" y2="25" stroke="url(#connectionGradient2)" strokeWidth="2" opacity="0.6" />
            <line x1="50" y1="50" x2="25" y2="75" stroke="url(#connectionGradient3)" strokeWidth="2" opacity="0.6" />
            <line x1="50" y1="50" x2="75" y2="75" stroke="url(#connectionGradient4)" strokeWidth="2" opacity="0.6" />
            <line x1="50" y1="50" x2="50" y2="15" stroke="url(#connectionGradient5)" strokeWidth="1.5" opacity="0.5" />
            <line x1="50" y1="50" x2="15" y2="50" stroke="url(#connectionGradient6)" strokeWidth="1.5" opacity="0.5" />
            <line x1="50" y1="50" x2="85" y2="50" stroke="url(#connectionGradient7)" strokeWidth="1.5" opacity="0.5" />
            <line x1="50" y1="50" x2="50" y2="85" stroke="url(#connectionGradient8)" strokeWidth="1.5" opacity="0.5" />

            {/* Sound Wave Visualization */}
            <path
              d="M 30 50 Q 35 45 40 50 Q 45 55 50 50 Q 55 45 60 50 Q 65 55 70 50"
              stroke="#38bdf8"
              strokeWidth="2"
              fill="none"
              opacity="0.8"
            />

            {/* Voice Recognition Symbol */}
            <rect x="45" y="58" width="3" height="8" rx="1" fill="#9333ea" opacity="0.7" />
            <rect x="49" y="56" width="3" height="12" rx="1" fill="#3b82f6" opacity="0.7" />
            <rect x="53" y="54" width="3" height="16" rx="1" fill="#10b981" opacity="0.7" />

            {/* Gradients */}
            <defs>
              <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
              </radialGradient>
              <linearGradient id="connectionGradient1" x1="50%" y1="50%" x2="25%" y2="25%">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="connectionGradient2" x1="50%" y1="50%" x2="75%" y2="25%">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="connectionGradient3" x1="50%" y1="50%" x2="25%" y2="75%">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="connectionGradient4" x1="50%" y1="50%" x2="75%" y2="75%">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="connectionGradient5" x1="50%" y1="50%" x2="50%" y2="15%">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="connectionGradient6" x1="50%" y1="50%" x2="15%" y2="50%">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="connectionGradient7" x1="50%" y1="50%" x2="85%" y2="50%">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#84cc16" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="connectionGradient8" x1="50%" y1="50%" x2="50%" y2="85%">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Orbiting Elements */}
        <div
          style={{
            position: 'absolute',
            width: '8px',
            height: '8px',
            background: '#3b82f6',
            borderRadius: '50%',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'orbit 4s linear infinite',
            boxShadow: '0 0 10px #3b82f6',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '6px',
            height: '6px',
            background: '#10b981',
            borderRadius: '50%',
            top: '50%',
            right: '10px',
            transform: 'translateY(-50%)',
            animation: 'orbit 3s linear infinite reverse',
            boxShadow: '0 0 8px #10b981',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '5px',
            height: '5px',
            background: '#f59e0b',
            borderRadius: '50%',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'orbit 5s linear infinite',
            boxShadow: '0 0 6px #f59e0b',
          }}
        />
      </div>

      {/* App Title */}
      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #9333ea, #3b82f6, #10b981, #f59e0b)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem',
          textShadow: '0 0 20px rgba(147, 51, 234, 0.3)',
          animation: 'glow 2s ease-in-out infinite alternate',
          zIndex: 2,
        }}
      >
        SmartVoice
      </h1>

      {/* Subtitle */}
      <p
        style={{
          color: '#64748b',
          fontSize: '1rem',
          marginBottom: '2rem',
          fontWeight: '500',
          letterSpacing: '0.5px',
          zIndex: 2,
        }}
      >
        AI-Powered Transcription
      </p>

      {/* Progress Bar */}
      <div
        style={{
          width: '320px',
          height: '8px',
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '1rem',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          zIndex: 2,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${loadingProgress}%`,
            background: 'linear-gradient(90deg, #9333ea, #3b82f6, #10b981)',
            borderRadius: '4px',
            transition: 'width 0.3s ease',
            boxShadow: '0 0 10px rgba(147, 51, 234, 0.5)',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
              animation: 'shimmer 2s infinite',
            }}
          />
        </div>
      </div>

      {/* Status Text */}
      <p
        style={{
          color: '#94a3b8',
          fontSize: '0.9rem',
          fontWeight: '400',
          zIndex: 2,
        }}
      >
        {loadingProgress < 100 ? 'Initializing AI voice systems...' : 'Ready to transcribe'}
      </p>

      <style jsx>{`
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(80px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(80px) rotate(-360deg); }
        }
        @keyframes glow {
          0% { filter: brightness(1) drop-shadow(0 0 5px rgba(147, 51, 234, 0.3)); }
          100% { filter: brightness(1.2) drop-shadow(0 0 20px rgba(147, 51, 234, 0.6)); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}



export default LoadingScreen;