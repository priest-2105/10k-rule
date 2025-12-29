import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { storage } from '@/utils/storage';
import { Skill } from '@/types';

export default function AddSkillScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ skillId?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isEdit = !!params.skillId;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [motivation, setMotivation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit && params.skillId) {
      loadSkill();
    }
  }, [isEdit, params.skillId]);

  const loadSkill = async () => {
    if (!params.skillId) return;
    const skill = await storage.getSkill(params.skillId);
    if (skill) {
      setTitle(skill.title);
      setCategory(skill.category);
      setMotivation(skill.motivation || '');
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !category.trim()) {
      return;
    }

    setLoading(true);
    try {
      const skillData: Skill = isEdit && params.skillId
        ? {
            ...(await storage.getSkill(params.skillId))!,
            title: title.trim(),
            category: category.trim(),
            motivation: motivation.trim() || undefined,
          }
        : {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title: title.trim(),
            category: category.trim(),
            motivation: motivation.trim() || undefined,
            createdAt: new Date().toISOString(),
            totalMinutes: 0,
            dailyLogs: [],
          };

      await storage.saveSkill(skillData);
      router.back();
    } catch (error) {
      console.error('Error saving skill:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.container}>
        <View style={[styles.header, isDark && styles.headerDark]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
            <ThemedText style={styles.cancelText}>Cancel</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>
            {isEdit ? 'Edit Skill' : 'New Skill'}
          </ThemedText>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!title.trim() || !category.trim() || loading}
            style={styles.saveButton}
          >
            <ThemedText
              style={[
                styles.saveText,
                (!title.trim() || !category.trim() || loading) && styles.saveTextDisabled,
              ]}
            >
              {isEdit ? 'Save' : 'Add'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <ThemedText style={styles.label}>Title *</ThemedText>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Piano, Spanish, Coding"
              placeholderTextColor={isDark ? '#636366' : '#8E8E93'}
              autoFocus
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Category *</ThemedText>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={category}
              onChangeText={setCategory}
              placeholder="e.g., Music, Language, Technology"
              placeholderTextColor={isDark ? '#636366' : '#8E8E93'}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Motivation (Optional)</ThemedText>
            <TextInput
              style={[styles.textArea, isDark && styles.inputDark]}
              value={motivation}
              onChangeText={setMotivation}
              placeholder="Why do you want to master this skill?"
              placeholderTextColor={isDark ? '#636366' : '#8E8E93'}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  headerDark: {
    borderBottomColor: '#38383A',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  saveButton: {
    padding: 8,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FF9500',
  },
  saveTextDisabled: {
    opacity: 0.3,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 17,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    color: '#000000',
  },
  inputDark: {
    backgroundColor: '#2C2C2E',
    color: '#FFFFFF',
  },
  textArea: {
    fontSize: 17,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    color: '#000000',
    minHeight: 100,
  },
});

