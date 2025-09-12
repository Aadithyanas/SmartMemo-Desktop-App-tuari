import { audioRecorder } from "../services/audioRecorder";
import { useCallback, useEffect, useState, useRef } from "react";

interface MicrophoneStatus {
  isAvailable: boolean;
  hasDevices: boolean;
  hasPermission: boolean;
  error?: string;
}

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [microphoneStatus, setMicrophoneStatus] = useState<MicrophoneStatus | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Check microphone availability
  const checkMicrophoneAvailability = useCallback(async (): Promise<MicrophoneStatus> => {
    try {
      const status = await audioRecorder.checkMicrophoneAvailability();
      setMicrophoneStatus(status);
      return status;
    } catch (error) {
      const errorStatus: MicrophoneStatus = {
        isAvailable: false,
        hasDevices: false,
        hasPermission: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setMicrophoneStatus(errorStatus);
      return errorStatus;
    }
  }, []);

  // Get available microphone devices
  const getMicrophoneDevices = useCallback(async () => {
    try {
      return await audioRecorder.getMicrophoneDevices();
    } catch (error) {
      console.error("Failed to get microphone devices:", error);
      return [];
    }
  }, []);

  // Test specific microphone device
  const testMicrophoneDevice = useCallback(async (deviceId?: string) => {
    try {
      return await audioRecorder.testMicrophoneDevice(deviceId);
    } catch (error) {
      console.error("Failed to test microphone device:", error);
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Check microphone status before starting
      const micStatus = await checkMicrophoneAvailability();
      
      if (!micStatus.isAvailable) {
        const error = new Error(micStatus.error || 'Microphone not available');
        
        if (!micStatus.hasDevices) {
          error.name = 'NotFoundError';
        } else if (!micStatus.hasPermission) {
          error.name = 'NotAllowedError';
        } else {
          error.name = 'NotReadableError';
        }
        
        throw error;
      }

      await audioRecorder.startRecording();
      setIsRecording(true);
      setRecordingTime(0); // reset time when starting

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Failed to start recording:", error);
      setIsRecording(false);
      
      // Clean up timer if it was started
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      throw error;
    }
  }, [checkMicrophoneAvailability]);

  const stopRecording = useCallback(async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setIsRecording(false);
      
      // Only try to stop recording if we're actually recording
      if (audioRecorder.isRecording()) {
        const audioBlob = await audioRecorder.stopRecording();
        return audioBlob;
      } else {
        console.warn("Attempted to stop recording when not recording");
        return null;
      }

    } catch (error) {
      console.error("Failed to stop recording:", error);
      setIsRecording(false);
      
      // Ensure cleanup even if stopping fails
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setIsRecording(false);
      setRecordingTime(0);
      setMicrophoneStatus(null);
      
      // Release any active media streams
      audioRecorder.releaseMediaStream();
      
    } catch (error) {
      console.error("Failed to reset recorder:", error);
      throw error;
    }
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Get current recording state
  const getRecordingState = useCallback(() => {
    return audioRecorder.getRecordingState();
  }, []);

  // Force cleanup - useful for component unmounting
  const forceCleanup = useCallback(() => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      audioRecorder.releaseMediaStream();
      setIsRecording(false);
      setRecordingTime(0);
      setMicrophoneStatus(null);
    } catch (error) {
      console.error("Failed to force cleanup:", error);
    }
  }, []);

  return {
    // Recording state
    isRecording,
    recordingTime,
    formattedTime: formatTime(recordingTime),
    
    // Core recording functions
    startRecording,
    stopRecording,
    reset,
    
    // Microphone status and testing
    microphoneStatus,
    checkMicrophoneAvailability,
    getMicrophoneDevices,
    testMicrophoneDevice,
    
    // Additional utilities
    getRecordingState,
    forceCleanup
  };
};