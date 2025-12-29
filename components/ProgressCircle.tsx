import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import * as Progress from 'react-native-progress';
import { ThemedText } from './themed-text';

interface ProgressCircleProps {
  progress: number; // 0 to 1
  totalMinutes: number;
  size?: number;
  showLabel?: boolean;
  color?: string;
}

export function ProgressCircle({
  progress,
  totalMinutes,
  size = 120,
  showLabel = true,
  color = '#FF9500',
}: ProgressCircleProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isComplete = progress >= 1;

  return (
    <View style={styles.container}>
      <Progress.Circle
        progress={progress}
        size={size}
        thickness={8}
        color={isComplete ? '#34C759' : color}
        unfilledColor={isDark ? '#2C2C2E' : '#E5E5EA'}
        borderWidth={0}
        showsText={false}
        animated
      />
      {showLabel && (
        <View style={[styles.labelContainer, { width: size, height: size }]}>
          <ThemedText style={[styles.label, { fontSize: size * 0.15 }]}>
            {Math.round(totalMinutes)}
          </ThemedText>
          <ThemedText style={[styles.sublabel, { fontSize: size * 0.08 }]}>
            / 10,000
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
  sublabel: {
    opacity: 0.6,
    textAlign: 'center',
  },
});

