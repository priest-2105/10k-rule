import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { storage } from '@/utils/storage';
import { Skill, DailyLog } from '@/types';

export default function CountingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ skillId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [skill, setSkill] = useState<Skill | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [unsavedSessionSeconds, setUnsavedSessionSeconds] = useState(0); // Track unsaved seconds in current session
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [backgroundTime, setBackgroundTime] = useState<number | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);

  // Animated style must be called at top level
  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  useEffect(() => {
    loadSkill();
    setupAppStateListener();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [params.skillId]);

  useEffect(() => {
    if (skill && skill.isActive && !isPaused) {
      startTimer();
      // Start pulsing animation
      pulseScale.value = withRepeat(
        withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      stopTimer();
      // Stop pulsing animation
      pulseScale.value = withTiming(1, { duration: 300 });
      pulseOpacity.value = withTiming(0.1, { duration: 300 });
    }

    return () => {
      stopTimer();
    };
  }, [skill, isPaused]);

  const loadSkill = async () => {
    if (!params.skillId) return;
    const loadedSkill = await storage.getSkill(params.skillId);
    if (loadedSkill) {
      setSkill(loadedSkill);
      
      // Resume from where we left off if skill was active
      if (loadedSkill.isActive && loadedSkill.startTime) {
        const now = Date.now();
        const elapsed = Math.floor((now - loadedSkill.startTime) / 1000);
        setElapsedSeconds(elapsed);
        setUnsavedSessionSeconds(0); // Reset unsaved when starting fresh
        setSessionStartTime(loadedSkill.startTime);
        setIsPaused(false);
      } else {
        setElapsedSeconds(0);
        setUnsavedSessionSeconds(0);
        setSessionStartTime(null);
        setIsPaused(true);
      }
    }
  };

  const setupAppStateListener = () => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground
        if (skill && skill.isActive && skill.startTime && !isPaused) {
          const now = Date.now();
          const elapsed = Math.floor((now - skill.startTime) / 1000);
          setElapsedSeconds(elapsed);
          // Don't reset unsavedSessionSeconds - it should persist
        }
      } else if (
        appStateRef.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App went to background
        if (skill && skill.isActive && !isPaused) {
          setBackgroundTime(Date.now());
          // Save current elapsed to unsaved when going to background
          setUnsavedSessionSeconds(prev => prev + elapsedSeconds);
          setElapsedSeconds(0);
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  };

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handlePauseResume = async () => {
    if (!skill) return;

    if (isPaused) {
      // Resume - continue from where we paused
      const now = Date.now();
      // Start fresh timer, but keep unsavedSessionSeconds for display
      const newStartTime = now;
      setSessionStartTime(newStartTime);
      // elapsedSeconds will start from 0, but unsavedSessionSeconds is preserved
      
      const updatedSkill = {
        ...skill,
        isActive: true,
        startTime: newStartTime,
        lastActiveAt: new Date().toISOString(),
      };
      
      await storage.saveSkill(updatedSkill);
      setSkill(updatedSkill);
      setIsPaused(false);
    } else {
      // Pause - save current elapsed to unsavedSessionSeconds
      stopTimer();
      setUnsavedSessionSeconds(prev => prev + elapsedSeconds);
      setElapsedSeconds(0); // Reset elapsed for next resume
      setIsPaused(true);
      
      const updatedSkill = {
        ...skill,
        startTime: undefined,
      };
      
      await storage.saveSkill(updatedSkill);
      setSkill(updatedSkill);
    }
  };

  const handleStop = async () => {
    if (!skill) return;

    stopTimer();
    
    // Calculate total seconds from this session (unsaved + current elapsed)
    const totalSessionSeconds = unsavedSessionSeconds + elapsedSeconds;
    
    // Calculate minutes to add (use floor to be accurate, but ensure at least 1 minute if any time elapsed)
    const minutesToAdd = totalSessionSeconds >= 60 
      ? Math.floor(totalSessionSeconds / 60) 
      : totalSessionSeconds > 0 
        ? 1 
        : 0;
    
    if (minutesToAdd > 0) {
      // Update skill with new minutes
      const today = format(new Date(), 'yyyy-MM-dd');
      const existingLogIndex = skill.dailyLogs.findIndex(log => log.date === today);
      
      let updatedLogs: DailyLog[];
      if (existingLogIndex >= 0) {
        updatedLogs = [...skill.dailyLogs];
        updatedLogs[existingLogIndex] = {
          ...updatedLogs[existingLogIndex],
          minutes: updatedLogs[existingLogIndex].minutes + minutesToAdd,
        };
      } else {
        updatedLogs = [
          ...skill.dailyLogs,
          { date: today, minutes: minutesToAdd },
        ];
      }

      const updatedSkill: Skill = {
        ...skill,
        totalMinutes: skill.totalMinutes + minutesToAdd,
        dailyLogs: updatedLogs,
        isActive: false,
        startTime: undefined,
        lastActiveAt: undefined,
      };

      await storage.saveSkill(updatedSkill);
      await storage.setActiveSkillId(null);
    }

    // Reset session tracking
    setUnsavedSessionSeconds(0);
    setElapsedSeconds(0);

    // Navigate back
    router.back();
  };

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Display total: saved minutes + unsaved session seconds + current elapsed seconds
  const totalDisplaySeconds = skill
    ? Math.floor(skill.totalMinutes * 60) + unsavedSessionSeconds + elapsedSeconds
    : unsavedSessionSeconds + elapsedSeconds;

  if (!skill) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { zIndex: 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        <ThemedText style={styles.skillName}>{skill.title}</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.timerContainer}>
        <Animated.View
          style={[
            styles.pulseCircle,
            animatedPulseStyle,
            isPaused && styles.pulseCirclePaused,
            { zIndex: 0 },
          ]}
        />
        <ThemedText style={[styles.timerText, { zIndex: 1 }]}>
          {formatTime(totalDisplaySeconds)}
        </ThemedText>
        <ThemedText style={[styles.sessionTime, { zIndex: 1 }]}>
          +{formatTime(unsavedSessionSeconds + elapsedSeconds)} this session
        </ThemedText>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.pauseButton]}
          onPress={handlePauseResume}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isPaused ? 'play' : 'pause'}
            size={32}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.stopButton]}
          onPress={handleStop}
          activeOpacity={0.8}
        >
          <Ionicons name="stop" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  skillName: {
    fontSize: 17,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 80,
  },
  pulseCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    borderColor: '#FF9500',
    opacity: 0.3,
  },
  pulseCirclePaused: {
    opacity: 0.1,
  },
  timerText: {
    fontSize: 72,
    fontWeight: '300',
    fontFamily: 'System',
    letterSpacing: -2,
    marginVertical: 20,
  },
  sessionTime: {
    fontSize: 16,
    opacity: 0.6,
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 40,
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: '#FF9500',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
});

