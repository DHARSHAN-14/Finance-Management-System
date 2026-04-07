import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { notificationApi } from '../../services/api';
import { Button, Card, EmptyState, ErrorState, LoadingScreen } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleString('en-IN');
  } catch {
    return d;
  }
}

export default function ClientNotifications() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState<any[]>([]);

  const load = useCallback(async () => {
    setError('');
    try {
      const { data } = await notificationApi.list();
      setItems(data.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      load();
    } catch { }
  };

  if (loading) return <LoadingScreen message="Loading notifications..." />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Button title="Mark All" variant="ghost" onPress={markAllRead} />
      </View>

      <FlatList
        contentContainerStyle={{ padding: Spacing.lg, paddingTop: Spacing.md }}
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState title="No notifications" subtitle="You're all caught up." />}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={async () => {
              try {
                if (item?.id && !item?.isRead) await notificationApi.markRead(item.id);
              } catch { }
              load();
            }}
          >
            <Card style={{ ...styles.card, ...(item?.isRead ? {} : styles.unread) }}>
              <Text style={Typography.h4}>{item.title || 'Notification'}</Text>
              {!!item.message && (
                <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 4 }]}>
                  {item.message}
                </Text>
              )}
              <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 8 }]}>
                {item.createdAt ? fmtDate(item.createdAt) : ''}
              </Text>
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
    paddingTop: 56,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  title: { color: Colors.white, fontSize: 20, fontWeight: '800' },
  card: { marginBottom: Spacing.md },
  unread: { borderWidth: 1.5, borderColor: Colors.primary + '55' },
});
