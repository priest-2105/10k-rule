import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import * as Progress from 'react-native-progress';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface DeleteConfirmModalProps {
  visible: boolean;
  skillTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const HOLD_DURATION = 120; // 2 minutes in seconds

export function DeleteConfirmModal({
  visible,
  skillTitle,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (visible) {
      setProgress(0);
      setIsHolding(false);
      // Stop any running countdown when modal opens
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
    }
  }, [visible]);

  const handleDeleteClick = () => {
    // If already counting, do nothing (or could restart)
    if (intervalRef.current) {
      return;
    }

    setIsHolding(true);
    startTimeRef.current = Date.now();
    
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const newProgress = Math.min(elapsed / HOLD_DURATION, 1);
        setProgress(newProgress);
        
        if (newProgress >= 1) {
          handleComplete();
        }
      }
    }, 50);
  };

  const handleCancel = () => {
    // Stop countdown if running
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsHolding(false);
    startTimeRef.current = null;
    setProgress(0);
    // Close modal
    onCancel();
  };

  const handleComplete = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    onConfirm();
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <ThemedView style={[styles.modal, isDark && styles.modalDark]}>
          <ThemedText style={styles.title}>Delete Skill?</ThemedText>
          <ThemedText style={styles.subtitle}>{skillTitle}</ThemedText>
          
          <View style={styles.progressContainer}>
            <Progress.Circle
              progress={progress}
              size={200}
              thickness={12}
              color="#FF3B30"
              unfilledColor={isDark ? '#2C2C2E' : '#E5E5EA'}
              borderWidth={0}
              showsText={false}
              animated
            />
            <View style={styles.progressLabel}>
              <ThemedText style={styles.progressText}>
                {isHolding ? 'Deleting...' : 'Click Delete to start countdown'}
              </ThemedText>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.deleteButton, isHolding && styles.deleteButtonActive]}
            onPress={handleDeleteClick}
            activeOpacity={0.8}
            disabled={isHolding}
          >
            <ThemedText style={styles.deleteButtonText}>
              {isHolding ? 'Deleting...' : 'Delete'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalDark: {
    backgroundColor: '#1C1C1E',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
    marginBottom: 32,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  progressLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButtonActive: {
    opacity: 0.8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
});

