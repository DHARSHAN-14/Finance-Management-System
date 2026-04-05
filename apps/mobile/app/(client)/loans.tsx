import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { loanApi } from '../../services/api';
import { Card, StatusBadge, LoadingScreen, ErrorState, EmptyState } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

function fmt(n: number) { return '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }

export default function ClientLoans() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const load = async () => {
    try {
      const { data } = await loanApi.list();
      setLoans(data.data);
    } catch { setError('Failed to load loans'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Loans</Text>
      </View>
      {error ? <ErrorState message={error} onRetry={load} /> : (
        <FlatList
          data={loans}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<EmptyState title="No loans" subtitle="You have no active loans" />}
          renderItem={({ item }) => {
            const pending = item.installments?.filter((i: any) => ['PENDING', 'OVERDUE'].includes(i.status)) ?? [];
            const overdue = pending.filter((i: any) => i.status === 'OVERDUE');
            return (
              <TouchableOpacity onPress={() => router.push(`/(client)/loan/${item.id}` as any)}>
                <Card style={styles.loanCard}>
                  <View style={styles.loanTop}>
                    <View>
                      <Text style={Typography.caption}>{item.loanNo}</Text>
                      <Text style={[Typography.h2, { color: Colors.primary }]}>{fmt(item.principalAmount)}</Text>
                    </View>
                    <StatusBadge status={item.status} />
                  </View>
                  <View style={styles.loanDetails}>
                    <View style={styles.detail}>
                      <Text style={styles.detailLabel}>EMI</Text>
                      <Text style={styles.detailValue}>{fmt(item.emi)}</Text>
                    </View>
                    <View style={styles.detail}>
                      <Text style={styles.detailLabel}>Rate</Text>
                      <Text style={styles.detailValue}>{item.interestRate}%</Text>
                    </View>
                    <View style={styles.detail}>
                      <Text style={styles.detailLabel}>Tenure</Text>
                      <Text style={styles.detailValue}>{item.tenure}m</Text>
                    </View>
                  </View>
                  {overdue.length > 0 && (
                    <View style={styles.overdueBanner}>
                      <Text style={{ color: Colors.danger, fontWeight: '600', fontSize: 13 }}>
                        ⚠️ {overdue.length} overdue installment{overdue.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.md,
    backgroundColor: Colors.primary,
  },
  title: { color: Colors.white, fontSize: 22, fontWeight: '700' },
  loanCard: { gap: Spacing.sm },
  loanTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  loanDetails: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.gray50, borderRadius: 8, padding: Spacing.sm },
  detail: { alignItems: 'center' },
  detailLabel: { fontSize: 11, color: Colors.textSecondary },
  detailValue: { fontSize: 15, fontWeight: '700', color: Colors.text },
  overdueBanner: { backgroundColor: Colors.danger + '10', borderRadius: 8, padding: Spacing.sm },
});
