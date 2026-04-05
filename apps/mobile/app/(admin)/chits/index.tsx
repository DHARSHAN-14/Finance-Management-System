import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { chitApi } from '../../../services/api';
import { Card, StatusBadge, LoadingScreen, ErrorState, EmptyState } from '../../../components/ui';
import { Colors, Spacing, Typography } from '../../../constants/theme';

function fmt(n: number) { return '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }

export default function ChitsScreen() {
  const [chits, setChits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      setError('');
      const { data } = await chitApi.list();
      setChits(data.data);
    } catch { setError('Failed to load chits'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: any) => (
    <TouchableOpacity onPress={() => router.push(`/(admin)/chits/${item.id}` as any)}>
      <Card style={styles.item}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={Typography.h4}>{item.name}</Text>
            <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 2 }]}>
              {fmt(item.totalValue)} total · {fmt(item.monthlyContribution)}/month
            </Text>
            <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
              {item.duration} months · {item._count?.members ?? 0} members
            </Text>
            {item.startDate && (
              <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 2 }]}>
                Started: {new Date(item.startDate).toLocaleDateString('en-IN')}
              </Text>
            )}
          </View>
          <StatusBadge status={item.status} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chit Funds</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(admin)/chits/new' as any)}>
          <Text style={{ color: Colors.white, fontSize: 22, fontWeight: '700' }}>+</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={chits}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<EmptyState title="No chit funds" subtitle="Create the first chit fund" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.md,
    backgroundColor: Colors.primary,
  },
  title: { color: Colors.white, fontSize: 22, fontWeight: '700' },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white + '30', justifyContent: 'center', alignItems: 'center',
  },
  item: {},
});
