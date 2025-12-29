import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, differenceInDays } from 'date-fns';
import ConfettiCannon from 'react-native-confetti-cannon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProgressCircle } from '@/components/ProgressCircle';
import { DailyChart } from '@/components/DailyChart';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { storage } from '@/utils/storage';
import { Skill } from '@/types';

export default function SkillDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ skillId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [skill, setSkill] = useState<Skill | null>(null);
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSkill();
      loadActiveSkill();
    }, [params.skillId])
  );

  const loadSkill = async () => {
    if (!params.skillId) return;
    const loadedSkill = await storage.getSkill(params.skillId);
    if (loadedSkill) {
      setSkill(loadedSkill);
      
      // Check if just reached 10,000 minutes for the first time
      if (loadedSkill.totalMinutes >= 10000 && !loadedSkill.hasShownConfetti) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        // Mark confetti as shown
        const updatedSkill = { ...loadedSkill, hasShownConfetti: true };
        await storage.saveSkill(updatedSkill);
        setSkill(updatedSkill);
      }
    }
  };

  const loadActiveSkill = async () => {
    const activeId = await storage.getActiveSkillId();
    setActiveSkillId(activeId);
  };

  const stats = useMemo(() => {
    if (!skill) return null;

    // Calculate days including today (add 1 to include the creation day)
    const daysSinceCreated = Math.max(1, differenceInDays(new Date(), new Date(skill.createdAt)) + 1);
    const averageDaily = skill.totalMinutes / daysSinceCreated;

    const totalDays = skill.dailyLogs.length;
    const totalMinutes = skill.totalMinutes;
    const isMastered = totalMinutes >= 10000;

    return {
      daysSinceCreated,
      averageDaily: Math.round(averageDaily * 10) / 10,
      totalDays,
      totalMinutes,
      isMastered,
    };
  }, [skill]);

  const handleStartCounting = () => {
    if (!skill) return;
    router.push(`/counting?skillId=${skill.id}`);
  };

  const handleEdit = () => {
    if (!skill) return;
    router.push(`/addSkill?skillId=${skill.id}`);
  };

  const handleDelete = () => {
    if (!skill) return;
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!skill) return;
    await storage.deleteSkill(skill.id);
    if (activeSkillId === skill.id) {
      await storage.setActiveSkillId(null);
    }
    setDeleteModalVisible(false);
    router.back();
  };

  if (!skill || !stats) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  const progress = Math.min(skill.totalMinutes / 10000, 1);
  const canStart = activeSkillId === null || activeSkillId === skill.id;
  const isActive = activeSkillId === skill.id || skill.isActive;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ThemedView style={styles.container}>
        {showConfetti && (
          <ConfettiCannon
            count={200}
            origin={{ x: 0, y: 0 }}
            fadeOut
          />
        )}
        
        <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Skill Details</ThemedText>
        <View style={styles.headerPlaceholder} />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.progressSection}>
          <ProgressCircle
            progress={progress}
            totalMinutes={skill.totalMinutes}
            size={180}
            color={stats.isMastered ? '#34C759' : '#FF9500'}
          />
          {stats.isMastered && (
            <View style={styles.masteredBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#34C759" />
              <ThemedText style={styles.masteredText}>Mastered!</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <ThemedText style={styles.title}>{skill.title}</ThemedText>
          <ThemedText style={styles.category}>{skill.category}</ThemedText>
          
          {skill.motivation && (
            <View style={styles.motivationContainer}>
              <ThemedText style={styles.motivation}>{skill.motivation}</ThemedText>
            </View>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Created</ThemedText>
              <ThemedText style={styles.statValue}>
                {format(new Date(skill.createdAt), 'MMM d, yyyy')}
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Days Active</ThemedText>
              <ThemedText style={styles.statValue}>{stats.totalDays}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Avg Daily</ThemedText>
              <ThemedText style={styles.statValue}>{stats.averageDaily} min</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.chartSection}>
          <ThemedText style={styles.sectionTitle}>Practice History</ThemedText>
          <DailyChart dailyLogs={skill.dailyLogs} />
        </View>
      </ScrollView>

      <ThemedView style={[styles.actions, isDark && styles.actionsDark]}>
        <TouchableOpacity
          style={[styles.actionButton, styles.startButton, !canStart && styles.buttonDisabled]}
          onPress={handleStartCounting}
          disabled={!canStart}
          activeOpacity={0.8}
        >
          <Ionicons name="play" size={20} color="#FFFFFF" />
          <ThemedText style={styles.startButtonText}>
            {isActive ? 'Continue Counting' : 'Start Counting'}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleEdit}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color="#FF9500" />
            <ThemedText style={styles.secondaryButtonText}>Edit</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <ThemedText style={[styles.secondaryButtonText, { color: '#FF3B30' }]}>
              Delete
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

        <DeleteConfirmModal
          visible={deleteModalVisible}
          skillTitle={skill.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModalVisible(false)}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  headerDark: {
    borderBottomColor: '#38383A',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  progressSection: {
    alignItems: 'center',
    marginVertical: 32,
  },
  masteredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  masteredText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34C759',
  },
  infoSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  category: {
    fontSize: 16,
    opacity: 0.6,
    marginBottom: 16,
  },
  motivationContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  motivation: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  chartSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  actionsDark: {
    borderTopColor: '#38383A',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 8,
  },
  startButton: {
    // Same as actionButton
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#FF9500',
  },
});

