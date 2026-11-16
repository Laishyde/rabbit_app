import { useState, useCallback } from 'react';
import * as Speech from 'expo-speech';

interface UseSpeechReturn {
  speak: (text: string) => Promise<void>;
  isSpeaking: boolean;
}

export const useSpeech = (): UseSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true);
      await Speech.speak(text, {
        language: 'pt-BR',
        pitch: 1.0,
        rate: 0.9,
      });
    } catch (error) {
      console.error('Speech error:', error);
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  return { speak, isSpeaking };
};
