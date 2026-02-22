import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, User, Phone, Wrench } from 'lucide-react-native';
import { useAuth } from '@/src/context/AuthContext';
import { Colors } from '@/constants/Colors';
import type { ServiceCategory } from '@/src/types';

const SERVICE_OPTIONS: { id: ServiceCategory; label: string; icon: string }[] = [
  { id: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { id: 'electrical', label: 'Electrical', icon: '⚡' },
  { id: 'ac', label: 'AC / HVAC', icon: '❄️' },
  { id: 'general', label: 'General', icon: '🛠️' },
];

export default function SignupScreen() {
  const { t } = useTranslation();
  const { signup } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedServices, setSelectedServices] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleService = (id: ServiceCategory) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !phone || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (selectedServices.length === 0) {
      setError('Please select at least one service');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await signup({ firstName, lastName, email, phone, password, services: selectedServices });
      router.replace('/(tabs)');
    } catch (err) {
      setError(t('auth.signupError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Wrench size={24} color={Colors.white} />
            </View>
            <Text style={styles.logo}>Join HandyGo</Text>
            <Text style={styles.subtitle}>Register as a Technician</Text>
          </View>

          <View style={styles.form}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <User size={20} color={Colors.gray[400]} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder={t('auth.firstName')} placeholderTextColor={Colors.gray[400]} value={firstName} onChangeText={setFirstName} />
              </View>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <TextInput style={styles.input} placeholder={t('auth.lastName')} placeholderTextColor={Colors.gray[400]} value={lastName} onChangeText={setLastName} />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Mail size={20} color={Colors.gray[400]} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder={t('auth.email')} placeholderTextColor={Colors.gray[400]} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.inputContainer}>
              <Phone size={20} color={Colors.gray[400]} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="+971 5X XXX XXXX" placeholderTextColor={Colors.gray[400]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color={Colors.gray[400]} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder={t('auth.password')} placeholderTextColor={Colors.gray[400]} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {showPassword ? <EyeOff size={20} color={Colors.gray[400]} /> : <Eye size={20} color={Colors.gray[400]} />}
              </TouchableOpacity>
            </View>

            {/* Service Selection */}
            <Text style={styles.sectionLabel}>Select Your Services</Text>
            <View style={styles.servicesGrid}>
              {SERVICE_OPTIONS.map((svc) => (
                <TouchableOpacity
                  key={svc.id}
                  style={[styles.serviceChip, selectedServices.includes(svc.id) && styles.serviceChipActive]}
                  onPress={() => toggleService(svc.id)}
                >
                  <Text style={styles.serviceIcon}>{svc.icon}</Text>
                  <Text style={[styles.serviceLabel, selectedServices.includes(svc.id) && styles.serviceLabelActive]}>{svc.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.signupButton} onPress={handleSignup} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.signupButtonText}>{t('auth.signup')}</Text>}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>{t('auth.hasAccount')} </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity><Text style={styles.loginLink}>{t('auth.login')}</Text></TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate[900] },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 16 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.primary[500], alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  logo: { fontSize: 26, fontWeight: 'bold', color: Colors.white },
  subtitle: { fontSize: 14, color: Colors.gray[400], marginTop: 4 },
  form: { width: '100%' },
  errorText: { color: Colors.error, fontSize: 14, marginBottom: 16, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.slate[800], borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[700], marginBottom: 14, paddingHorizontal: 16 },
  halfInput: { flex: 1 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: 50, fontSize: 15, color: Colors.white },
  eyeIcon: { padding: 4 },
  sectionLabel: { color: Colors.gray[300], fontSize: 14, fontWeight: '600', marginBottom: 12, marginTop: 4 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  serviceChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.slate[800], borderWidth: 1, borderColor: Colors.gray[700] },
  serviceChipActive: { backgroundColor: Colors.primary[500] + '20', borderColor: Colors.primary[500] },
  serviceIcon: { fontSize: 16 },
  serviceLabel: { fontSize: 13, color: Colors.gray[400] },
  serviceLabelActive: { color: Colors.primary[400], fontWeight: '600' },
  signupButton: { backgroundColor: Colors.primary[500], borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center' },
  signupButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { color: Colors.gray[400], fontSize: 14 },
  loginLink: { color: Colors.primary[400], fontSize: 14, fontWeight: '600' },
});

