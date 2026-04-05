import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { loanApi } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { Card, StatusBadge, LoadingScreen, ErrorState, InfoRow, SectionHeader, Button } from '../../../components/ui';
import { Colors, Spacing, Typography } from '../../../constants/theme';

function fmt(n: number) { return '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }
function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; }

export default function LoanDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loan, setLoan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();
  const isAdmin = user?.role === 'ADMIN';

  const load = () => {
    setLoading(true);
    loanApi.getById(id)
      .then(({ data }) => setLoan(data.data))
      .catch(() => setError('Failed to load loan'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const doAction = async (action: 'approve' | 'reject' | 'close', label: string) => {
    Alert.alert(label, `Are you sure you want to ${label.toLowerCase()} this loan?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label, style: action === 'reject' || action === 'close' ? 'destructive' : 'default',
        onPress: async () => {
          setActionLoading(true);
          try {
            if (action === 'approve') await loanApi.approve(id);
            else if (action === 'reject') await loanApi.reject(id);
            else await loanApi.close(id);
            load();
          } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || 'Action failed');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen />;
  if (error || !loan) return <ErrorState message={error || 'Not found'} />;

  const paidCount = loan.installments?.filter((i: any) => i.status === 'PAID').length ?? 0;
  const overdueCount = loan.installments?.filter((i: any) => i.status === 'OVERDUE').length ?? 0;
  const progressPct = loan.tenure > 0 ? Math.round((paidCount / loan.tenure) * 100) : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: Colors.white, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <StatusBadge status={loan.status} />
      </View>

      {/* Loan Summary */}
      <View style={styles.summaryBg}>
        <Text style={styles.loanNo}>{loan.loanNo}</Text>
        <Text style={styles.loanAmt}>{fmt(loan.principalAmount)}</Text>
        <Text style={styles.loanSub}>{loan.interestRate}% p.a. · {loan.tenure} months</Text>
        <Text style={[styles.loanSub, { marginTop: 2 }]}>Customer: {loan.customer?.name}</Text>
      </View>

      {/* Progress */}
      {loan.status === 'ACTIVE' && (
        <Card style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={Typography.h4}>Repayment Progress</Text>
            <Text style={{ color: Colors.primary, fontWeight: '700' }}>{progressPct}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm }}>
            <Text style={Typography.caption}><Text style={{ color: Colors.success }}>✓ {paidCount}</Text> paid</Text>
            {overdueCount > 0 && (
              <Text style={Typography.caption}><Text style={{ color: Colors.danger }}>⚠ {overdueCount}</Text> overdue</Text>
            )}
            <Text style={Typography.caption}>{loan.tenure - paidCount} remaining</Text>
          </View>
        </Card>
      )}

      {/* Details */}
      <Card style={styles.section}>
        <SectionHeader title="Loan Details" />
        <InfoRow label="EMI" value={fmt(loan.emi)} />
        <InfoRow label="Processing Fee" value={fmt(loan.processingFee)} />
        <InfoRow label="Disbursed Amount" value={loan.disbursedAmount ? fmt(loan.disbursedAmount) : '—'} />
        <InfoRow label="Start Date" value={fmtDate(loan.startDate)} />
        <InfoRow label="End Date" value={fmtDate(loan.endDate)} />
        <InfoRow label="Purpose" value={loan.purpose || '—'} />
      </Card>

      {/* Installments */}
      {loan.installments?.length > 0 && (
        <Card style={styles.section}>
          <SectionHeader title={`Schedule (${loan.installments.length} installments)`} />
          {loan.installments.slice(0, 6).map((inst: any) => {
            const color = inst.status === 'PAID' ? Colors.success
              : inst.status === 'OVERDUE' ? Colors.danger
              : Colors.textSecondary;
            return (
              <View key={inst.id} style={styles.instRow}>
                <View style={[styles.instNum, { backgroundColor: color + '20' }]}>
                  <Text style={{ color, fontWeight: '700', fontSize: 12 }}>#{inst.installmentNo}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={Typography.body}>{fmt(inst.totalAmount)}</Text>
                  <Text style={[Typography.caption, { color: Colors.textSecondary }]}>{fmtDate(inst.dueDate)}</Text>
                </View>
                <StatusBadge status={inst.status} />
              </View>
            );
          })}
          {loan.installments.length > 6 && (
            <TouchableOpacity style={{ alignItems: 'center', paddingTop: Spacing.sm }}>
              <Text style={{ color: Colors.primary }}>View all {loan.installments.length} installments</Text>
            </TouchableOpacity>
          )}
        </Card>
      )}

      {/* Actions */}
      {isAdmin && (
        <View style={[styles.section, { paddingBottom: Spacing.xl }]}>
          {loan.status === 'PENDING' && (
            <>
              <Button title="Approve Loan" onPress={() => doAction('approve', 'Approve')} loading={actionLoading} style={{ marginBottom: Spacing.sm }} />
              <Button title="Reject Loan" onPress={() => doAction('reject', 'Reject')} variant="danger" />
            </>
          )}
          {loan.status === 'APPROVED' && (
            <Button
              title="Disburse Loan"
              onPress={() => router.push(`/(admin)/loans/${id}/disburse` as any)}
              loading={actionLoading}
            />
          )}
          {loan.status === 'ACTIVE' && (
            <Button title="Record Payment" onPress={() => router.push(`/(admin)/payments/new?loanId=${id}` as any)} />
          )}
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
  summaryBg: { backgroundColor: Colors.primary, alignItems: 'center', paddingBottom: Spacing.xl, paddingTop: Spacing.sm },
  loanNo: { color: Colors.white + '99', fontSize: 14 },
  loanAmt: { color: Colors.white, fontSize: 36, fontWeight: '800', marginTop: 4 },
  loanSub: { color: Colors.white + 'CC', fontSize: 14 },
  section: { margin: Spacing.md, marginTop: 0 },
  progressBg: { height: 8, backgroundColor: Colors.gray200, borderRadius: 4, marginTop: Spacing.sm },
  progressFill: { height: 8, backgroundColor: Colors.success, borderRadius: 4 },
  instRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  instNum: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});
