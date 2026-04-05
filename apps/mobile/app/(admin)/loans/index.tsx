import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { loanApi } from '../../../services/api';
import { StatusBadge, LoadingScreen, ErrorState, EmptyState } from '../../../components/ui';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../../constants/theme';

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

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: Colors.success, APPROVED: Colors.info, PENDING: Colors.warning,
      CLOSED: Colors.gray500, OVERDUE: Colors.danger, DISBURSED: Colors.primaryLight,
    };
    return map[status] ?? Colors.gray500;
  };

  const renderItem = ({ item, index }: any) => (
    <TouchableOpacity
      onPress={() => router.push(`/(admin)/loans/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.loanCard, index === 0 && { marginTop: 4 }]}>
        {/* Top Row: Loan Number + Status */}
        <View style={styles.cardTopRow}>
          <View style={styles.loanIdBadge}>
            <Text style={styles.loanIdText}>{item.loanNo}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        {/* Customer Info */}
        <View style={styles.customerRow}>
          <View style={[styles.avatar, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.avatarText, { color: getStatusColor(item.status) }]}>
              {(item.customer?.name ?? 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.customerName}>{item.customer?.name}</Text>
            <Text style={styles.customerPhone}>{item.customer?.phone}</Text>
          </View>
        </View>

        {/* Financial Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Principal</Text>
            <Text style={styles.detailValue}>{fmt(item.principalAmount)}</Text>
          </View>
          <View style={[styles.detailItem, styles.detailItemBorder]}>
            <Text style={styles.detailLabel}>EMI</Text>
            <Text style={[styles.detailValue, { color: Colors.primary }]}>{fmt(item.emi)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Tenure</Text>
            <Text style={styles.detailValue}>{item.tenure}m</Text>
          </View>
        </View>

        {/* Bottom Info */}
        <View style={styles.cardBottom}>
          <Text style={styles.rateText}>{item.interestRate}% p.a.</Text>
          <Text style={styles.viewText}>View Details →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{customerId ? 'Customer Loans' : 'Loan Management'}</Text>
          <Text style={styles.headerSubtitle}>{loans.length} total loans</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(admin)/loans/new' as any)}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          keyExtractor={(i) => i}
          contentContainerStyle={styles.filterRow}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const active = statusFilter === item;
            return (
              <TouchableOpacity
                onPress={() => setStatusFilter(item)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Loan List */}
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[Colors.primary]} />}
          ListEmptyComponent={
            <EmptyState
              title="No loans found"
              subtitle="Tap the + button to create a new loan application"
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: 20,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { color: Colors.white, fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  headerSubtitle: { color: Colors.white + 'AA', fontSize: 13, marginTop: 4 },
  addBtn: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: Colors.white + '25',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.white + '40',
  },
  addBtnText: { color: Colors.white, fontSize: 26, fontWeight: '600', marginTop: -2 },

  // Filters
  filterContainer: { backgroundColor: Colors.white, ...Shadow.sm, marginBottom: 4 },
  filterRow: { paddingHorizontal: Spacing.md, paddingVertical: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.gray100, borderWidth: 1.5, borderColor: Colors.gray200,
  },
  filterChipActive: {
    backgroundColor: Colors.primary, borderColor: Colors.primary,
    ...Shadow.sm,
  },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.gray600 },
  filterTextActive: { color: Colors.white },

  // Loan Card
  loanCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    ...Shadow.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  cardTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14,
  },
  loanIdBadge: {
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  loanIdText: { fontSize: 12, fontWeight: '700', color: Colors.primary, letterSpacing: 0.5 },
  customerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800' },
  customerName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  customerPhone: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  // Details Grid
  detailsGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.gray50,
    borderRadius: 12, padding: 14,
    marginBottom: 12,
  },
  detailItem: { flex: 1, alignItems: 'center' },
  detailItemBorder: {
    borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: Colors.gray200,
    marginHorizontal: 4,
  },
  detailLabel: { fontSize: 11, fontWeight: '500', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 16, fontWeight: '800', color: Colors.text, marginTop: 4 },

  // Bottom
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  rateText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  viewText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
});
