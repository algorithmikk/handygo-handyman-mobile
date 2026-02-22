import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { User, Star, Wrench, CheckCircle, Bell, Globe, ChevronRight, LogOut, Shield, FileText } from 'lucide-react-native';
import { useAuth } from '@/src/context/AuthContext';
import { jobService } from '@/src/services/jobService';
import { SERVICE_CATEGORIES } from '@/src/lib/mockData';
import { Colors } from '@/constants/Colors';
import type { HandymanStats } from '@/src/types';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<HandymanStats | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await jobService.getStats();
    setStats(data);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/(auth)/login');
      }},
    ]);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{user?.firstName?.charAt(0) || 'H'}{user?.lastName?.charAt(0) || 'G'}</Text>
          </View>
          <Text style={styles.profileName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          {user?.phone && <Text style={styles.profilePhone}>{user.phone}</Text>}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Star size={18} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.statValue}>{stats?.rating || 4.8}</Text>
              <Text style={styles.statLabel}>{t('profile.rating')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <CheckCircle size={18} color={Colors.primary[400]} />
              <Text style={styles.statValue}>{stats?.totalCompleted || 0}</Text>
              <Text style={styles.statLabel}>{t('profile.jobsCompleted')}</Text>
            </View>
          </View>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.services')}</Text>
          <View style={styles.servicesGrid}>
            {SERVICE_CATEGORIES.map((cat) => (
              <View key={cat.id} style={[styles.serviceChip, { borderColor: cat.color + '40' }]}>
                <Text style={styles.serviceIcon}>{cat.icon}</Text>
                <Text style={styles.serviceLabel}>{cat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Bell size={20} color={Colors.gray[400]} />
              <Text style={styles.settingLabel}>{t('profile.notifications')}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: Colors.gray[700], true: Colors.primary[500] + '60' }}
              thumbColor={notificationsEnabled ? Colors.primary[500] : Colors.gray[400]}
            />
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={toggleLanguage}>
            <View style={styles.settingLeft}>
              <Globe size={20} color={Colors.gray[400]} />
              <Text style={styles.settingLabel}>{t('profile.language')}</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{i18n.language === 'en' ? 'English' : 'العربية'}</Text>
              <ChevronRight size={18} color={Colors.gray[500]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Shield size={20} color={Colors.gray[400]} />
              <Text style={styles.settingLabel}>Verification</Text>
            </View>
            <View style={styles.settingRight}>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
              <ChevronRight size={18} color={Colors.gray[500]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <FileText size={20} color={Colors.gray[400]} />
              <Text style={styles.settingLabel}>Documents</Text>
            </View>
            <ChevronRight size={18} color={Colors.gray[500]} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.red[400]} />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate[900] },
  scrollView: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.white },
  profileCard: { marginHorizontal: 20, padding: 24, backgroundColor: Colors.slate[800], borderRadius: 20, borderWidth: 1, borderColor: Colors.gray[700], alignItems: 'center', marginBottom: 20 },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary[500] + '30', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: Colors.primary[400] },
  profileName: { fontSize: 20, fontWeight: 'bold', color: Colors.white },
  profileEmail: { fontSize: 14, color: Colors.gray[400], marginTop: 4 },
  profilePhone: { fontSize: 14, color: Colors.gray[400], marginTop: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: Colors.gray[700], width: '100%' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: Colors.white },
  statLabel: { fontSize: 12, color: Colors.gray[400] },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.gray[700] },
  section: { marginHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.gray[400], marginBottom: 12, letterSpacing: 0.5 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.slate[800], borderWidth: 1 },
  serviceIcon: { fontSize: 16 },
  serviceLabel: { fontSize: 13, color: Colors.gray[300] },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.slate[800], borderRadius: 12, padding: 16, marginBottom: 8 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 15, color: Colors.white },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { fontSize: 14, color: Colors.gray[400] },
  verifiedBadge: { backgroundColor: Colors.primary[500] + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  verifiedText: { fontSize: 12, fontWeight: '600', color: Colors.primary[400] },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, padding: 16, backgroundColor: Colors.red[400] + '15', borderRadius: 12, borderWidth: 1, borderColor: Colors.red[400] + '30' },
  logoutText: { fontSize: 16, fontWeight: '600', color: Colors.red[400] },
});
