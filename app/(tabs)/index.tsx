import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SkillItem } from '@/components/SkillItem';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { storage } from '@/utils/storage';
import { Skill } from '@/types';

export default function HomeScreen() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const loadSkills = useCallback(async () => {
    const loadedSkills = await storage.getSkills();
    const activeId = await storage.getActiveSkillId();
    setSkills(loadedSkills);
    setActiveSkillId(activeId);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSkills();
    }, [loadSkills])
  );

  const handleToggleSkill = async (skill: Skill, active: boolean) => {
    if (active) {
      // Deactivate all other skills first
      const updatedSkills = skills.map(s => ({
        ...s,
        isActive: false,
        startTime: undefined,
        lastActiveAt: undefined,
      }));
      
      // Activate this skill
      const targetSkill = {
        ...skill,
        isActive: true,
        startTime: Date.now(),
        lastActiveAt: new Date().toISOString(),
      };
      
      const finalSkills = updatedSkills.map(s => 
        s.id === skill.id ? targetSkill : s
      );
      
      await storage.saveSkills(finalSkills);
      await storage.setActiveSkillId(skill.id);
      setActiveSkillId(skill.id);
      setSkills(finalSkills);
      
      // Navigate to counting screen
      router.push(`/counting?skillId=${skill.id}`);
    } else {
      // Deactivate
      const updatedSkills = skills.map(s => ({
        ...s,
        isActive: s.id === skill.id ? false : s.isActive,
        startTime: undefined,
        lastActiveAt: undefined,
      }));
      
      await storage.saveSkills(updatedSkills);
      await storage.setActiveSkillId(null);
      setActiveSkillId(null);
      setSkills(updatedSkills);
    }
  };

  const handleDeletePress = (skill: Skill) => {
    setSkillToDelete(skill);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (skillToDelete) {
      await storage.deleteSkill(skillToDelete.id);
      if (activeSkillId === skillToDelete.id) {
        await storage.setActiveSkillId(null);
        setActiveSkillId(null);
      }
      await loadSkills();
      setDeleteModalVisible(false);
      setSkillToDelete(null);
    }
  };

  const handleAddSkill = () => {
    router.push('/addSkill');
  };

  const handleSkillPress = (skill: Skill) => {
    router.push(`/skillDetail?skillId=${skill.id}`);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSkills();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Skill }) => (
    <SkillItem
      skill={item}
      onPress={() => handleSkillPress(item)}
      onToggle={(active) => handleToggleSkill(item, active)}
      onDelete={() => handleDeletePress(item)}
      isActive={item.id === activeSkillId}
      canActivate={activeSkillId === null || item.id === activeSkillId}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="time-outline"
        size={64}
        color={isDark ? '#48484A' : '#C7C7CC'}
      />
      <ThemedText style={styles.emptyText}>No skills yet</ThemedText>
      <ThemedText style={styles.emptySubtext}>
        Tap the + button to add your first skill
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={skills}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={skills.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      
      <TouchableOpacity
        style={[styles.fab, isDark && styles.fabDark]}
        onPress={handleAddSkill}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      <DeleteConfirmModal
        visible={deleteModalVisible}
        skillTitle={skillToDelete?.title || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalVisible(false);
          setSkillToDelete(null);
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingVertical: 8,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    opacity: 0.6,
  },
  emptySubtext: {
    fontSize: 16,
    marginTop: 8,
    opacity: 0.5,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabDark: {
    shadowColor: '#FF9500',
  },
});
