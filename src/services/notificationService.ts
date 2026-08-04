// Push Notification Service for HandyGo Handyman Mobile App

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveProjectId(): string | undefined {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (projectId && UUID_RE.test(projectId)) {
    return projectId;
  }
  return undefined;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  /**
   * Register for push notifications and return the Expo push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    try {
      const projectId = resolveProjectId();
      const tokenData = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();
      console.log('Push token:', tokenData.data);
      return tokenData.data;
    } catch (e) {
      console.error('Failed to get push token:', e);
      return null;
    }
  },

  /**
   * Set up Android notification channel
   */
  async setupAndroidChannel() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('job-alerts', {
        name: 'Job Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
        sound: 'default',
      });
    }
  },

  /**
   * Listen for incoming notifications (foreground)
   */
  addNotificationListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  },

  /**
   * Listen for notification taps (user interaction)
   */
  addResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  /**
   * Handle notification tap - navigate to the relevant screen
   */
  handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;
    if (data?.jobId) {
      router.push(`/job/${data.jobId}`);
    }
  },

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleTestNotification() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔧 New Job Available!',
        body: 'AC repair needed in Dubai Marina - AED 450',
        data: { jobId: 'r1' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3,
      },
    });
  },
};
