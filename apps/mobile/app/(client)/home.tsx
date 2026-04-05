import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { dashboardApi, notificationApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Card, LoadingScreen, ErrorState } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

function fmt(n: number) { return '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }
function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; }

export default function ClientHome() {
  const [data, setData] = useState<any>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuthStore();
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      setError('');
      const [dash, notifs] = await Promise.all([
        dashboardApi.summary(),
        notificationApi.list(),
      ]);
      setData(dash.data.data);
      setNotifCount(notifs.data.data.filter((n: any) => !n.isRead).length);
    } catch { setError('Failed to load dashboard'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const scoreColor = !data?.honestyScore ? Colors.gray400
    : data.honestyScore.score >= 80 ? Colors.success
    : data.honestyScore.score >= 60 ? Colors.info
    : data.honestyScore.score >= 40 ? Colors.warning
    : Colors.danger;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back 👋</Text>
          <Text style={styles.name}>{user?.name}</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/(client)/notifications' as any)}>
          <Text style={{ fontSize: 22 }}>🔔</Text>
          {notifCount > 0 && (
            <View style={styles.badge}>
              <Text style={{ color: Colors.white, fontSize: 10, fontWeight: '700' }}>{notifCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Due Amount Banner */}
      {data?.totalDue > 0 && (
        <View style={styles.dueBanner}>
          <View>
            <Text style={{ color: Colors.white + 'CC', fontSize: 13 }}>Total Outstanding</Text>
            <Text style={{ color: Colors.white, fontSize: 26, fontWeight: '800' }}>{fmt(data.totalDue)}</Text>
          </View>
          {data.nextDue && (
            <View style={styles.nextDue}>
              <Text style={{ color: Colors.white + 'AA', fontSize: 11 }}>Next due</Text>
              <Text style={{ color: Colors.white, fontWeight: '700' }}>{fmtDate(data.nextDue.dueDate)}</Text>
              <Text style={{ color: Colors.white, fontWeight: '700' }}>{fmt(data.nextDue.totalAmount - data.nextDue.paidAmount)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={{ fontSize: 28 }}>💰</Text>
          <Text style={styles.statVal}>{data?.activeLoans ?? 0}</Text>
          <Text style={styles.statLabel}>Active Loans</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={{ fontSize: 28 }}>🎯</Text>
          <Text style={styles.statVal}>{data?.activeChits ?? 0}</Text>
          <Text style={styles.statLabel}>Active Chits</Text>
        </Card>
        {data?.honestyScore && (
          <Card style={[styles.statCard, { borderTopWidth: 3, borderTopColor: scoreColor }]}>
            <Text style={{ fontSize: 28 }}>⭐</Text>
            <Text style={[styles.statVal, { color: scoreColor }]}>{data.honestyScore.score}</Text>
            <Text style={styles.statLabel}>Credit Score</Text>
          </Card>
        )}
      </View>

      {/* Recent Payments */}
      {data?.recentPayments?.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={Typography.h4}>Recent Payments</Text>
            <TouchableOpacity><Text style={{ color: Colors.primary, fontSize: 13 }}>View All</Text></TouchableOpacity>
          </View>
          {data.recentPayments.map((p: any) => (
            <Card key={p.id} style={styles.payRow}>
              <View style={[styles.payIcon, { backgroundColor: Colors.success + '15' }]}>
                <Text>✅</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={Typography.h4}>{fmt(p.amount)}</Text>
                <Text style={[Typography.caption, { color: Colors.textSecondary }]}>{fmtDate(p.paymentDate)} · {p.method}</Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Empty state for no activity */}
      {!data?.totalDue && !data?.recentPayments?.length && (
        <View style={styles.section}>
          <Card style={{ alignItems: 'center', padding: Spacing.xl }}>
            <Text style={{ fontSize: 48 }}>🎉</Text>
            <Text style={[Typography.h3, { textAlign: 'center', marginTop: Spacing.sm }]}>All Clear!</Text>
            <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs }]}>
              No outstanding payments. Great job!
            </Text>
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, paddingTop: 56, backgroundColor: Colors.primary,
  },
  greeting: { color: Colors.white + 'CC', fontSize: 14 },
  name: { color: Colors.white, fontSize: 22, fontWeight: '700', marginTop: 2 },
  notifBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  badge: {
    position: 'absolute', top: 2, right: 2, width: 16, height: 16,
    borderRadius: 8, backgroundColor: Colors.danger, justifyContent: 'center', alignItems: 'center',
  },
  dueBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.primaryDark, padding: Spacing.lg,
  },
  nextDue: { alignItems: 'flex-end' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
  statCard: { flex: 1, alignItems: 'center', gap: 4, padding: Spacing.sm },
  statVal: { fontSize: 22, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  section: { padding: Spacing.md },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  payIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});
