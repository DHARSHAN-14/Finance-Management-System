import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Button, Card, InfoRow, SectionHeader } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

export default function ClientProfile() {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={{ padding: Spacing.lg }}>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SectionHeader title="Account" />
          <InfoRow label="Name" value={user?.name || '—'} />
          <InfoRow label="Email" value={user?.email || '—'} />
          <InfoRow label="Role" value={user?.role || '—'} />
          <InfoRow label="Phone" value={user?.phone || '—'} />
        </Card>

        <Button
          title="Logout"
          variant="danger"
          onPress={() => {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: () => logout() },
            ]);
          }}
        />

        <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: Spacing.md }]}>
          Client accounts may require admin approval before login.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 56,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.primary,
  },
  title: { color: Colors.white, fontSize: 20, fontWeight: '800' },
});

