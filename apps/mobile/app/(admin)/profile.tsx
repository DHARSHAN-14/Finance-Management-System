import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Card, Button, InfoRow } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

const MENU_ITEMS = [
  { icon: '🏦', label: 'Overdue Loans', route: '/(admin)/loans?status=OVERDUE' },
  { icon: '📊', label: 'Leaderboard', route: '/(admin)/leaderboard' },
  { icon: '🔔', label: 'Broadcast Notification', route: '/(admin)/notifications' },
];

export default function AdminProfile() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
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
        <View style={styles.rolePill}>
          <Text style={{ color: Colors.white, fontSize: 12, fontWeight: '700' }}>{user?.role}</Text>
        </View>
      </View>

      <Card style={styles.section}>
        <Text style={[Typography.h4, { marginBottom: Spacing.sm }]}>Account Info</Text>
        <InfoRow label="Name" value={user?.name || '—'} />
        <InfoRow label="Email" value={user?.email || '—'} />
        <InfoRow label="Phone" value={user?.phone || '—'} />
        <InfoRow label="Role" value={user?.role || '—'} />
      </Card>

      <Card style={styles.section}>
        <Text style={[Typography.h4, { marginBottom: Spacing.sm }]}>Quick Links</Text>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            <Text style={{ fontSize: 20 }}>{item.icon}</Text>
            <Text style={[Typography.body, { flex: 1, marginLeft: Spacing.sm }]}>{item.label}</Text>
            <Text style={{ color: Colors.textMuted }}>›</Text>
          </TouchableOpacity>
        ))}
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
  rolePill: {
    marginTop: Spacing.sm, backgroundColor: Colors.white + '25',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },
  section: { margin: Spacing.md, marginTop: 0 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
});
