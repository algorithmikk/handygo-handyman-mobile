import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MapPin, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { jobService } from '@/src/services/jobService';
import { getCategoryInfo, getStatusColor } from '@/src/lib/mockData';
import { Colors } from '@/constants/Colors';
import type { MaintenanceRequest } from '@/src/types';

type Tab = 'available' | 'active' | 'history';

export default function JobsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('available');
  const [availableJobs, setAvailableJobs] = useState<MaintenanceRequest[]>([]);
  const [activeJobs, setActiveJobs] = useState<MaintenanceRequest[]>([]);
  const [completedJobs, setCompletedJobs] = useState<MaintenanceRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [available, active, completed] = await Promise.all([
        jobService.getAvailableJobs(),
        jobService.getActiveJobs(),
        jobService.getCompletedJobs(),
      ]);
      setAvailableJobs(available);
      setActiveJobs(active);
      setCompletedJobs(completed);
    } catch (e) {
      console.error('Failed to load jobs:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleAccept = async (jobId: string) => {
    await jobService.acceptJob(jobId);
    await loadData();
  };

  const getJobs = (): MaintenanceRequest[] => {
    switch (activeTab) {
      case 'available': return availableJobs;
      case 'active': return activeJobs;
      case 'history': return completedJobs;
    }
  };

  const jobs = getJobs();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jobs</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['available', 'active', 'history'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'available' ? `Available (${availableJobs.length})` :
               tab === 'active' ? `Active (${activeJobs.length})` :
               `History (${completedJobs.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[400]} />}
      >
        {jobs.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              {activeTab === 'history' ? <CheckCircle size={32} color={Colors.gray[600]} /> : <Clock size={32} color={Colors.gray[600]} />}
            </View>
            <Text style={styles.emptyTitle}>No {activeTab} jobs</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'available' ? 'New jobs will appear here when available' :
               activeTab === 'active' ? 'Accept a job to see it here' :
               'Completed jobs will appear here'}
            </Text>
          </View>
        ) : (
          jobs.map((job) => {
            const cat = getCategoryInfo(job.category);
            const statusColor = getStatusColor(job.status);
            return (
              <TouchableOpacity key={job.id} style={styles.jobCard} onPress={() => router.push(`/job/${job.id}`)}>
                <View style={styles.jobCardTop}>
                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryIcon}>{cat?.icon}</Text>
                    <Text style={styles.categoryLabel}>{cat?.label}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{job.status.replace('_', ' ')}</Text>
                  </View>
                </View>
                <Text style={styles.jobDescription} numberOfLines={2}>{job.description}</Text>
                <View style={styles.addressRow}>
                  <MapPin size={12} color={Colors.gray[500]} />
                  <Text style={styles.addressText}>{job.propertyAddress}</Text>
                </View>
                <View style={styles.jobCardBottom}>
                  {job.estimatedCost && <Text style={styles.costText}>AED {job.estimatedCost}</Text>}
                  {job.distance && <Text style={styles.distanceText}>{job.distance} km away</Text>}
                </View>
                {activeTab === 'available' && (
                  <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(job.id)}>
                    <Text style={styles.acceptButtonText}>Accept Job</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate[900] },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.white },
  tabBar: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: Colors.slate[800], borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: Colors.primary[500] },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.gray[400] },
  tabTextActive: { color: Colors.white },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  jobCard: { backgroundColor: Colors.slate[800], borderRadius: 16, borderWidth: 1, borderColor: Colors.gray[700], padding: 16, marginBottom: 12 },
  jobCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryIcon: { fontSize: 20 },
  categoryLabel: { fontSize: 15, fontWeight: '600', color: Colors.white },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  jobDescription: { fontSize: 14, color: Colors.gray[300], lineHeight: 20, marginBottom: 8 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  addressText: { fontSize: 12, color: Colors.gray[500], flex: 1 },
  jobCardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  costText: { fontSize: 14, fontWeight: '600', color: Colors.primary[400] },
  distanceText: { fontSize: 12, color: Colors.teal[400] },
  acceptButton: { backgroundColor: Colors.primary[500], borderRadius: 10, padding: 12, alignItems: 'center' },
  acceptButtonText: { fontSize: 15, color: Colors.white, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.slate[800], alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, color: Colors.gray[400] },
  emptySubtitle: { fontSize: 14, color: Colors.gray[500], marginTop: 4, textAlign: 'center', paddingHorizontal: 32 },
});
