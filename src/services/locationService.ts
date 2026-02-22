// Location Service for HandyGo Handyman Mobile App

import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export const locationService = {
  /**
   * Request foreground location permission
   */
  async requestForegroundPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Request background location permission (for when handyman is online)
   */
  async requestBackgroundPermission(): Promise<boolean> {
    // First ensure foreground is granted
    const foreground = await this.requestForegroundPermission();
    if (!foreground) return false;

    if (Platform.OS === 'android') {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      return status === 'granted';
    }
    // iOS handles this through the plist permission strings
    return true;
  },

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<LocationCoords | null> {
    try {
      const hasPermission = await this.requestForegroundPermission();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (e) {
      console.error('Failed to get location:', e);
      return null;
    }
  },

  /**
   * Watch location changes (for real-time tracking when on a job)
   */
  async watchLocation(
    callback: (coords: LocationCoords) => void,
    options?: { distanceInterval?: number; timeInterval?: number }
  ): Promise<Location.LocationSubscription | null> {
    try {
      const hasPermission = await this.requestForegroundPermission();
      if (!hasPermission) return null;

      return await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: options?.distanceInterval || 50, // meters
          timeInterval: options?.timeInterval || 10000, // ms
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    } catch (e) {
      console.error('Failed to watch location:', e);
      return null;
    }
  },

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(from: LocationCoords, to: LocationCoords): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
    const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from.latitude * Math.PI) / 180) *
        Math.cos((to.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal
  },
};

