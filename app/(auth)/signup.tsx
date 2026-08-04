import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Mail, Lock, Eye, EyeOff, User, Phone, Wrench, Upload, FileText } from 'lucide-react-native';
import { useAuth } from '@/src/context/AuthContext';
import { uploadKycDocument } from '@/src/services/mediaService';
import { Colors } from '@/constants/Colors';
import type { ServiceCategory } from '@/src/types';

const SERVICE_OPTIONS: { id: ServiceCategory; label: string; icon: string }[] = [
  { id: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { id: 'electrical', label: 'Electrical', icon: '⚡' },
  { id: 'ac', label: 'AC / HVAC', icon: '❄️' },
  { id: 'general', label: 'General', icon: '🛠️' },
];

const CATEGORY_MAP: Record<ServiceCategory, string> = {
  plumbing: 'PLUMBING',
  electrical: 'ELECTRICAL',
  ac: 'AC_HVAC',
  general: 'GENERAL',
};

function normalizeServiceCategories(categories: ServiceCategory[]): string[] {
  return categories.map((c) => CATEGORY_MAP[c] || c.toUpperCase());
}

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
  const [emiratesId, setEmiratesId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [emiratesIdDocUri, setEmiratesIdDocUri] = useState<string | null>(null);
  const [licenseDocUri, setLicenseDocUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleService = (id: ServiceCategory) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const pickDocument = async (type: 'emiratesId' | 'license') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    if (type === 'emiratesId') {
      setEmiratesIdDocUri(uri);
    } else {
      setLicenseDocUri(uri);
    }
  };

  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !phone || !password) {
      setError(t('auth.fillAllFields'));
      return;
    }
    if (selectedServices.length === 0) {
      setError(t('auth.selectOneService'));
      return;
    }
    if (!emiratesId || !licenseNumber) {
      setError(t('auth.kycRequired'));
      return;
    }
    if (!emiratesIdDocUri || !licenseDocUri) {
      setError(t('auth.docRequired'));
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const [emiratesIdDocUrl, licenseDocUrl] = await Promise.all([
        uploadKycDocument(emiratesIdDocUri),
        uploadKycDocument(licenseDocUri),
      ]);

      await signup({
        firstName,
        lastName,
        email,
        phoneNumber: phone,
        password,
        serviceCategories: normalizeServiceCategories(selectedServices),
        emiratesId,
        licenseNumber,
        licenseExpiry: licenseExpiry || undefined,
        emiratesIdDocUrl,
        licenseDocUrl,
      });
      router.replace('/(tabs)');
    } catch (err) {
      setError(t('auth.signupError'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderDocPicker = (
    label: string,
    uri: string | null,
    onPick: () => void,
  ) => (
    <View style={styles.docSection}>
      <Text style={styles.docLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.docPicker}
        onPress={onPick}
        accessibilityRole="button"
        accessibilityLabel={uri ? t('auth.changeDoc') : t('auth.uploadDoc')}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.docPreview} accessibilityIgnoresInvertColors />
        ) : (
          <View style={styles.docPlaceholder}>
            <Upload size={22} color={Colors.gray[400]} />
            <Text style={styles.docPlaceholderText}>{t('auth.uploadDoc')}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Wrench size={24} color={Colors.white} />
            </View>
            <Text style={styles.logo}>{t('auth.signupTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.signupSubtitle')}</Text>
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

            <View style={styles.inputContainer}>
              <FileText size={20} color={Colors.gray[400]} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.emiratesId')}
                placeholderTextColor={Colors.gray[400]}
                value={emiratesId}
                onChangeText={setEmiratesId}
                autoCapitalize="characters"
              />
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.inputWithLeftPad]}
                placeholder={t('auth.licenseNumber')}
                placeholderTextColor={Colors.gray[400]}
                value={licenseNumber}
                onChangeText={setLicenseNumber}
              />
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.inputWithLeftPad]}
                placeholder={t('auth.licenseExpiry')}
                placeholderTextColor={Colors.gray[400]}
                value={licenseExpiry}
                onChangeText={setLicenseExpiry}
              />
            </View>

            {renderDocPicker(t('auth.emiratesIdDoc'), emiratesIdDocUri, () => pickDocument('emiratesId'))}
            {renderDocPicker(t('auth.licenseDoc'), licenseDocUri, () => pickDocument('license'))}

            <Text style={styles.sectionLabel}>{t('auth.selectServices')}</Text>
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
  inputWithLeftPad: { paddingLeft: 16 },
  eyeIcon: { padding: 4 },
  docSection: { marginBottom: 14 },
  docLabel: { color: Colors.gray[300], fontSize: 13, fontWeight: '600', marginBottom: 8 },
  docPicker: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.gray[700], backgroundColor: Colors.slate[800] },
  docPreview: { width: '100%', height: 120, resizeMode: 'cover' },
  docPlaceholder: { height: 100, alignItems: 'center', justifyContent: 'center', gap: 8 },
  docPlaceholderText: { color: Colors.gray[400], fontSize: 13 },
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
