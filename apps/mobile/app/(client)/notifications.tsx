import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { notificationApi } from '../../services/api';
import { Card, LoadingScreen, EmptyState } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { useRouter } from 'expo-router';

const TYPE_ICON: Record<string, string> = {
  SUCCESS: '✅', WARNING: '⚠️', DANGER: '🚨', INFO: 'ℹ️', ANNOUNCEMENT: '📣',
};

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const load = async () => {
    try {
      const { data } = await notificationApi.list();
      setNotifs(data.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await notificationApi.markAllRead();
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: Colors.white, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={{ color: Colors.white + 'CC', fontSize: 13 }}>Mark All Read</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={notifs}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState title="No notifications" subtitle="You're all caught up!" />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={async () => { await notificationApi.markRead(item.id); setNotifs((p) => p.map((n) => n.id === item.id ? { ...n, isRead: true } : n)); }}>
            <Card style={[styles.item, !item.isRead && styles.unread]}>
              <Text style={{ fontSize: 24 }}>{TYPE_ICON[item.type] ?? 'ℹ️'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.h4, { fontWeight: item.isRead ? '500' : '700' }]}>{item.title}</Text>
                <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 2 }]}>{item.body}</Text>
                <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 4 }]}>
                  {new Date(item.createdAt).toLocaleString('en-IN')}
                </Text>
              </View>
              {!item.isRead && <View style={styles.unreadDot} />}
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, paddingTop: 56, backgroundColor: Colors.primary,
  },
  title: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  unread: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  unreadDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary,
    position: 'absolute', top: Spacing.md, right: Spacing.md,
  },
});
