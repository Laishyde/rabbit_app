import { useState, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  reset: () => void;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to record audio denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);

      // Auto-stop after 3 seconds
      setTimeout(async () => {
        if (isRecording) {
          await stopRecording();
        }
      }, 3000);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [isRecording]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!recordingRef.current) return null;

    setIsProcessing(true);
    setIsRecording(false);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsProcessing(false);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsProcessing(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setIsRecording(false);
    setIsProcessing(false);
    recordingRef.current = null;
  }, []);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    reset,
  };
};
