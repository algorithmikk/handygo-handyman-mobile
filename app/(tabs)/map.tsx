import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Navigation, MapPin, Crosshair } from 'lucide-react-native';
import { jobService } from '@/src/services/jobService';
import { getCategoryInfo } from '@/src/lib/mockData';
import { Colors } from '@/constants/Colors';
import type { MaintenanceRequest } from '@/src/types';

// Dubai dark map style
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
];

const DUBAI_REGION = {
  latitude: 25.2048, longitude: 55.2708,
  latitudeDelta: 0.15, longitudeDelta: 0.15,
};

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [jobs, setJobs] = useState<MaintenanceRequest[]>([]);
  const [selectedJob, setSelectedJob] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
      // Load available jobs
      const available = await jobService.getAvailableJobs();
      const active = await jobService.getActiveJobs();
      setJobs([...available, ...active]);
    } catch (e) {
      console.error('Map load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const centerOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05, longitudeDelta: 0.05,
      }, 500);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}

        initialRegion={location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.08, longitudeDelta: 0.08,
        } : DUBAI_REGION}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {jobs.map((job) => {
          const cat = getCategoryInfo(job.category);
          return (
            <Marker
              key={job.id}
              coordinate={{ latitude: job.lat, longitude: job.lng }}
              title={cat?.label}
              description={job.propertyAddress}
              onPress={() => setSelectedJob(job)}
              pinColor={cat?.color || Colors.primary[500]}
            />
          );
        })}
      </MapView>

      {/* Header overlay */}
      <SafeAreaView style={styles.headerOverlay}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Job Map</Text>
          <Text style={styles.headerSubtitle}>{jobs.length} jobs nearby</Text>
        </View>
      </SafeAreaView>

      {/* Center button */}
      <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
        <Crosshair size={22} color={Colors.white} />
      </TouchableOpacity>

      {/* Selected job card */}
      {selectedJob && (
        <View style={styles.jobCard}>
          <View style={styles.jobCardHeader}>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryIcon}>{getCategoryInfo(selectedJob.category)?.icon}</Text>
              <Text style={styles.categoryLabel}>{getCategoryInfo(selectedJob.category)?.label}</Text>
            </View>
            {selectedJob.estimatedCost && (
              <Text style={styles.costBadge}>AED {selectedJob.estimatedCost}</Text>
            )}
          </View>
          <Text style={styles.jobDescription} numberOfLines={2}>{selectedJob.description}</Text>
          <View style={styles.addressRow}>
            <MapPin size={12} color={Colors.gray[400]} />
            <Text style={styles.addressText}>{selectedJob.propertyAddress}</Text>
          </View>
          {selectedJob.distance && (
            <Text style={styles.distanceText}>{selectedJob.distance} km · ~{selectedJob.estimatedTravelTime}</Text>
          )}
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.viewButton} onPress={() => { router.push(`/job/${selectedJob.id}`); setSelectedJob(null); }}>
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedJob(null)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate[900] },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.gray[400], marginTop: 12, fontSize: 14 },
  map: { flex: 1 },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerBar: { marginHorizontal: 20, marginTop: 8, padding: 14, backgroundColor: Colors.slate[900] + 'E6', borderRadius: 14 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.white },
  headerSubtitle: { fontSize: 12, color: Colors.gray[400], marginTop: 2 },
  centerButton: { position: 'absolute', right: 20, bottom: 200, width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.slate[800], alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.gray[700] },
  jobCard: { position: 'absolute', bottom: 100, left: 20, right: 20, backgroundColor: Colors.slate[800], borderRadius: 16, borderWidth: 1, borderColor: Colors.gray[700], padding: 16 },
  jobCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryIcon: { fontSize: 20 },
  categoryLabel: { fontSize: 15, fontWeight: '600', color: Colors.white },
  costBadge: { fontSize: 14, fontWeight: '600', color: Colors.primary[400] },
  jobDescription: { fontSize: 14, color: Colors.gray[300], lineHeight: 20, marginBottom: 6 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  addressText: { fontSize: 12, color: Colors.gray[400], flex: 1 },
  distanceText: { fontSize: 12, color: Colors.teal[400], marginBottom: 12 },
  cardActions: { flexDirection: 'row', gap: 10 },
  viewButton: { flex: 1, backgroundColor: Colors.primary[500], borderRadius: 10, padding: 12, alignItems: 'center' },
  viewButtonText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
  closeButton: { flex: 1, backgroundColor: Colors.slate[700], borderRadius: 10, padding: 12, alignItems: 'center' },
  closeButtonText: { color: Colors.gray[300], fontWeight: '500', fontSize: 14 },
});
