import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { customerApi } from '../../../services/api';
import { Card, StatusBadge, LoadingScreen, ErrorState, EmptyState } from '../../../components/ui';
import { Colors, Spacing, Typography, Radius } from '../../../constants/theme';

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  const load = useCallback(async (reset = false) => {
    try {
      setError('');
      const p = reset ? 1 : page;
      const { data } = await customerApi.list({ page: p, limit: 20, search: search || undefined });
      const list = data.data;
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
  }, [search, page]);

  useEffect(() => { load(true); }, [search]);

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
            {!item.isActive && <StatusBadge status="INACTIVE" />}
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
          placeholder="Search by name or phone..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={(v) => { setSearch(v); setPage(1); }}
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
});
