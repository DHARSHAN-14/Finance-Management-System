import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { chitApi } from '../../services/api';
import { Card, StatusBadge, LoadingScreen, ErrorState, EmptyState } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

function fmt(n: number) { return '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }

export default function ClientChits() {
  const [chits, setChits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await chitApi.myChits();
      setChits(data.data);
    } catch { setError('Failed to load chits'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Chit Funds</Text>
      </View>
      {error ? <ErrorState message={error} onRetry={load} /> : (
        <FlatList
          data={chits}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<EmptyState title="No chit funds" subtitle="You are not part of any chit fund yet" />}
          renderItem={({ item }) => (
            <Card style={styles.chitCard}>
              <View style={styles.chitTop}>
                <View style={{ flex: 1 }}>
                  <Text style={Typography.h4}>{item.chit.name}</Text>
                  <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 2 }]}>
                    Ticket #{item.ticketNo}
                  </Text>
                </View>
                <StatusBadge status={item.chit.status} />
              </View>
              <View style={styles.chitDetails}>
                <View style={styles.detail}>
                  <Text style={styles.detailLabel}>Monthly</Text>
                  <Text style={styles.detailValue}>{fmt(item.chit.monthlyContribution)}</Text>
                </View>
                <View style={styles.detail}>
                  <Text style={styles.detailLabel}>Total Value</Text>
                  <Text style={styles.detailValue}>{item.chit._count?.members ? fmt(item.chit.monthlyContribution * item.chit._count.members) : '—'}</Text>
                </View>
                <View style={styles.detail}>
                  <Text style={styles.detailLabel}>Members</Text>
                  <Text style={styles.detailValue}>{item.chit._count?.members ?? '—'}</Text>
                </View>
              </View>
              {item.hasReceived && (
                <View style={styles.receivedBanner}>
                  <Text style={{ color: Colors.success, fontWeight: '600', fontSize: 13 }}>
                    ✅ Received {item.receivedAmount ? fmt(item.receivedAmount) : ''} on {item.receivedAt ? new Date(item.receivedAt).toLocaleDateString('en-IN') : '—'}
                  </Text>
                </View>
              )}
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.md, backgroundColor: Colors.primary },
  title: { color: Colors.white, fontSize: 22, fontWeight: '700' },
  chitCard: { gap: Spacing.sm },
  chitTop: { flexDirection: 'row', alignItems: 'flex-start' },
  chitDetails: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.gray50, borderRadius: 8, padding: Spacing.sm },
  detail: { alignItems: 'center' },
  detailLabel: { fontSize: 11, color: Colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '700', color: Colors.text },
  receivedBanner: { backgroundColor: Colors.success + '10', borderRadius: 8, padding: Spacing.sm },
});
