import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Card, Button, InfoRow } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

export default function ClientProfile() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <Card style={styles.section}>
        <Text style={[Typography.h4, { marginBottom: Spacing.sm }]}>Account Details</Text>
        <InfoRow label="Name" value={user?.name || '—'} />
        <InfoRow label="Email" value={user?.email || '—'} />
        <InfoRow label="Phone" value={user?.phone || '—'} />
        <InfoRow label="Account Type" value="Client" />
      </Card>

      <View style={[styles.section, { paddingBottom: 80 }]}>
        <Button title="Logout" onPress={handleLogout} variant="danger" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    alignItems: 'center', backgroundColor: Colors.primary,
    paddingTop: 60, paddingBottom: Spacing.xl,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.white + '30', justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: { color: Colors.white, fontSize: 32, fontWeight: '800' },
  name: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  email: { color: Colors.white + 'AA', fontSize: 14, marginTop: 2 },
  section: { margin: Spacing.md, marginTop: 0 },
});
