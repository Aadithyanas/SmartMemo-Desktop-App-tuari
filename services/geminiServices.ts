import { GoogleGenerativeAI } from "@google/generative-ai"



const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function transcribeAudio(audioBlob: Blob, debug = false): Promise<string> {
    // Supported audio formats
    const SUPPORTED_FORMATS = [
        'audio/mpeg', 
        'audio/wav',
        'audio/webm',
        'audio/ogg',
        'audio/aac',
        'audio/mp4'
    ];

    // Maximum file size (10MB) before chunking
    const MAX_FILE_SIZE = 10 * 1024 * 1024; 
    // Minimum audio duration to consider for chunking (2 minutes)
    const CHUNKING_THRESHOLD_MS = 120000;

    // Helper function to convert blob to base64
    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                const base64Data = result.split(',')[1];
                if (!base64Data) {
                    reject(new Error('Base64 conversion failed'));
                    return;
                }
                resolve(base64Data);
            };
            reader.onerror = () => reject(new Error('FileReader error'));
            reader.readAsDataURL(blob);
        });
    };

    // Function to estimate audio duration
    const estimateDuration = async (blob: Blob): Promise<number> => {
        return new Promise((resolve) => {
            try {
                const audio = new Audio();
                audio.src = URL.createObjectURL(blob);
                audio.onloadedmetadata = () => {
                    resolve(audio.duration * 1000); // Return in ms
                    URL.revokeObjectURL(audio.src);
                };
                audio.onerror = () => resolve(0);
            } catch {
                resolve(0);
            }
        });
    };

    // Function to split audio into chunks
    const splitAudio = async (blob: Blob): Promise<Blob[]> => {
        if (debug) console.log('Preparing to split large audio file...');
        
        const duration = await estimateDuration(blob);
        if (duration < CHUNKING_THRESHOLD_MS) {
            return [blob]; // No need to chunk
        }

        const chunkCount = Math.ceil(duration / CHUNKING_THRESHOLD_MS);
        const chunkSize = Math.ceil(blob.size / chunkCount);
        const chunks: Blob[] = [];

        for (let i = 0; i < chunkCount; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, blob.size);
            chunks.push(blob.slice(start, end));
        }

        if (debug) console.log(`Split audio into ${chunks.length} chunks`);
        return chunks;
    };

    // Process a single audio chunk
    const processChunk = async (chunk: Blob, chunkIndex: number): Promise<string> => {
        if (debug) console.log(`Processing chunk ${chunkIndex + 1}`);
        
        const base64Audio = await blobToBase64(chunk);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4096
            }
        });

        const prompt = `
        TRANSCRIPTION INSTRUCTIONS (CHUNK ${chunkIndex + 1}):
        1. Transcribe all speech verbatim
        2. Include filler words (um, uh), repetitions
        3. Mark unclear parts with [?]
        4. Return raw text only, no formatting
        5. Never summarize or omit content
        6. This is PART of a larger recording
        `;

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Audio,
                    mimeType: audioBlob.type,
                },
            },
            prompt,
        ]);

        return result.response.text();
    };

    // Enhanced error handling wrapper
    const executeTranscription = async (): Promise<string> => {
        try {
            // Validate input
            if (!audioBlob || audioBlob.size === 0) {
                throw new Error('No audio data provided');
            }

            // Validate format
            if (!SUPPORTED_FORMATS.includes(audioBlob.type)) {
                throw new Error(`Unsupported audio format: ${audioBlob.type}. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`);
            }

            if (debug) {
                console.log('Audio Blob Info:', {
                    size: `${(audioBlob.size / (1024 * 1024)).toFixed(2)} MB`,
                    type: audioBlob.type,
                    duration: `${(await estimateDuration(audioBlob) / 1000).toFixed(2)}s`
                });
            }

          
            
           

            // Handle large files
            if (audioBlob.size > MAX_FILE_SIZE) {
                if (debug) console.log('Large file detected, splitting into chunks...');
                
                const chunks = await splitAudio(audioBlob);
                const transcriptions = await Promise.all(
                    chunks.map((chunk, index) => processChunk(chunk, index))
                );
                
                const fullTranscription = transcriptions.join('\n[CHUNK BREAK]\n');
                
                if (debug) {
                    const wordCount = fullTranscription.split(/\s+/).length;
                    console.log(`Completed large file transcription: ${wordCount} words across ${chunks.length} chunks`);
                }
                
                return fullTranscription;
            }

            // Standard processing for smaller files
            const base64Audio = await blobToBase64(audioBlob);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.0-flash",
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 4096
                }
            });

            const prompt = `
            TRANSCRIPTION INSTRUCTIONS:
            1. Transcribe all speech verbatim
            2. Include filler words (um, uh), repetitions
            3. Mark unclear parts with [?]
            4. Return raw text only, no formatting
            5. Never summarize or omit content
            `;

            const result = await model.generateContent([
                {
                    inlineData: {
                        data: base64Audio,
                        mimeType: audioBlob.type,
                    },
                },
                prompt,
            ]);

            const transcription = result.response.text();

            if (debug) {
                const wordCount = transcription.split(/\s+/).length;
                console.log(`Transcribed ${wordCount} words`);
            }

            return transcription;

        } catch (error) {
            console.error('Transcription error:', error);
            
            // Handle specific error cases
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            if (errorMessage.includes('too short') || errorMessage.includes('no speech')) {
                if (debug) console.log('Attempting fallback for short audio...');
                return transcribeShortAudioFallback(audioBlob);
            }
            
            if (errorMessage.includes('file size')) {
                throw new Error('Audio file too large. Maximum size is 25MB');
            }
            
            throw new Error(`Transcription failed: ${errorMessage}`);
        }
    };

    // Special fallback for short/problematic audio
    const transcribeShortAudioFallback = async (blob: Blob): Promise<string> => {
        const base64Audio = await blobToBase64(blob);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const emergencyPrompt = `
        CRITICAL INSTRUCTIONS:
        - This is a SHORT audio clip (1-15 seconds)
        - Return EVERY detected sound
        - Include even partial words
        - Mark uncertain parts with [?]
        - DO NOT filter anything
        - Context: This is a fallback for problematic audio
        `;

        const result = await model.generateContent([
            { inlineData: { data: base64Audio, mimeType: blob.type } },
            emergencyPrompt
        ]);

        const transcription = result.response.text();
        
        if (transcription.trim().length === 0) {
            throw new Error('Audio may be silent or too unclear');
        }

        return transcription;
    };

    return executeTranscription();
}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  try {
    

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const result = await model.generateContent([
      `Translate the following text to ${targetLanguage}. Return only the translated text without any additional formatting or explanations:\n\n${text}`,
    ])

    return result.response.text()
  } catch (error) {
    console.error("Translation error:", error)
    throw new Error("Failed to translate text")
  }
}

export async function summarizeText(text: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const result = await model.generateContent([
      `Provide a concise summary of the following text. Keep it brief and capture the main points:\n\n${text}`,
    ])

    return result.response.text()
  } catch (error) {
    console.error("Summarization error:", error)
    throw new Error("Failed to summarize text")
  }
}

export async function generateMemoName(transcription: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const result = await model.generateContent([
      `Generate a short, descriptive title (2-4 words) for this voice memo based on its content. Return only the title:\n\n${transcription}`,
    ])

    return result.response.text().trim()
  } catch (error) {
    console.error("Name generation error:", error)
    return "Voice Memo"
  }
}