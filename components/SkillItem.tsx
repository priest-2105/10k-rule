import React from 'react';
import { View, StyleSheet, TouchableOpacity, Switch, useColorScheme } from 'react-native';
import { ThemedText } from './themed-text';
import { ProgressCircle } from './ProgressCircle';
import { Skill } from '@/types';

interface SkillItemProps {
  skill: Skill;
  onPress: () => void;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
  isActive: boolean;
  canActivate: boolean;
}

export function SkillItem({
  skill,
  onPress,
  onToggle,
  onDelete,
  isActive,
  canActivate,
}: SkillItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const progress = Math.min(skill.totalMinutes / 10000, 1);
  const isMastered = skill.totalMinutes >= 10000;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isDark && styles.containerDark,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <ProgressCircle
            progress={progress}
            totalMinutes={skill.totalMinutes}
            size={50}
            showLabel={false}
            color={isMastered ? '#34C759' : '#FF9500'}
          />
        </View>
        
        <View style={styles.middleSection}>
          <ThemedText style={styles.title}>{skill.title}</ThemedText>
          <ThemedText style={styles.category}>{skill.category}</ThemedText>
          <ThemedText style={styles.progress}>
            {Math.round(skill.totalMinutes)} / 10,000 min
          </ThemedText>
        </View>

        <View style={styles.rightSection}>
          <Switch
            value={isActive}
            onValueChange={onToggle}
            disabled={!canActivate && !isActive}
            trackColor={{ false: isDark ? '#2C2C2E' : '#E5E5EA', true: '#FF9500' }}
            thumbColor={isActive ? '#FFFFFF' : '#FFFFFF'}
            ios_backgroundColor={isDark ? '#2C2C2E' : '#E5E5EA'}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
  },
  containerDark: {
    backgroundColor: '#1C1C1E',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSection: {
    marginRight: 12,
  },
  middleSection: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  category: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 4,
  },
  progress: {
    fontSize: 13,
    opacity: 0.8,
  },
  rightSection: {
    marginLeft: 12,
  },
});

