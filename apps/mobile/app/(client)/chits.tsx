import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { chitApi } from '../../services/api';
import { Card, EmptyState, ErrorState, LoadingScreen, StatusBadge } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

export default function ClientChits() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState<any[]>([]);

  const load = useCallback(async () => {
    setError('');
    try {
      const { data } = await chitApi.myChits();
      setItems(data.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load chits');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingScreen message="Loading chits..." />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Chits</Text>
      </View>

      <FlatList
        contentContainerStyle={{ padding: Spacing.lg, paddingTop: Spacing.md }}
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState title="No chits" subtitle="You are not enrolled in any chit funds yet." />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85}>
            <Card style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={Typography.h4}>{item.name}</Text>
                  {!!item.monthlyContribution && (
                    <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 2 }]}>
                      ₹{Number(item.monthlyContribution).toLocaleString('en-IN')} / month
                    </Text>
                  )}
                </View>
                <StatusBadge status={item.status || 'ACTIVE'} />
              </View>
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
  },
  title: { color: Colors.white, fontSize: 20, fontWeight: '800' },
  card: { marginBottom: Spacing.md },
});

