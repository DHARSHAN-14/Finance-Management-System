import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { loanApi } from '../../../services/api';
import { Card, StatusBadge, LoadingScreen, ErrorState, InfoRow, SectionHeader } from '../../../components/ui';
import { Colors, Spacing, Typography } from '../../../constants/theme';

function fmt(n: number) { return '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }
function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; }

export default function ClientLoanDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loan, setLoan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loanApi.getById(id)
      .then(({ data }) => setLoan(data.data))
      .catch(() => setError('Failed to load loan'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingScreen />;
  if (error || !loan) return <ErrorState message={error || 'Not found'} />;

  const paidCount = loan.installments?.filter((i: any) => i.status === 'PAID').length ?? 0;
  const overdueInsts = loan.installments?.filter((i: any) => i.status === 'OVERDUE') ?? [];
  const pendingInsts = loan.installments?.filter((i: any) => ['PENDING', 'OVERDUE', 'PARTIAL'].includes(i.status)) ?? [];
  const totalPaid = loan.installments?.reduce((s: number, i: any) => s + i.paidAmount, 0) ?? 0;
  const totalDue = pendingInsts.reduce((s: number, i: any) => s + (i.totalAmount - i.paidAmount), 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: Colors.white, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <StatusBadge status={loan.status} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.loanNo}>{loan.loanNo}</Text>
        <Text style={styles.loanAmt}>{fmt(loan.principalAmount)}</Text>
        <Text style={styles.loanSub}>{loan.interestRate}% p.a. · {loan.tenure} months</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statVal}>{fmt(loan.emi)}</Text>
          <Text style={styles.statLabel}>Monthly EMI</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statVal, { color: Colors.success }]}>{fmt(totalPaid)}</Text>
          <Text style={styles.statLabel}>Total Paid</Text>
        </Card>
        <Card style={[styles.statCard, totalDue > 0 && { borderTopWidth: 3, borderTopColor: Colors.danger }]}>
          <Text style={[styles.statVal, { color: totalDue > 0 ? Colors.danger : Colors.success }]}>{fmt(totalDue)}</Text>
          <Text style={styles.statLabel}>Outstanding</Text>
        </Card>
      </View>

      {/* Overdue Alert */}
      {overdueInsts.length > 0 && (
        <View style={styles.overdueBanner}>
          <Text style={{ color: Colors.danger, fontWeight: '700', fontSize: 15 }}>
            ⚠️ {overdueInsts.length} overdue installment{overdueInsts.length > 1 ? 's' : ''}
          </Text>
          <Text style={[Typography.bodySmall, { color: Colors.danger + 'CC', marginTop: 4 }]}>
            Please contact SK Associates to clear overdue payments.
          </Text>
        </View>
      )}

      {/* Progress */}
      {loan.status === 'ACTIVE' && (
        <Card style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={Typography.h4}>Repayment</Text>
            <Text style={{ color: Colors.primary, fontWeight: '700' }}>{paidCount}/{loan.tenure}</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${(paidCount / loan.tenure) * 100}%` }]} />
          </View>
        </Card>
      )}

      {/* Details */}
      <Card style={styles.section}>
        <SectionHeader title="Loan Details" />
        <InfoRow label="Disbursed" value={loan.disbursedAmount ? fmt(loan.disbursedAmount) : '—'} />
        <InfoRow label="Start Date" value={fmtDate(loan.startDate)} />
        <InfoRow label="End Date" value={fmtDate(loan.endDate)} />
        <InfoRow label="Purpose" value={loan.purpose || '—'} />
      </Card>

      {/* Schedule */}
      {loan.installments?.length > 0 && (
        <Card style={[styles.section, { marginBottom: Spacing.xl }]}>
          <SectionHeader title="Payment Schedule" />
          {loan.installments.map((inst: any) => {
            const color = inst.status === 'PAID' ? Colors.success
              : inst.status === 'OVERDUE' ? Colors.danger
                : Colors.textSecondary;
            return (
              <View key={inst.id} style={styles.instRow}>
                <View style={[styles.instDot, { backgroundColor: color + '20' }]}>
                  <Text style={{ color, fontWeight: '700', fontSize: 11 }}>#{inst.installmentNo}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={Typography.body}>{fmt(inst.totalAmount)}</Text>
                  <Text style={[Typography.caption, { color: Colors.textSecondary }]}>{fmtDate(inst.dueDate)}</Text>
                </View>
                <StatusBadge status={inst.status} />
              </View>
            );
          })}
        </Card>
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
  hero: { backgroundColor: Colors.primary, alignItems: 'center', paddingBottom: Spacing.xl },
  loanNo: { color: Colors.white + '99', fontSize: 13 },
  loanAmt: { color: Colors.white, fontSize: 36, fontWeight: '800', marginTop: 4 },
  loanSub: { color: Colors.white + 'CC', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
  statCard: { flex: 1, alignItems: 'center', padding: Spacing.sm },
  statVal: { fontSize: 16, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
  overdueBanner: {
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    backgroundColor: Colors.danger + '10', borderRadius: 12, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.danger + '30',
  },
  section: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm },
  progressBg: { height: 8, backgroundColor: Colors.gray200, borderRadius: 4, marginTop: Spacing.sm },
  progressFill: { height: 8, backgroundColor: Colors.success, borderRadius: 4 },
  instRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  instDot: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});
