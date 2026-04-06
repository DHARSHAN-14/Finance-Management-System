import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Button, Input } from '../../components/ui';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const { login, isLoggingIn, error, clearError } = useAuthStore();
  const router = useRouter();

  const validate = () => {
    const e: { email?: string; password?: string } = {};
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) e.email = 'Enter a valid email';

    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';

    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }
    clearError();
    try {
      await login(email.trim().toLowerCase(), password);
      const u = useAuthStore.getState().user;
      router.replace(u?.role === 'CLIENT' ? '/(client)/home' : '/(admin)/dashboard');
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="always">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>SK</Text>
          </View>
          <Text style={styles.appName}>SK Associates</Text>
          <Text style={styles.tagline}>Finance Management System</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={Typography.h2}>Welcome Back</Text>
          <Text style={[Typography.body, { color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.xl }]}>
            Sign in to your account
          </Text>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={{ color: Colors.danger }}>{error}</Text>
            </View>
          )}

          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={(v) => { setEmail(v); if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined })); }}
            keyboardType="email-address"
            error={fieldErrors.email}
          />

          <View>
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(v) => { setPassword(v); if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined })); }}
              secureTextEntry={!showPass}
              error={fieldErrors.password}
            />
            <TouchableOpacity
              style={styles.showPassBtn}
              onPress={() => setShowPass(!showPass)}
            >
              <Text style={{ color: Colors.primary, fontSize: 13 }}>{showPass ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isLoggingIn}
            style={{ marginTop: Spacing.sm }}
          />

          <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={{ color: Colors.primary, fontWeight: '500' }}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ alignItems: 'center', marginTop: Spacing.sm, padding: Spacing.sm }} onPress={() => router.push('/(auth)/register')}>
            <Text style={{ color: Colors.textSecondary }}>Don't have an account? <Text style={{ color: Colors.primary, fontWeight: '500' }}>Sign Up</Text></Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>SK Associates © {new Date().getFullYear()}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  header: { alignItems: 'center', marginTop: 60, marginBottom: Spacing.xl },
  logoBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoText: { color: Colors.white, fontSize: 28, fontWeight: '800' },
  appName: { fontSize: 24, fontWeight: '700', color: Colors.primary },
  tagline: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  form: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  errorBanner: {
    backgroundColor: Colors.danger + '15',
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  showPassBtn: { position: 'absolute', right: 0, top: 0, padding: 4 },
  forgotBtn: { alignItems: 'center', marginTop: Spacing.md, padding: Spacing.sm },
  footer: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, marginTop: Spacing.xl },
});
