// Location Service for HandyGo Handyman Mobile App

import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { api } from '../lib/api';

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
    const foreground = await this.requestForegroundPermission();
    if (!foreground) return false;

    if (Platform.OS === 'android') {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      return status === 'granted';
    }
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
   * Reverse geocode coordinates to a readable address string.
   */
  async resolveAddress(coords: LocationCoords): Promise<string> {
    try {
      const [geo] = await Location.reverseGeocodeAsync(coords);
      if (!geo) return '';
      return [geo.street, geo.city, geo.region].filter(Boolean).join(', ');
    } catch {
      return '';
    }
  },

  /**
   * Push current location to the server for job matching.
   */
  async updateServerLocation(token: string): Promise<boolean> {
    const coords = await this.getCurrentLocation();
    if (!coords) return false;

    const address = await this.resolveAddress(coords);
    const response = await api.put(
      '/handymen/location',
      {
        latitude: coords.latitude,
        longitude: coords.longitude,
        address,
      },
      token,
    );
    if (response.error) {
      console.warn('Failed to update server location:', response.error);
      return false;
    }
    return true;
  },

  /**
   * Watch location changes (for real-time tracking when on a job)
   */
  async watchLocation(
    callback: (coords: LocationCoords) => void,
    options?: { distanceInterval?: number; timeInterval?: number },
  ): Promise<Location.LocationSubscription | null> {
    try {
      const hasPermission = await this.requestForegroundPermission();
      if (!hasPermission) return null;

      return await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: options?.distanceInterval || 50,
          timeInterval: options?.timeInterval || 10000,
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        },
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
    const R = 6371;
    const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
    const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from.latitude * Math.PI) / 180) *
        Math.cos((to.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  },
};
