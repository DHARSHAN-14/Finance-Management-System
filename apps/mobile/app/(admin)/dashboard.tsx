import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { dashboardApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import {
  Card, StatCard, SectionHeader, StatusBadge, LoadingScreen, ErrorState,
} from '../../components/ui';
import { LiveClock } from '../../components/LiveClock';
import { Colors, Spacing, Typography } from '../../constants/theme';

function fmt(n: number) {
  return '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuthStore();
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      setError('');
      const [s, a] = await Promise.all([dashboardApi.summary(), dashboardApi.activity()]);
      setSummary(s.data.data);
      setActivity(a.data.data);
    } catch {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <LiveClock variant="hero" />
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userRole}>{user?.role}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <TouchableOpacity style={styles.notifBtn} onPress={() => { }}>
            <Text style={{ fontSize: 22 }}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.section}>
        <View style={styles.statsRow}>
          <StatCard title="Total Customers" value={summary?.totalCustomers ?? 0} icon="👥" color={Colors.primary} />
          <StatCard title="Active Loans" value={summary?.activeLoans ?? 0} icon="💰" color={Colors.success} />
        </View>
        <View style={[styles.statsRow, { marginTop: Spacing.sm }]}>
          <StatCard title="Active Chits" value={summary?.activeChits ?? 0} icon="🎯" color={Colors.accent} />
          <StatCard title="Overdue" value={summary?.overdueCount ?? 0} icon="⚠️" color={Colors.danger} />
        </View>
      </View>

      {/* Financial Summary */}
      <Card style={styles.section}>
        <SectionHeader title="Financial Overview" />
        <View style={styles.finRow}>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>Total Disbursed</Text>
            <Text style={[styles.finValue, { color: Colors.primary }]}>{fmt(summary?.totalDisbursed)}</Text>
          </View>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>Total Collected</Text>
            <Text style={[styles.finValue, { color: Colors.success }]}>{fmt(summary?.totalCollected)}</Text>
          </View>
        </View>
        <View style={styles.finRow}>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>Overdue Amount</Text>
            <Text style={[styles.finValue, { color: Colors.danger }]}>{fmt(summary?.overdueAmount)}</Text>
          </View>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>Collection Rate</Text>
            <Text style={[styles.finValue, { color: Colors.success }]}>{summary?.collectionRate ?? 0}%</Text>
          </View>
        </View>
        <View style={[styles.finRow, { borderBottomWidth: 0 }]}>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>This Month</Text>
            <Text style={[styles.finValue, { color: Colors.info }]}>{fmt(summary?.thisMonthCollection)}</Text>
          </View>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>Payments Count</Text>
            <Text style={[styles.finValue]}>{summary?.thisMonthPaymentCount ?? 0}</Text>
          </View>
        </View>
      </Card>

      {/* Quick Actions */}
      <View style={styles.section}>
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsGrid}>
          {[
            { label: 'Add Customer', icon: '➕', route: '/(admin)/customers/new' },
            { label: 'New Loan', icon: '📋', route: '/(admin)/loans/new' },
            { label: 'Record Payment', icon: '💳', route: '/(admin)/payments/new' },
            { label: 'New Chit', icon: '🎯', route: '/(admin)/chits/new' },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionBtn}
              onPress={() => router.push(action.route as any)}
            >
              <Text style={{ fontSize: 26 }}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Payments */}
      {activity?.recentPayments?.length > 0 && (
        <View style={[styles.section, { paddingBottom: Spacing.xl }]}>
          <SectionHeader
            title="Recent Payments"
            action={
              <TouchableOpacity onPress={() => router.push('/(admin)/payments' as any)}>
                <Text style={{ color: Colors.primary, fontSize: 13 }}>View All</Text>
              </TouchableOpacity>
            }
          />
          {activity.recentPayments.slice(0, 5).map((p: any) => (
            <Card key={p.id} style={styles.paymentRow}>
              <View style={{ flex: 1 }}>
                <Text style={Typography.h4}>{p.customer?.name}</Text>
                <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                  {new Date(p.paymentDate).toLocaleDateString('en-IN')} · {p.method}
                </Text>
              </View>
              <Text style={{ color: Colors.success, fontWeight: '700', fontSize: 16 }}>
                {fmt(p.amount)}
              </Text>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    paddingTop: 56,
    backgroundColor: Colors.primary,
  },
  greeting: { color: Colors.white + 'CC', fontSize: 14 },
  userName: { color: Colors.white, fontSize: 22, fontWeight: '700', marginTop: 2 },
  userRole: { color: Colors.white + '99', fontSize: 12, marginTop: 2 },
  notifBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.white + '20', justifyContent: 'center', alignItems: 'center',
  },
  section: { padding: Spacing.md },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  finRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  finItem: { flex: 1 },
  finLabel: { ...Typography.caption, color: Colors.textSecondary },
  finValue: { fontSize: 17, fontWeight: '700', color: Colors.text, marginTop: 2 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actionBtn: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
});
