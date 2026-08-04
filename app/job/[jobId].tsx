import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin, Phone, Navigation, Clock, CheckCircle, Play, XCircle, User } from 'lucide-react-native';
import { jobService } from '@/src/services/jobService';
import { getCategoryInfo, getStatusColor } from '@/src/lib/mockData';
import { Colors } from '@/constants/Colors';
import type { JobStatus, MaintenanceRequest } from '@/src/types';

const STATUS_STEPS: { key: JobStatus | 'available'; labelKey: string }[] = [
  { key: 'available', labelKey: 'job.stepAvailable' },
  { key: 'accepted', labelKey: 'job.stepAccepted' },
  { key: 'en_route', labelKey: 'job.stepEnRoute' },
  { key: 'in_progress', labelKey: 'job.stepInProgress' },
  { key: 'completed', labelKey: 'job.stepDone' },
];

function statusToStepIndex(status: JobStatus): number {
  switch (status) {
    case 'pending':
      return 0;
    case 'assigned':
    case 'accepted':
      return 1;
    case 'en_route':
      return 2;
    case 'in_progress':
      return 3;
    case 'completed':
      return 4;
    default:
      return 0;
  }
}

function JobStatusStepper({ status }: { status: JobStatus }) {
  const { t } = useTranslation();
  const currentStep = statusToStepIndex(status);

  return (
    <View style={stepperStyles.container}>
      {STATUS_STEPS.map((step, index) => {
        const isActive = index <= currentStep;
        const isLast = index === STATUS_STEPS.length - 1;
        return (
          <View key={step.key} style={stepperStyles.stepRow}>
            <View style={stepperStyles.stepLeft}>
              <View style={[stepperStyles.dot, isActive && stepperStyles.dotActive]}>
                {isActive && <View style={stepperStyles.dotInner} />}
              </View>
              {!isLast && (
                <View style={[stepperStyles.line, index < currentStep && stepperStyles.lineActive]} />
              )}
            </View>
            <Text style={[stepperStyles.label, isActive && stepperStyles.labelActive]}>
              {t(step.labelKey)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  container: { marginBottom: 20, backgroundColor: Colors.slate[800], borderRadius: 16, borderWidth: 1, borderColor: Colors.gray[700], padding: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 36 },
  stepLeft: { alignItems: 'center', width: 24, marginRight: 12 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: Colors.gray[600], alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.slate[800] },
  dotActive: { borderColor: Colors.primary[500] },
  dotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary[500] },
  line: { width: 2, flex: 1, minHeight: 16, backgroundColor: Colors.gray[700], marginVertical: 2 },
  lineActive: { backgroundColor: Colors.primary[500] },
  label: { fontSize: 13, color: Colors.gray[500], paddingTop: 0, flex: 1 },
  labelActive: { color: Colors.gray[200], fontWeight: '600' },
});

export default function JobDetailScreen() {
  const { t } = useTranslation();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [job, setJob] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [finalAmountInput, setFinalAmountInput] = useState('');

  useEffect(() => { loadJob(); }, [jobId]);

  const loadJob = async () => {
    if (!jobId) return;
    setLoading(true);
    const data = await jobService.getJobById(jobId);
    setJob(data);
    if (data?.estimatedCost) {
      setFinalAmountInput(String(data.estimatedCost));
    }
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
    Alert.alert(t('job.declineTitle'), t('job.declineConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('job.decline'),
        style: 'destructive',
        onPress: async () => {
          if (!job) return;
          setActionLoading(true);
          await jobService.declineJob(job.id);
          router.back();
        },
      },
    ]);
  };

  const handleStart = async () => {
    if (!job) return;
    setActionLoading(true);
    await jobService.startJob(job.id);
    await loadJob();
    setActionLoading(false);
  };

  const handleCompletePress = () => {
    setShowCompleteModal(true);
  };

  const handleCompleteConfirm = async () => {
    if (!job) return;
    const finalAmount = parseFloat(finalAmountInput);
    if (!finalAmountInput || Number.isNaN(finalAmount) || finalAmount <= 0) {
      Alert.alert(t('job.invalidAmount'));
      return;
    }
    setActionLoading(true);
    try {
      await jobService.completeJob(job.id, finalAmount, 'CASH');
      setShowCompleteModal(false);
      await loadJob();
    } finally {
      setActionLoading(false);
    }
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
          <Text style={styles.errorText}>{t('job.notFound')}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>{t('job.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cat = getCategoryInfo(job.category);
  const statusColor = getStatusColor(job.status);
  const isPending = job.status === 'pending';
  const isAccepted = job.status === 'accepted' || job.status === 'assigned' || job.status === 'en_route';
  const isInProgress = job.status === 'in_progress';
  const isCompleted = job.status === 'completed';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('job.title')}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{job.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <JobStatusStepper status={job.status} />

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
              <Text style={styles.costLabel}>{t('job.estCost')}</Text>
              <Text style={styles.costValue}>{t('common.aed')} {job.estimatedCost}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('job.description')}</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('job.location')}</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('job.tenant')}</Text>
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

        {!isCompleted && (
          <TouchableOpacity style={styles.navigateButton} onPress={openNavigation}>
            <Navigation size={20} color={Colors.white} />
            <Text style={styles.navigateButtonText}>{t('job.navigateToLocation')}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.actionsSection}>
          {isPending && (
            <>
              <TouchableOpacity style={styles.acceptButton} onPress={handleAccept} disabled={actionLoading}>
                <CheckCircle size={20} color={Colors.white} />
                <Text style={styles.acceptButtonText}>{actionLoading ? t('job.accepting') : t('job.acceptJob')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.declineButton} onPress={handleDecline} disabled={actionLoading}>
                <XCircle size={20} color={Colors.red[400]} />
                <Text style={styles.declineButtonText}>{t('job.decline')}</Text>
              </TouchableOpacity>
            </>
          )}
          {isAccepted && !isInProgress && (
            <TouchableOpacity style={styles.startButton} onPress={handleStart} disabled={actionLoading}>
              <Play size={20} color={Colors.white} />
              <Text style={styles.startButtonText}>{actionLoading ? t('job.starting') : t('job.startJob')}</Text>
            </TouchableOpacity>
          )}
          {isInProgress && (
            <TouchableOpacity style={styles.completeButton} onPress={handleCompletePress} disabled={actionLoading}>
              <CheckCircle size={20} color={Colors.white} />
              <Text style={styles.completeButtonText}>{actionLoading ? t('job.completing') : t('job.markComplete')}</Text>
            </TouchableOpacity>
          )}
          {isCompleted && (
            <View style={styles.completedBanner}>
              <CheckCircle size={24} color={Colors.primary[400]} />
              <Text style={styles.completedText}>{t('job.jobCompleted')}</Text>
              {job.completedAt && (
                <Text style={styles.completedDate}>{new Date(job.completedAt).toLocaleString()}</Text>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showCompleteModal} transparent animationType="fade" onRequestClose={() => setShowCompleteModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('job.completeTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('job.completePrompt')}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t('job.finalAmount')}
              placeholderTextColor={Colors.gray[500]}
              value={finalAmountInput}
              onChangeText={setFinalAmountInput}
              keyboardType="decimal-pad"
              accessibilityLabel={t('job.finalAmount')}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowCompleteModal(false)}>
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleCompleteConfirm} disabled={actionLoading}>
                {actionLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>{t('common.complete')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  acceptButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary[500], borderRadius: 14, height: 52 },
  acceptButtonText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  declineButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.red[400] + '15', borderRadius: 14, height: 52, borderWidth: 1, borderColor: Colors.red[400] + '30' },
  declineButtonText: { fontSize: 16, fontWeight: '700', color: Colors.red[400] },
  startButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.blue[500], borderRadius: 14, height: 52 },
  startButtonText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  completeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary[500], borderRadius: 14, height: 52 },
  completeButtonText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  completedBanner: { alignItems: 'center', gap: 8, backgroundColor: Colors.primary[500] + '15', borderRadius: 14, padding: 24, borderWidth: 1, borderColor: Colors.primary[500] + '30' },
  completedText: { fontSize: 18, fontWeight: '600', color: Colors.primary[400] },
  completedDate: { fontSize: 13, color: Colors.gray[400] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: Colors.slate[800], borderRadius: 16, padding: 24, borderWidth: 1, borderColor: Colors.gray[700] },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.white, marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: Colors.gray[400], marginBottom: 16 },
  modalInput: { backgroundColor: Colors.slate[900], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[700], paddingHorizontal: 16, height: 50, fontSize: 16, color: Colors.white, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.slate[700] },
  modalCancelText: { color: Colors.gray[300], fontWeight: '600' },
  modalConfirm: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.primary[500] },
  modalConfirmText: { color: Colors.white, fontWeight: '600' },
});
