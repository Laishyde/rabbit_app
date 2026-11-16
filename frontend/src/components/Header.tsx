import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HeaderProps {
  rabbitAge: number;
  rabbitEnergy: number;
  carrotsCollected: number;
}

export const Header: React.FC<HeaderProps> = ({
  rabbitAge,
  rabbitEnergy,
  carrotsCollected,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.statRow}>
        <Text style={styles.label}>Idade:</Text>
        <Text style={styles.value}>{rabbitAge} turnos</Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.label}>Energia:</Text>
        <View style={styles.energyBar}>
          <View
            style={[
              styles.energyFill,
              { width: `${rabbitEnergy}%` },
              rabbitEnergy < 30 && styles.lowEnergy,
            ]}
          />
        </View>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.label}>Cenouras:</Text>
        <Text style={styles.value}>{carrotsCollected}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    borderWidth: 2,
    borderColor: '#FFB74D',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D4037',
    marginRight: 8,
    minWidth: 70,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
  },
  energyBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#FFE0B2',
    borderRadius: 6,
    overflow: 'hidden',
  },
  energyFill: {
    height: '100%',
    backgroundColor: '#66BB6A',
    borderRadius: 6,
  },
  lowEnergy: {
    backgroundColor: '#EF5350',
  },
});
