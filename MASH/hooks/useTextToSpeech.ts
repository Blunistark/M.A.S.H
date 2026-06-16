import { useState } from 'react';
import { Platform } from 'react-native';

export function useTextToSpeech(onStateChange: (state: 'idle' | 'listening' | 'processing' | 'speaking') => void) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = async (text: string) => {
    try {
      setIsSpeaking(true);
      onStateChange('speaking');

      if (Platform.OS === 'web') {
        // Use Web Speech Synthesis API
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel(); // Cancel any ongoing speech
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = () => {
            setIsSpeaking(false);
            onStateChange('idle');
          };
          utterance.onerror = () => {
            setIsSpeaking(false);
            onStateChange('idle');
          };
          window.speechSynthesis.speak(utterance);
        } else {
          console.warn('Web Speech Synthesis not supported');
          setIsSpeaking(false);
          onStateChange('idle');
        }
      } else {
        // Dynamic import of expo-speech to prevent errors if not installed yet
        try {
          const Speech = require('expo-speech');
          await Speech.stop();
          Speech.speak(text, {
            onStart: () => {
              setIsSpeaking(true);
              onStateChange('speaking');
            },
            onDone: () => {
              setIsSpeaking(false);
              onStateChange('idle');
            },
            onError: (err: any) => {
              console.error('TTS error', err);
              setIsSpeaking(false);
              onStateChange('idle');
            }
          });
        } catch (e) {
          console.warn('expo-speech not available on this platform/device, simulating speech duration:', e);
          // Simulate speech duration
          const words = text.split(' ').length;
          const duration = Math.max(1000, words * 300); // 300ms per word
          setTimeout(() => {
            setIsSpeaking(false);
            onStateChange('idle');
          }, duration);
        }
      }
    } catch (err) {
      console.error('Failed to speak:', err);
      setIsSpeaking(false);
      onStateChange('idle');
    }
  };

  const stop = async () => {
    if (Platform.OS === 'web') {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      try {
        const Speech = require('expo-speech');
        await Speech.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsSpeaking(false);
    onStateChange('idle');
  };

  return {
    speak,
    stop,
    isSpeaking
  };
}
