"use client"
import { useEffect, useState, useCallback } from "react"
import { useAudioRecorder } from "../../../hooks/useAudioRecorder"
import { useWindowResize } from "../../../hooks/useWindowResize"
import { useDragHandler } from "../../../hooks/useDragHandler"
import { CompactMicButton } from "./CompactMicButton"
import { RecordingInterface } from "./RecordingInterface"
import { TranscribeButton } from "./TranscribeButton"
import TranscribeComponent from "./transcribe-component"

export default function DynamicIslandMic() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<
    "idle" | "expanding" | "expanded" | "collapsing" | "transcribe" | "transcribing"
  >("idle")
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [showTranscribeButton, setShowTranscribeButton] = useState(false)
  const [showTranscribeComponent, setShowTranscribeComponent] = useState(false)
  const [duration,setCurrentDuration]= useState("")
  const { isRecording, formattedTime, startRecording, stopRecording, reset, recordingTime } = useAudioRecorder()
  const [Error,setError]=useState("")
  const { resizeWithAnimation } = useWindowResize()
  const { handleMouseDown, handleMouseUp, cleanup } = useDragHandler()

  const handleStartRecording = useCallback(async () => {
    if (isTransitioning) return

    console.log("🎤 Starting recording...")
    setIsTransitioning(true)
    setAnimationPhase("expanding")

    try {
      // Start UI expansion animation immediately
      setIsExpanded(true)

      // Perfect timing: Start resize at 80ms into the animation
      await resizeWithAnimation(290, 70, {
        animationDelay: 0,
        resizeDelay: 80,
        postResizeDelay: 120,
      })

      // Start recording once everything is settled
      await startRecording()
      setAnimationPhase("expanded")

      // Small delay to ensure smooth transition completion
      await new Promise((resolve) => setTimeout(resolve, 50))
      setIsTransitioning(false)
    } catch (error) {
      console.error("❌ Failed to start recording:", error)
      setIsTransitioning(false)
      setAnimationPhase("idle")
    }
  }, [isTransitioning, resizeWithAnimation, startRecording])

  const handleStopRecording = useCallback(async () => {
    if (isTransitioning) return

    console.log("🛑 Stopping recording...")
    setIsTransitioning(true)
    setAnimationPhase("collapsing")

    try {
      // Stop recording immediately
      const blob = await stopRecording()
    
      if (blob) {
        setAudioBlob(blob)
        setCurrentDuration(formattedTime)
      }

      
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Transition to transcribe button state
      setShowTranscribeButton(true)
      setAnimationPhase("transcribe")

      
      await resizeWithAnimation(300, 70, {
        animationDelay: 0,
        resizeDelay: 60,
        postResizeDelay: 140,
      })

      setIsTransitioning(false)
    } catch (error) {
      console.error("❌ Failed to stop recording:", error)
      setIsTransitioning(false)
      setAnimationPhase("idle")
    }
  }, [isTransitioning, resizeWithAnimation, stopRecording])

  const handleTranscribeClick = useCallback(async () => {
  if (isTransitioning) return;

  
  if (!audioBlob) {
    setError("There is NO voice");
    return;                
  }

  const seconds = recordingTime; 

  if (seconds < 5) {
    setError("Give more than 5 sec voice");
    return;                
  }
  

  console.log("📝 Starting transcription…");
  setError("");           
  setIsTransitioning(true);
  setAnimationPhase("transcribing");

  try {
    setShowTranscribeButton(false);
    setShowTranscribeComponent(true);

    await resizeWithAnimation(400, 320, {
      animationDelay: 0,
      resizeDelay: 100,
      postResizeDelay: 150,
    });

    setIsTransitioning(false);
  } catch (error) {
    console.error("❌ Failed to start transcription:", error);
    setIsTransitioning(false);
  }
}, [isTransitioning, audioBlob, recordingTime, resizeWithAnimation]);

  const handleBackToIdle = useCallback(async () => {
    

    console.log("🔄 Returning to idle state...")
    // setIsTransitioning(true)

    try {
      // Reset all states
      setShowTranscribeComponent(false)
      setShowTranscribeButton(false)
      setIsExpanded(false)
      setAudioBlob(null)
      reset()
      setAnimationPhase("idle")

      // Resize back to compact with smooth animation
      await resizeWithAnimation(120, 70, {
        animationDelay: 0,
        resizeDelay: 100,
        postResizeDelay: 150,
      })

      setIsTransitioning(false)
    } catch (error) {
      console.error("❌ Failed to return to idle:", error)
      setIsTransitioning(false)
    }
  }, [isTransitioning, resizeWithAnimation, reset])

  // Initialize window and setup event listeners
  useEffect(() => {
    const initWindow = async () => {
      try {
        console.log("🪟 Initializing window size...")
        await resizeWithAnimation(120, 70, {
          animationDelay: 0,
          resizeDelay: 0,
          postResizeDelay: 100,
        })
        console.log("✅ Window initialized successfully")
      } catch (error) {
        console.error("❌ Failed to initialize window:", error)
      }
    }

    initWindow()

    // Prevent context menu and setup mouse handlers
    const preventContextMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener("contextmenu", preventContextMenu)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("contextmenu", preventContextMenu)
      document.removeEventListener("mouseup", handleMouseUp)
      cleanup()
    }
  }, [handleMouseUp, resizeWithAnimation, cleanup])

  // Render transcribe component
  if (showTranscribeComponent && audioBlob) {
    return (
      <TranscribeComponent
        audioBlob={audioBlob}
        onBack={handleBackToIdle}
        onMouseDown={handleMouseDown}
        recordingTime={recordingTime}
      />
    )
  }

  // Render transcribe button
  if (showTranscribeButton && audioBlob) {
    return (
      <TranscribeButton
        onTranscribeClick={handleTranscribeClick}
        onCancelClick={handleBackToIdle}
        onMouseDown={handleMouseDown}
        error={Error}
        isTransitioning={isTransitioning}
        animationPhase={animationPhase}
      />
    )
  }

  // Render compact mic button
  if (!isExpanded) {
    return (
      <CompactMicButton
        onMicClick={handleStartRecording}
        onMouseDown={handleMouseDown}
        isExpanding={animationPhase === "expanding"}
      />
    )
  }

  // Render recording interface
  return (
    <RecordingInterface
      isRecording={isRecording}
      formattedTime={formattedTime}
      onStopClick={handleStopRecording}
      onCancelClick={handleBackToIdle}
      onMouseDown={handleMouseDown}
      isTransitioning={isTransitioning}
      animationPhase={animationPhase}
    />
  )
}
