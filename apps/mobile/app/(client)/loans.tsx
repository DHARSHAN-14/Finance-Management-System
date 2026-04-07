import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { loanApi } from '../../services/api';
import { Card, EmptyState, ErrorState, LoadingScreen, StatusBadge } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, Typography } from '../../constants/theme';

function fmt(n: number) {
  return '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export default function ClientLoans() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState<any[]>([]);

  const load = useCallback(async () => {
    setError('');
    try {
      const params = user?.customerId ? { customerId: user.customerId } : undefined;
      const { data } = await loanApi.list(params);
      setItems(data.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load loans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.customerId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingScreen message="Loading loans..." />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Loans</Text>
      </View>

      <FlatList
        contentContainerStyle={{ padding: Spacing.lg, paddingTop: Spacing.md }}
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState title="No loans" subtitle="You don't have any loans yet." />}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              // Reuse the existing loan detail page for now.
              if (item?.id) router.push(`/(admin)/loans/${item.id}` as any);
            }}
          >
            <Card style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={Typography.h4}>{item.loanNo || 'Loan'}</Text>
                  <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 2 }]}>
                    {fmt(item.principalAmount ?? item.principal ?? 0)} · EMI {fmt(item.emi ?? 0)}
                  </Text>
                </View>
                <StatusBadge status={item.status || 'PENDING'} />
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

