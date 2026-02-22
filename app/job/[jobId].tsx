import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, MapPin, Phone, Navigation, Clock, CheckCircle, Play, XCircle, User } from 'lucide-react-native';
import { jobService } from '@/src/services/jobService';
import { getCategoryInfo, getStatusColor } from '@/src/lib/mockData';
import { Colors } from '@/constants/Colors';
import type { MaintenanceRequest } from '@/src/types';

export default function JobDetailScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [job, setJob] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadJob(); }, [jobId]);

  const loadJob = async () => {
    if (!jobId) return;
    setLoading(true);
    const data = await jobService.getJobById(jobId);
    setJob(data);
    setLoading(false);
  };

  const handleAccept = async () => {
    if (!job) return;
    setActionLoading(true);
    await jobService.acceptJob(job.id);
    await loadJob();
    setActionLoading(false);
  };

  const handleDecline = () => {
    Alert.alert('Decline Job', 'Are you sure you want to decline this job?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: async () => {
        if (!job) return;
        setActionLoading(true);
        await jobService.declineJob(job.id);
        router.back();
      }},
    ]);
  };

  const handleStart = async () => {
    if (!job) return;
    setActionLoading(true);
    await jobService.startJob(job.id);
    await loadJob();
    setActionLoading(false);
  };

  const handleComplete = () => {
    Alert.alert('Complete Job', 'Mark this job as completed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: async () => {
        if (!job) return;
        setActionLoading(true);
        await jobService.completeJob(job.id);
        await loadJob();
        setActionLoading(false);
      }},
    ]);
  };

  const openNavigation = () => {
    if (!job) return;
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`);
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

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Job not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cat = getCategoryInfo(job.category);
  const statusColor = getStatusColor(job.status);
  const isPending = job.status === 'pending';
  const isAccepted = job.status === 'accepted' || job.status === 'assigned';
  const isInProgress = job.status === 'in_progress';
  const isCompleted = job.status === 'completed';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{job.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Category & Cost */}
        <View style={styles.categoryCard}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryIcon}>{cat?.icon}</Text>
            <View>
              <Text style={styles.categoryLabel}>{cat?.label}</Text>
              <Text style={styles.timeText}>
                <Clock size={12} color={Colors.gray[400]} /> {new Date(job.createdAt).toLocaleString()}
              </Text>
            </View>
          </View>
          {job.estimatedCost && (
            <View style={styles.costContainer}>
              <Text style={styles.costLabel}>Est. Cost</Text>
              <Text style={styles.costValue}>AED {job.estimatedCost}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DESCRIPTION</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LOCATION</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <MapPin size={18} color={Colors.primary[400]} />
              <Text style={styles.addressText}>{job.propertyAddress}</Text>
            </View>
            {job.distance && (
              <Text style={styles.distanceText}>{job.distance} km · ~{job.estimatedTravelTime}</Text>
            )}
          </View>
        </View>
        {/* Tenant Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TENANT</Text>
          <View style={styles.tenantCard}>
            <View style={styles.tenantInfo}>
              <View style={styles.tenantAvatar}>
                <User size={20} color={Colors.primary[400]} />
              </View>
              <View>
                <Text style={styles.tenantName}>{job.tenantName}</Text>
                <Text style={styles.tenantPhone}>{job.tenantPhone}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL(`tel:${job.tenantPhone}`)}>
              <Phone size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigate Button */}
        {!isCompleted && (
          <TouchableOpacity style={styles.navigateButton} onPress={openNavigation}>
            <Navigation size={20} color={Colors.white} />
            <Text style={styles.navigateButtonText}>Navigate to Location</Text>
          </TouchableOpacity>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {isPending && (
            <>
              <TouchableOpacity style={styles.acceptButton} onPress={handleAccept} disabled={actionLoading}>
                <CheckCircle size={20} color={Colors.white} />
                <Text style={styles.acceptButtonText}>{actionLoading ? 'Accepting...' : 'Accept Job'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.declineButton} onPress={handleDecline} disabled={actionLoading}>
                <XCircle size={20} color={Colors.red[400]} />
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
            </>
          )}
          {isAccepted && (
            <TouchableOpacity style={styles.startButton} onPress={handleStart} disabled={actionLoading}>
              <Play size={20} color={Colors.white} />
              <Text style={styles.startButtonText}>{actionLoading ? 'Starting...' : 'Start Job'}</Text>
            </TouchableOpacity>
          )}
          {isInProgress && (
            <TouchableOpacity style={styles.completeButton} onPress={handleComplete} disabled={actionLoading}>
              <CheckCircle size={20} color={Colors.white} />
              <Text style={styles.completeButtonText}>{actionLoading ? 'Completing...' : 'Mark as Complete'}</Text>
            </TouchableOpacity>
          )}
          {isCompleted && (
            <View style={styles.completedBanner}>
              <CheckCircle size={24} color={Colors.primary[400]} />
              <Text style={styles.completedText}>Job Completed</Text>
              {job.completedAt && (
                <Text style={styles.completedDate}>{new Date(job.completedAt).toLocaleString()}</Text>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate[900] },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, color: Colors.gray[400], marginBottom: 12 },
  backLink: { fontSize: 14, color: Colors.primary[400] },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.slate[800], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: Colors.white },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  categoryCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.slate[800], borderRadius: 16, borderWidth: 1, borderColor: Colors.gray[700], padding: 16, marginBottom: 20 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryIcon: { fontSize: 28 },
  categoryLabel: { fontSize: 18, fontWeight: '600', color: Colors.white },
  timeText: { fontSize: 12, color: Colors.gray[400], marginTop: 4 },
  costContainer: { alignItems: 'flex-end' },
  costLabel: { fontSize: 11, color: Colors.gray[400], marginBottom: 2 },
  costValue: { fontSize: 22, fontWeight: 'bold', color: Colors.primary[400] },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.gray[400], letterSpacing: 1, marginBottom: 10 },
  description: { fontSize: 15, color: Colors.gray[200], lineHeight: 24, backgroundColor: Colors.slate[800], borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.gray[700] },
  locationCard: { backgroundColor: Colors.slate[800], borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.gray[700] },
  locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addressText: { fontSize: 14, color: Colors.gray[200], flex: 1 },
  distanceText: { fontSize: 13, color: Colors.teal[400], marginTop: 8, marginLeft: 28 },
  tenantCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.slate[800], borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.gray[700] },
  tenantInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tenantAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary[500] + '20', alignItems: 'center', justifyContent: 'center' },
  tenantName: { fontSize: 15, fontWeight: '600', color: Colors.white },
  tenantPhone: { fontSize: 13, color: Colors.gray[400], marginTop: 2 },
  callButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary[500], alignItems: 'center', justifyContent: 'center' },
  navigateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.blue[500], borderRadius: 14, padding: 16, marginBottom: 16 },
  navigateButtonText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  actionsSection: { gap: 10, marginBottom: 20 },
  acceptButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary[500], borderRadius: 14, padding: 16 },
  acceptButtonText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  declineButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.red[400] + '15', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.red[400] + '30' },
  declineButtonText: { fontSize: 16, fontWeight: '600', color: Colors.red[400] },
  startButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.blue[500], borderRadius: 14, padding: 16 },
  startButtonText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  completeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary[500], borderRadius: 14, padding: 16 },
  completeButtonText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  completedBanner: { alignItems: 'center', gap: 8, backgroundColor: Colors.primary[500] + '15', borderRadius: 14, padding: 24, borderWidth: 1, borderColor: Colors.primary[500] + '30' },
  completedText: { fontSize: 18, fontWeight: '600', color: Colors.primary[400] },
  completedDate: { fontSize: 13, color: Colors.gray[400] },
});
