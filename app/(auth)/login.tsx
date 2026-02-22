import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, Wrench } from 'lucide-react-native';
import { useAuth } from '@/src/context/AuthContext';
import { Colors } from '@/constants/Colors';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await login({ email, password });
      router.replace('/(tabs)');
    } catch (err) {
      setError(t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Wrench size={28} color={Colors.white} />
            </View>
            <Text style={styles.logo}>HandyGo</Text>
            <Text style={styles.subtitle}>Technician Portal</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.title}>{t('auth.login')}</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputContainer}>
              <Mail size={20} color={Colors.gray[400]} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.email')}
                placeholderTextColor={Colors.gray[400]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color={Colors.gray[400]} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.password')}
                placeholderTextColor={Colors.gray[400]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {showPassword ? <EyeOff size={20} color={Colors.gray[400]} /> : <Eye size={20} color={Colors.gray[400]} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
              )}
            </TouchableOpacity>

            {/* Demo credentials hint */}
            <View style={styles.demoHint}>
              <Text style={styles.demoText}>Demo: handyman@handygo.ae / handyman123</Text>
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>{t('auth.noAccount')} </Text>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity>
                  <Text style={styles.signupLink}>{t('auth.signup')}</Text>
                </TouchableOpacity>
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
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 48 },
  logoContainer: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.primary[500],
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logo: { fontSize: 32, fontWeight: 'bold', color: Colors.white },
  subtitle: { fontSize: 14, color: Colors.gray[400], marginTop: 4 },
  form: { width: '100%' },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.white, marginBottom: 24 },
  errorText: { color: Colors.error, fontSize: 14, marginBottom: 16, textAlign: 'center' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.slate[800], borderRadius: 12,
    borderWidth: 1, borderColor: Colors.gray[700],
    marginBottom: 16, paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: 52, fontSize: 16, color: Colors.white },
  eyeIcon: { padding: 4 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotPasswordText: { color: Colors.primary[400], fontSize: 14 },
  loginButton: {
    backgroundColor: Colors.primary[500], borderRadius: 12,
    height: 52, alignItems: 'center', justifyContent: 'center',
  },
  loginButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  demoHint: { alignItems: 'center', marginTop: 16, padding: 12, backgroundColor: Colors.slate[800], borderRadius: 8 },
  demoText: { color: Colors.gray[400], fontSize: 12 },
  signupContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupText: { color: Colors.gray[400], fontSize: 14 },
  signupLink: { color: Colors.primary[400], fontSize: 14, fontWeight: '600' },
});

