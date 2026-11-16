import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface GameGridProps {
  rabbitPosition: { x: number; y: number };
  gridSize: number;
}

const { width } = Dimensions.get('window');
const CELL_SIZE = (width - 40) / 10; // 10x10 grid with padding

export const GameGrid: React.FC<GameGridProps> = ({ rabbitPosition, gridSize }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(rabbitPosition.x * CELL_SIZE),
        },
        {
          translateY: withSpring(rabbitPosition.y * CELL_SIZE),
        },
      ],
    };
  });

  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        cells.push(
          <View
            key={`${x}-${y}`}
            style={[
              styles.cell,
              { left: x * CELL_SIZE, top: y * CELL_SIZE },
            ]}
          />
        );
      }
    }
    return cells;
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>{renderGrid()}</View>
      <Animated.View style={[styles.rabbit, animatedStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    height: width - 40,
    margin: 20,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#81C784',
  },
  grid: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cell: {
    position: 'absolute',
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
    backgroundColor: '#C8E6C9',
    borderRadius: 4,
  },
  rabbit: {
    position: 'absolute',
    width: CELL_SIZE - 4,
    height: CELL_SIZE - 4,
    backgroundColor: '#FFB74D',
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FF9800',
  },
});
