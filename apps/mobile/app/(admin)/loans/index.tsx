import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { loanApi } from '../../../services/api';
import { Card, StatusBadge, LoadingScreen, ErrorState, EmptyState } from '../../../components/ui';
import { Colors, Spacing, Typography, Radius } from '../../../constants/theme';

function fmt(n: number) { return '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }

const STATUS_FILTERS = ['ALL', 'PENDING', 'ACTIVE', 'APPROVED', 'CLOSED', 'OVERDUE'];

export default function LoansScreen() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      setError('');
      const params: any = { limit: 50 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (customerId) params.customerId = customerId;
      const { data } = await loanApi.list(params);
      setLoans(data.data);
    } catch {
      setError('Failed to load loans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, customerId]);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: any) => (
    <TouchableOpacity onPress={() => router.push(`/(admin)/loans/${item.id}` as any)}>
      <Card style={styles.item}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={Typography.h4}>{item.loanNo}</Text>
            <StatusBadge status={item.status} />
          </View>
          <Text style={[Typography.body, { marginTop: 4 }]}>{item.customer?.name}</Text>
          <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 2 }]}>
            {item.customer?.phone}
          </Text>
          <View style={styles.loanMeta}>
            <Text style={styles.metaItem}>Principal: <Text style={{ fontWeight: '700' }}>{fmt(item.principalAmount)}</Text></Text>
            <Text style={styles.metaItem}>EMI: <Text style={{ fontWeight: '700', color: Colors.primary }}>{fmt(item.emi)}</Text></Text>
          </View>
          <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
            {item.interestRate}% p.a. · {item.tenure} months
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{customerId ? 'Customer Loans' : 'Loans'}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(admin)/loans/new' as any)}>
          <Text style={{ color: Colors.white, fontSize: 22, fontWeight: '700' }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Filter pills */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(i) => i}
        contentContainerStyle={styles.filterRow}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setStatusFilter(item)}
            style={[styles.filterPill, statusFilter === item && styles.filterPillActive]}
          >
            <Text style={[styles.filterText, statusFilter === item && { color: Colors.white }]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<EmptyState title="No loans found" subtitle="Create the first loan" />}
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
  filterRow: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full,
    backgroundColor: Colors.gray100, borderWidth: 1, borderColor: Colors.border,
  },
  filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  item: { gap: Spacing.xs },
  loanMeta: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.xs },
  metaItem: { fontSize: 13, color: Colors.textSecondary },
});
