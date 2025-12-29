import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { storage } from './storage';
import { Skill } from '@/types';
import { format } from 'date-fns';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const notificationService = {
  // Request permissions
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('counting', {
        name: 'Practice Counting',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF9500',
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  // Start showing ongoing notification for counting
  async startCountingNotification(skill: Skill): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.warn('Notification permissions not granted');
      return null;
    }

    // Cancel any existing notification
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule a repeating notification that updates
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Counting: ${skill.title}`,
        body: 'Practice session in progress...',
        data: { skillId: skill.id },
        sticky: true, // Android: make it ongoing
      },
      trigger: null, // Show immediately and keep showing
      identifier: 'counting-session',
    });

    // Update notification periodically
    this.updateCountingNotification(skill);

    return notificationId;
  },

  // Update the counting notification with current time
  async updateCountingNotification(skill: Skill): Promise<void> {
    if (!skill.isActive || !skill.startTime) return;

    const now = Date.now();
    const elapsedSeconds = Math.floor((now - skill.startTime) / 1000);
    const totalSeconds = skill.totalMinutes * 60 + elapsedSeconds;
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Counting: ${skill.title}`,
          body: `Total: ${timeString} | Session: ${formatTime(elapsedSeconds)}`,
          data: { skillId: skill.id },
          sticky: true,
        },
        trigger: null,
        identifier: 'counting-session',
      });
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  },

  // Stop the counting notification
  async stopCountingNotification(): Promise<void> {
    await Notifications.cancelNotificationAsync('counting-session');
    await Notifications.dismissNotificationAsync('counting-session');
  },
};

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

