import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleSubmit = () => {
    if (!email) { Alert.alert('Error', 'Please enter your email'); return; }
    // In production: call API to send reset link
    setSubmitted(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={{ color: Colors.primary, fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>

      <Text style={Typography.h2}>Forgot Password</Text>
      <Text style={[Typography.body, { color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.xl }]}>
        Contact your administrator to reset your password.
      </Text>

      {!submitted ? (
        <>
          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Button title="Send Reset Link" onPress={handleSubmit} />
        </>
      ) : (
        <View style={styles.successBox}>
          <Text style={{ fontSize: 48, textAlign: 'center' }}>📧</Text>
          <Text style={[Typography.h3, { textAlign: 'center', marginTop: Spacing.md }]}>Request Sent</Text>
          <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }]}>
            Please contact your SK Associates administrator to reset your password.
          </Text>
          <Button title="Back to Login" onPress={() => router.replace('/(auth)/login')} style={{ marginTop: Spacing.lg }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg, paddingTop: 60 },
  back: { marginBottom: Spacing.xl },
  successBox: { backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.lg },
});
