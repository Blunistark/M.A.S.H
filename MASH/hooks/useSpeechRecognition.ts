import { useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { GEMINI_API_KEY, GEMINI_API_URL } from '../services/whisperConfig';

export interface UseSpeechRecognitionProps {
  onResult: (text: string) => void;
  onStateChange: (state: 'idle' | 'listening' | 'processing' | 'speaking') => void;
}

/**
 * Reads a local file URI as a base64 string.
 * Uses expo-file-system on mobile and fetch+FileReader on web.
 */
async function readFileAsBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // result is "data:audio/...;base64,XXXXX" — strip the prefix
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
    // Mobile: use expo-file-system
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
}

export function useSpeechRecognition({ onResult, onStateChange }: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  /**
   * Begin recording audio from the microphone.
   */
  const startListening = useCallback(async () => {
    setError(null);

    try {
      // Request microphone permission
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Microphone permission not granted');
        console.warn('useSpeechRecognition: Microphone permission denied');
        return;
      }

      // Configure audio session for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start a new recording
      const { recording } = await Audio.Recording.createAsync(
        {
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {},
        }
      );

      recordingRef.current = recording;
      setIsListening(true);
      onStateChange('listening');
    } catch (err: any) {
      console.error('useSpeechRecognition: Failed to start recording', err);
      setError(err.message || 'Failed to start recording');
      onStateChange('idle');
    }
  }, [onStateChange]);

  /**
   * Stop recording and send the audio to the Gemini API for transcription.
   */
  const stopListening = useCallback(async () => {
    setIsListening(false);

    if (!recordingRef.current) {
      onStateChange('idle');
      return;
    }

    // Transition to processing while we call the API
    onStateChange('processing');

    try {
      // Stop and unload the recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      // Reset audio mode so playback works again
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (!uri) {
        throw new Error('No audio file URI returned from recording');
      }

      // Read the audio file as base64
      const audioBase64 = await readFileAsBase64(uri);

      // Build the Gemini API request with audio as inline_data
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: 'Transcribe the following audio exactly as spoken. Return ONLY the transcribed text with no extra commentary, labels, or formatting.',
              },
              {
                inline_data: {
                  mime_type: 'audio/mp4',
                  data: audioBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 1024,
        },
      };

      // Call the Gemini API
      const apiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!apiResponse.ok) {
        const errBody = await apiResponse.text();
        throw new Error(`Gemini API error (${apiResponse.status}): ${errBody}`);
      }

      const result = await apiResponse.json();

      // Extract transcription from Gemini response
      const transcript = (
        result?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      ).trim();

      if (transcript.length === 0) {
        console.warn('useSpeechRecognition: Gemini returned empty transcription');
        setError('Could not recognise any speech. Please try again.');
        onStateChange('idle');
        return;
      }

      // Deliver the transcribed text
      onResult(transcript);
    } catch (err: any) {
      console.error('useSpeechRecognition: Transcription failed', err);
      setError(err.message || 'Transcription failed');
      onStateChange('idle');
    }
  }, [onResult, onStateChange]);

  return {
    isListening,
    error,
    startListening,
    stopListening,
    isSupported: true, // Gemini STT works on all platforms
  };
}
