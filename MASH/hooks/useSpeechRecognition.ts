import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

export interface UseSpeechRecognitionProps {
  onResult: (text: string) => void;
  onStateChange: (state: 'idle' | 'listening' | 'processing' | 'speaking') => void;
}

export function useSpeechRecognition({ onResult, onStateChange }: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API if on Web
    if (Platform.OS === 'web') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsListening(true);
          onStateChange('listening');
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          onStateChange('processing');
          setTimeout(() => {
            onResult(transcript);
            onStateChange('idle');
          }, 800);
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error', event);
          setError(event.error);
          setIsListening(false);
          onStateChange('idle');
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      } else {
        console.warn('Speech Recognition not supported in this browser.');
      }
    }
  }, [onResult, onStateChange]);

  const startListening = async () => {
    setError(null);

    if (Platform.OS === 'web') {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error(e);
        }
      } else {
        // Fallback for browsers that don't support SpeechRecognition
        simulateVoiceInput();
      }
    } else {
      // Mobile native fallback (simulate voice input since we don't have native Voice module linked)
      simulateVoiceInput();
    }
  };

  const stopListening = () => {
    if (Platform.OS === 'web' && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    onStateChange('idle');
  };

  // Helper to simulate voice input on emulators / unsupported environments
  const simulateVoiceInput = () => {
    setIsListening(true);
    onStateChange('listening');
    
    // Simulate speech-to-text after 3 seconds of "listening"
    setTimeout(() => {
      setIsListening(false);
      onStateChange('processing');
      
      const phrases = [
        "Book an appointment with Dr. Anita Desai",
        "Where is the pharmacy?",
        "Check my prescription status",
        "Reschedule my cardiology appointment",
        "Who is Dr. Anita Desai?"
      ];
      
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      
      setTimeout(() => {
        onResult(randomPhrase);
        onStateChange('idle');
      }, 1000);
    }, 2500);
  };

  return {
    isListening,
    error,
    startListening,
    stopListening,
    isSupported: Platform.OS === 'web' ? !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : false
  };
}
