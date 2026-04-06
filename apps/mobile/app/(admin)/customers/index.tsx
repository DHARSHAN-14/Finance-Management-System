import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { customerApi } from '../../../services/api';
import { Card, StatusBadge, LoadingScreen, ErrorState, EmptyState } from '../../../components/ui';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../../constants/theme';

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'PENDING', 'INACTIVE'] as const;

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  const load = useCallback(async (reset = false) => {
    try {
      setError('');
      const p = reset ? 1 : page;
      const params: any = { page: p, limit: 20, search: search || undefined };
      if (statusFilter === 'ACTIVE') params.isActive = 'true';
      if (statusFilter === 'PENDING' || statusFilter === 'INACTIVE') params.isActive = 'false';

      const { data } = await customerApi.list(params);
      const list = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.data?.customers)
          ? data.data.customers
          : [];
      if (reset) {
        setCustomers(list);
        setPage(2);
      } else {
        setCustomers((prev) => [...prev, ...list]);
        setPage((prev) => prev + 1);
      }
      setHasMore(list.length === 20);
    } catch {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, page, statusFilter]);

  useEffect(() => { load(true); }, [search, statusFilter]);
  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [load])
  );

  const approve = useCallback((customer: any) => {
    Alert.alert(
      'Confirm customer?',
      `Approve ${customer.name} to activate their login?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setApprovingId(customer.id);
              await customerApi.activate(customer.id);
              await load(true);
            } catch (e: any) {
              const msg = e?.response?.data?.message || e?.message || 'Failed to confirm customer';
              Alert.alert('Error', msg);
            } finally {
              setApprovingId(null);
            }
          },
        },
      ]
    );
  }, [load]);

  const renderItem = ({ item }: any) => {
    const score = item.honestyScores?.[0];
    const scoreColor = score?.score >= 80 ? Colors.success
      : score?.score >= 60 ? Colors.info
        : score?.score >= 40 ? Colors.warning
          : Colors.danger;

    return (
      <TouchableOpacity onPress={() => router.push(`/(admin)/customers/${item.id}` as any)}>
        <Card style={styles.item}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={Typography.h4}>{item.name}</Text>
            <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>{item.phone}</Text>
            <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: 2 }]}>
              {item._count?.loans ?? 0} loans · {item._count?.chitMembers ?? 0} chits
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            {score && (
              <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '15' }]}>
                <Text style={{ color: scoreColor, fontWeight: '700', fontSize: 13 }}>{score.score}</Text>
              </View>
            )}
            {!item.isActive && (
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <StatusBadge status={statusFilter === 'PENDING' ? 'PENDING' : 'INACTIVE'} />
                {statusFilter === 'PENDING' && (
                  <TouchableOpacity
                    onPress={(e: any) => { e?.stopPropagation?.(); approve(item); }}
                    disabled={approvingId === item.id}
                    style={[styles.confirmBtn, approvingId === item.id && { opacity: 0.6 }]}
                  >
                    <Text style={styles.confirmBtnText}>{approvingId === item.id ? 'Confirming…' : 'Confirm'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Customers</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(admin)/customers/new' as any)}
        >
          <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 22 }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, or ID..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={(v) => { setSearch(v); setPage(1); }}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={STATUS_FILTERS as any}
          keyExtractor={(i) => i}
          contentContainerStyle={styles.filterRow}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const active = statusFilter === item;
            return (
              <TouchableOpacity
                onPress={() => { setStatusFilter(item); setPage(1); }}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {error ? (
        <ErrorState message={error} onRetry={() => load(true)} />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
          onEndReached={() => hasMore && load()}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={<EmptyState title="No customers found" subtitle="Add your first customer" />}
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
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, margin: Spacing.md,
    paddingHorizontal: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: Colors.text },

  // Filters (Loans-style)
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

  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: Colors.primary, fontWeight: '700', fontSize: 18 },
  scoreBadge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: Radius.full, alignItems: 'center',
  },
  confirmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    ...Shadow.sm,
  },
  confirmBtnText: { color: Colors.white, fontWeight: '700', fontSize: 12 },
});
