import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface AudioButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onPress: () => void;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  isRecording,
  isProcessing,
  onPress,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(isRecording ? 1.2 : 1),
        },
      ],
      opacity: withSpring(isProcessing ? 0.6 : 1),
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.buttonContainer, animatedStyle]}>
        <TouchableOpacity
          style={[
            styles.button,
            isRecording && styles.recording,
            isProcessing && styles.processing,
          ]}
          onPress={onPress}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>
            {isRecording ? '🎤 Ouvindo...' : isProcessing ? '⏳ Processando...' : '🎤 Falar'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
      {isRecording && (
        <Text style={styles.hintText}>
          Diga: "cima", "baixo", "esquerda", "direita", "pular" ou "comer"
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    minWidth: 200,
    alignItems: 'center',
  },
  recording: {
    backgroundColor: '#F44336',
  },
  processing: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hintText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
