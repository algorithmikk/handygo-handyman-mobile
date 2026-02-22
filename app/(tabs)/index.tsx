import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, RefreshControl, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Wrench, Clock, CheckCircle, DollarSign, Star, ToggleLeft, ToggleRight, MapPin, Phone, Navigation, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/src/context/AuthContext';
import { jobService } from '@/src/services/jobService';
import { getCategoryInfo, getStatusColor } from '@/src/lib/mockData';
import { Colors } from '@/constants/Colors';
import type { MaintenanceRequest, HandymanStats } from '@/src/types';

export default function HomeScreen() {
  const { user, isAuthenticated } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);
  const [stats, setStats] = useState<HandymanStats | null>(null);
  const [activeJobs, setActiveJobs] = useState<MaintenanceRequest[]>([]);
  const [availableJobs, setAvailableJobs] = useState<MaintenanceRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const [statsData, active, available] = await Promise.all([
        jobService.getStats(),
        jobService.getActiveJobs(),
        jobService.getAvailableJobs(),
      ]);
      setStats(statsData);
      setActiveJobs(active);
      setAvailableJobs(available);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const toggleAvailability = async () => {
    const newState = !isAvailable;
    setIsAvailable(newState);
    await jobService.updateAvailability(newState);
  };

  const handleAcceptJob = async (jobId: string) => {
    await jobService.acceptJob(jobId);
    await loadData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  const activeJob = activeJobs[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[400]} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoIcon}>
              <Wrench size={20} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.headerTitle}>HandyGo</Text>
              <Text style={styles.headerSubtitle}>Technician Portal</Text>
            </View>
          </View>
        </View>

        {/* Profile & Status */}
        <View style={styles.profileCard}>
          <View style={styles.profileLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.firstName?.charAt(0) || 'H'}</Text>
            </View>
            <View>
              <Text style={styles.profileName}>{user?.firstName} {user?.lastName}</Text>
              <View style={styles.ratingRow}>
                <Star size={14} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.ratingText}>{stats?.rating || 4.8}</Text>
                <Text style={styles.ratingDot}>·</Text>
                <Text style={styles.ratingText}>{stats?.totalCompleted || 0} jobs</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.statusToggle, isAvailable ? styles.statusOnline : styles.statusOffline]}
            onPress={toggleAvailability}
          >
            {isAvailable ? <ToggleRight size={20} color={Colors.primary[400]} /> : <ToggleLeft size={20} color={Colors.gray[400]} />}
            <Text style={[styles.statusText, isAvailable ? styles.statusTextOnline : styles.statusTextOffline]}>
              {isAvailable ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Clock size={22} color="#fbbf24" />
            <Text style={styles.statNumber}>{stats?.pendingJobs || 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <CheckCircle size={22} color={Colors.primary[400]} />
            <Text style={styles.statNumber}>{stats?.completedToday || 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <DollarSign size={22} color="#60a5fa" />
            <Text style={styles.statNumber}>{stats?.earningsToday || 0}</Text>
            <Text style={styles.statLabel}>AED Today</Text>
          </View>
        </View>

        {/* Active Job */}
        {activeJob && (
          <View style={styles.activeJobCard}>
            <View style={styles.activeJobHeader}>
              <Text style={styles.activeJobLabel}>ACTIVE JOB</Text>
              <Text style={styles.activeJobTime}>
                {new Date(activeJob.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryIcon}>{getCategoryInfo(activeJob.category)?.icon}</Text>
              <Text style={styles.categoryLabel}>{getCategoryInfo(activeJob.category)?.label}</Text>
              {activeJob.estimatedCost && (
                <Text style={styles.costBadge}>AED {activeJob.estimatedCost}</Text>
              )}
            </View>
            <Text style={styles.jobDescription}>{activeJob.description}</Text>
            <View style={styles.addressRow}>
              <MapPin size={14} color={Colors.gray[400]} />
              <Text style={styles.addressText}>{activeJob.propertyAddress}</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton} onPress={() => Linking.openURL(`tel:${activeJob.tenantPhone}`)}>
                <Phone size={16} color={Colors.white} />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${activeJob.lat},${activeJob.lng}`)}
              >
                <Navigation size={16} color={Colors.white} />
                <Text style={styles.actionButtonText}>Navigate</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={async () => { await jobService.completeJob(activeJob.id); await loadData(); }}
            >
              <CheckCircle size={18} color={Colors.white} />
              <Text style={styles.completeButtonText}>Mark as Complete</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Available Jobs */}
        {!activeJob && availableJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AVAILABLE JOBS</Text>
            {availableJobs.map((job) => {
              const cat = getCategoryInfo(job.category);
              return (
                <TouchableOpacity key={job.id} style={styles.jobCard} onPress={() => router.push(`/job/${job.id}`)}>
                  <View style={styles.jobCardHeader}>
                    <View style={styles.categoryRow}>
                      <Text style={styles.categoryIcon}>{cat?.icon}</Text>
                      <Text style={styles.categoryLabel}>{cat?.label}</Text>
                    </View>
                    {job.estimatedCost && <Text style={styles.costBadge}>AED {job.estimatedCost}</Text>}
                  </View>
                  <Text style={styles.jobDescription} numberOfLines={2}>{job.description}</Text>
                  <View style={styles.addressRow}>
                    <MapPin size={12} color={Colors.gray[500]} />
                    <Text style={styles.addressTextSmall}>{job.propertyAddress}</Text>
                  </View>
                  {job.distance && (
                    <Text style={styles.distanceText}>{job.distance} km · ~{job.estimatedTravelTime}</Text>
                  )}
                  <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptJob(job.id)}>
                    <Text style={styles.acceptButtonText}>Accept Job</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {!activeJob && availableJobs.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <CheckCircle size={32} color={Colors.gray[600]} />
            </View>
            <Text style={styles.emptyTitle}>No pending jobs</Text>
            <Text style={styles.emptySubtitle}>New jobs will appear here</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate[900] },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primary[500], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.white },
  headerSubtitle: { fontSize: 12, color: Colors.gray[400] },
  profileCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, padding: 16, backgroundColor: Colors.slate[800], borderRadius: 16, borderWidth: 1, borderColor: Colors.gray[700], marginBottom: 16 },
  profileLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary[500] + '30', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: Colors.primary[400] },
  profileName: { fontSize: 16, fontWeight: '600', color: Colors.white },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 13, color: Colors.gray[400] },
  ratingDot: { color: Colors.gray[500] },
  statusToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  statusOnline: { backgroundColor: Colors.primary[500] + '20' },
  statusOffline: { backgroundColor: Colors.slate[700] },
  statusText: { fontSize: 13, fontWeight: '500' },
  statusTextOnline: { color: Colors.primary[400] },
  statusTextOffline: { color: Colors.gray[400] },
  statsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: Colors.slate[800], borderRadius: 16, borderWidth: 1, borderColor: Colors.gray[700], padding: 16, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: Colors.white, marginTop: 8 },
  statLabel: { fontSize: 12, color: Colors.gray[400], marginTop: 2 },
  activeJobCard: { marginHorizontal: 20, padding: 16, borderRadius: 16, backgroundColor: Colors.primary[500] + '15', borderWidth: 1, borderColor: Colors.primary[500] + '40', marginBottom: 20 },
  activeJobHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  activeJobLabel: { fontSize: 11, fontWeight: '700', color: Colors.primary[400], letterSpacing: 1 },
  activeJobTime: { fontSize: 12, color: Colors.gray[400] },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  categoryIcon: { fontSize: 20 },
  categoryLabel: { fontSize: 15, fontWeight: '600', color: Colors.white },
  costBadge: { fontSize: 14, fontWeight: '600', color: Colors.primary[400], marginLeft: 'auto' },
  jobDescription: { fontSize: 14, color: Colors.gray[300], lineHeight: 20, marginBottom: 8 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  addressText: { fontSize: 13, color: Colors.gray[400], flex: 1 },
  addressTextSmall: { fontSize: 12, color: Colors.gray[500], flex: 1 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, backgroundColor: Colors.slate[700], borderRadius: 10 },
  actionButtonText: { fontSize: 14, color: Colors.white, fontWeight: '500' },
  completeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, backgroundColor: Colors.primary[500], borderRadius: 12 },
  completeButtonText: { fontSize: 15, color: Colors.white, fontWeight: '600' },
  section: { marginHorizontal: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.gray[400], letterSpacing: 1, marginBottom: 12 },
  jobCard: { backgroundColor: Colors.slate[800], borderRadius: 16, borderWidth: 1, borderColor: Colors.gray[700], padding: 16, marginBottom: 12 },
  jobCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  distanceText: { fontSize: 12, color: Colors.teal[400], marginBottom: 12 },
  acceptButton: { backgroundColor: Colors.primary[500], borderRadius: 10, padding: 12, alignItems: 'center' },
  acceptButtonText: { fontSize: 15, color: Colors.white, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.slate[800], alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, color: Colors.gray[400] },
  emptySubtitle: { fontSize: 14, color: Colors.gray[500], marginTop: 4 },
});