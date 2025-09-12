export function createAudioRecorder() {
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = []
    let stream: MediaStream | null = null;

    async function checkMicrophoneAvailability(): Promise<{
        isAvailable: boolean;
        hasDevices: boolean;
        hasPermission: boolean;
        error?: string;
    }> {
        try {
            // First check if mediaDevices API is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return {
                    isAvailable: false,
                    hasDevices: false,
                    hasPermission: false,
                    error: 'Media devices API not supported'
                };
            }

            // Check for available audio input devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            
            if (audioInputs.length === 0) {
                return {
                    isAvailable: false,
                    hasDevices: false,
                    hasPermission: false,
                    error: 'No microphone devices found'
                };
            }

            // Test microphone access and permission
            try {
                const testStream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    } 
                });
                
                const audioTracks = testStream.getAudioTracks();
                const isWorking = audioTracks.length > 0 && 
                                 audioTracks[0].enabled && 
                                 audioTracks[0].readyState === 'live';
                
                // Clean up test stream
                testStream.getTracks().forEach(track => track.stop());
                
                return {
                    isAvailable: isWorking,
                    hasDevices: true,
                    hasPermission: true,
                    error: isWorking ? undefined : 'Microphone track not active'
                };
                
            } catch (streamError: any) {
                let errorType = 'Unknown error';
                
                if (streamError.name === 'NotAllowedError') {
                    errorType = 'Permission denied';
                } else if (streamError.name === 'NotFoundError') {
                    errorType = 'No microphone found';
                } else if (streamError.name === 'NotReadableError') {
                    errorType = 'Microphone is being used by another application';
                } else if (streamError.name === 'OverconstrainedError') {
                    errorType = 'Microphone constraints cannot be satisfied';
                }
                
                return {
                    isAvailable: false,
                    hasDevices: true,
                    hasPermission: streamError.name !== 'NotAllowedError',
                    error: errorType
                };
            }
            
        } catch (error: any) {
            return {
                isAvailable: false,
                hasDevices: false,
                hasPermission: false,
                error: error.message || 'Failed to check microphone availability'
            };
        }
    }

    async function startRecording(): Promise<void> {
        try {
            // Check microphone availability before starting
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

            audioChunks = []
            stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                } 
            })
            
            // Double-check that we got valid audio tracks
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0 || !audioTracks[0].enabled) {
                throw new Error('No active audio tracks available');
            }

            mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            })

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            }

            mediaRecorder.onerror = (event: any) => {
                console.error('MediaRecorder error:', event.error);
                releaseMediaStream();
            }

            mediaRecorder.start(1000) // Collect data every second

        } catch (error) {
            console.error('Error starting recording:', error);
            releaseMediaStream(); // Clean up on error
            throw error;
        }
    }

    async function stopRecording(): Promise<Blob> {
        return new Promise((resolve, reject) => {
            if (!mediaRecorder) {
                reject(new Error('Media recorder not started'))
                return
            }

            if (mediaRecorder.state === 'inactive') {
                reject(new Error('Media recorder is not active'))
                return
            }

            mediaRecorder.onstop = () => {
                try {
                    if (audioChunks.length === 0) {
                        reject(new Error('No audio data recorded'))
                        return
                    }

                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
                    releaseMediaStream();
                    resolve(audioBlob)
                } catch (error) {
                    console.error('Error creating audio blob:', error);
                    releaseMediaStream();
                    reject(error);
                }
            }

            mediaRecorder.stop()
        })
    }

    function releaseMediaStream(): void {
        if (stream) {
            stream.getTracks().forEach((track) => {
                track.stop();
                console.log('Audio track stopped:', track.kind);
            })
            stream = null
        }
        mediaRecorder = null;
        audioChunks = [];
    }

    function isRecording(): boolean {
        return mediaRecorder !== null && mediaRecorder.state === 'recording'
    }

    function getRecordingState(): string {
        return mediaRecorder ? mediaRecorder.state : 'inactive';
    }

    // Helper function to get microphone devices
    async function getMicrophoneDevices(): Promise<MediaDeviceInfo[]> {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'audioinput');
        } catch (error) {
            console.error('Error getting microphone devices:', error);
            return [];
        }
    }

    // Helper function to test microphone with specific device
    async function testMicrophoneDevice(deviceId?: string): Promise<boolean> {
        try {
            const constraints: MediaStreamConstraints = {
                audio: deviceId ? { deviceId: { exact: deviceId } } : true
            };
            
            const testStream = await navigator.mediaDevices.getUserMedia(constraints);
            const audioTracks = testStream.getAudioTracks();
            const isWorking = audioTracks.length > 0 && 
                             audioTracks[0].enabled && 
                             audioTracks[0].readyState === 'live';
            
            testStream.getTracks().forEach(track => track.stop());
            return isWorking;
        } catch (error) {
            console.error('Error testing microphone device:', error);
            return false;
        }
    }

    return {
        startRecording,
        stopRecording,
        isRecording,
        getRecordingState,
        checkMicrophoneAvailability,
        getMicrophoneDevices,
        testMicrophoneDevice,
        releaseMediaStream
    }
}

export const audioRecorder = createAudioRecorder()