// Push Notification Service for HandyGo Handyman Mobile App

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
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

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Get Expo push token
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'handygo-handyman-mobile', // Replace with actual Expo project ID
      });
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
      trigger: { seconds: 3 },
    });
  },
};

