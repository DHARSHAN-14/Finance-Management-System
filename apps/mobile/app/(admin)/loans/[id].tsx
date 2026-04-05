import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { loanApi } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { StatusBadge, LoadingScreen, ErrorState, Button, SectionHeader } from '../../../components/ui';
import { Colors, Spacing, Typography, Shadow, Radius } from '../../../constants/theme';

function fmt(n: number) { return '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }
function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }

export default function LoanDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loan, setLoan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showAllInst, setShowAllInst] = useState(false);
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
  const pendingCount = loan.tenure - paidCount;
  const progressPct = loan.tenure > 0 ? Math.round((paidCount / loan.tenure) * 100) : 0;
  const paidAmount = loan.installments?.reduce((s: number, i: any) => i.status === 'PAID' ? s + i.totalAmount : s, 0) ?? 0;
  const totalPayable = loan.emi * loan.tenure;
  const displayInstallments = showAllInst ? loan.installments : loan.installments?.slice(0, 5);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Header */}
      <View style={styles.heroSection}>
        <View style={styles.heroTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <StatusBadge status={loan.status} />
        </View>

        <Text style={styles.loanNo}>{loan.loanNo}</Text>
        <Text style={styles.heroAmount}>{fmt(loan.principalAmount)}</Text>

        <View style={styles.heroMeta}>
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaLabel}>Interest</Text>
            <Text style={styles.heroMetaValue}>{loan.interestRate}%</Text>
          </View>
          <View style={styles.heroMetaDivider} />
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaLabel}>Tenure</Text>
            <Text style={styles.heroMetaValue}>{loan.tenure} mo</Text>
          </View>
          <View style={styles.heroMetaDivider} />
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaLabel}>EMI</Text>
            <Text style={styles.heroMetaValue}>{fmt(loan.emi)}</Text>
          </View>
        </View>
      </View>

      {/* Customer Card */}
      <View style={styles.cardWrapper}>
        <View style={styles.card}>
          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>{(loan.customer?.name ?? 'U')[0]}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.customerName}>{loan.customer?.name}</Text>
              <Text style={styles.customerPhone}>{loan.customer?.phone}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Progress Section */}
      {(loan.status === 'ACTIVE' || loan.status === 'DISBURSED') && (
        <View style={styles.cardWrapper}>
          <View style={styles.card}>
            <View style={styles.progressHeader}>
              <Text style={styles.sectionTitle}>Repayment Progress</Text>
              <Text style={styles.progressPct}>{progressPct}%</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>

            {/* Progress Stats */}
            <View style={styles.progressStats}>
              <View style={styles.progressStat}>
                <View style={[styles.statDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.statText}>{paidCount} Paid</Text>
              </View>
              {overdueCount > 0 && (
                <View style={styles.progressStat}>
                  <View style={[styles.statDot, { backgroundColor: Colors.danger }]} />
                  <Text style={styles.statText}>{overdueCount} Overdue</Text>
                </View>
              )}
              <View style={styles.progressStat}>
                <View style={[styles.statDot, { backgroundColor: Colors.gray300 }]} />
                <Text style={styles.statText}>{pendingCount} Remaining</Text>
              </View>
            </View>

            {/* Amount Summary */}
            <View style={styles.amountSummary}>
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>Paid</Text>
                <Text style={[styles.amountValue, { color: Colors.success }]}>{fmt(paidAmount)}</Text>
              </View>
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>Remaining</Text>
                <Text style={[styles.amountValue, { color: Colors.warning }]}>{fmt(totalPayable - paidAmount)}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Loan Details */}
      <View style={styles.cardWrapper}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Loan Details</Text>
          <View style={styles.detailsGrid}>
            {[
              { label: 'Processing Fee', value: fmt(loan.processingFee), color: Colors.text },
              { label: 'Disbursed', value: loan.disbursedAmount ? fmt(loan.disbursedAmount) : '—', color: Colors.primary },
              { label: 'Start Date', value: fmtDate(loan.startDate), color: Colors.text },
              { label: 'End Date', value: fmtDate(loan.endDate), color: Colors.text },
            ].map((d, i) => (
              <View key={i} style={styles.detailCell}>
                <Text style={styles.detailCellLabel}>{d.label}</Text>
                <Text style={[styles.detailCellValue, { color: d.color }]}>{d.value}</Text>
              </View>
            ))}
          </View>
          {loan.purpose ? (
            <View style={styles.purposeRow}>
              <Text style={styles.purposeLabel}>Purpose</Text>
              <Text style={styles.purposeValue}>{loan.purpose}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Installment Schedule */}
      {loan.installments?.length > 0 && (
        <View style={styles.cardWrapper}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>EMI Schedule ({loan.installments.length})</Text>
            {displayInstallments.map((inst: any) => {
              const statusColor =
                inst.status === 'PAID' ? Colors.success :
                  inst.status === 'OVERDUE' ? Colors.danger :
                    Colors.gray400;
              return (
                <View key={inst.id} style={styles.instRow}>
                  <View style={[styles.instBadge, { backgroundColor: statusColor + '18', borderColor: statusColor + '40' }]}>
                    <Text style={[styles.instBadgeText, { color: statusColor }]}>#{inst.installmentNo}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.instAmount}>{fmt(inst.totalAmount)}</Text>
                    <Text style={styles.instDate}>{fmtDate(inst.dueDate)}</Text>
                  </View>
                  <View style={[styles.instStatusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.instStatusText, { color: statusColor }]}>{inst.status}</Text>
                </View>
              );
            })}
            {loan.installments.length > 5 && (
              <TouchableOpacity style={styles.showMoreBtn} onPress={() => setShowAllInst(!showAllInst)}>
                <Text style={styles.showMoreText}>
                  {showAllInst ? 'Show Less' : `View All ${loan.installments.length} Installments`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {isAdmin && (
        <View style={[styles.cardWrapper, { paddingBottom: 40 }]}>
          {loan.status === 'PENDING' && (
            <>
              <Button title="Approve Loan" onPress={() => doAction('approve', 'Approve')} loading={actionLoading} style={styles.actionBtnPrimary} />
              <View style={{ height: 10 }} />
              <Button title="Reject Loan" onPress={() => doAction('reject', 'Reject')} variant="danger" />
            </>
          )}
          {loan.status === 'APPROVED' && (
            <Button
              title="Disburse Loan"
              onPress={() => router.push(`/(admin)/loans/${id}/disburse` as any)}
              style={styles.actionBtnPrimary}
            />
          )}
          {loan.status === 'ACTIVE' && (
            <Button
              title="Record Payment"
              onPress={() => router.push(`/(admin)/payments/new?loanId=${id}` as any)}
              style={styles.actionBtnPrimary}
            />
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Hero
  heroSection: {
    backgroundColor: Colors.primary,
    paddingTop: 50, paddingBottom: 30,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.white + '18', borderRadius: 10,
  },
  backText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  loanNo: { color: Colors.white + '80', fontSize: 13, letterSpacing: 1, fontWeight: '600' },
  heroAmount: { color: Colors.white, fontSize: 40, fontWeight: '800', marginTop: 6, letterSpacing: -1 },
  heroMeta: {
    flexDirection: 'row', marginTop: 20,
    backgroundColor: Colors.white + '15', borderRadius: 14, padding: 14,
  },
  heroMetaItem: { flex: 1, alignItems: 'center' },
  heroMetaLabel: { color: Colors.white + '90', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroMetaValue: { color: Colors.white, fontSize: 18, fontWeight: '800', marginTop: 4 },
  heroMetaDivider: { width: 1.5, backgroundColor: Colors.white + '25', marginVertical: 2 },

  // Card Wrapper
  cardWrapper: { paddingHorizontal: Spacing.md, marginTop: 14 },
  card: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 18,
    ...Shadow.md, borderWidth: 1, borderColor: Colors.gray100,
  },

  // Customer
  customerRow: { flexDirection: 'row', alignItems: 'center' },
  customerAvatar: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  customerAvatarText: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  customerName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  customerPhone: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  // Section Title
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 14 },

  // Progress
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressPct: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  progressTrack: { height: 10, backgroundColor: Colors.gray100, borderRadius: 5, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 10, backgroundColor: Colors.success, borderRadius: 5 },
  progressStats: { flexDirection: 'row', gap: 16, marginTop: 14 },
  progressStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  amountSummary: {
    flexDirection: 'row', marginTop: 16,
    backgroundColor: Colors.gray50, borderRadius: 12, padding: 14,
  },
  amountItem: { flex: 1, alignItems: 'center' },
  amountLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500', textTransform: 'uppercase' },
  amountValue: { fontSize: 16, fontWeight: '800', marginTop: 4 },

  // Details Grid
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  detailCell: {
    width: '50%', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  detailCellLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.3 },
  detailCellValue: { fontSize: 15, fontWeight: '700', color: Colors.text, marginTop: 4 },
  purposeRow: { marginTop: 14 },
  purposeLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.3 },
  purposeValue: { fontSize: 14, color: Colors.text, fontWeight: '500', marginTop: 4 },

  // Installments
  instRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.gray50,
  },
  instBadge: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5,
  },
  instBadgeText: { fontSize: 11, fontWeight: '800' },
  instAmount: { fontSize: 15, fontWeight: '700', color: Colors.text },
  instDate: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  instStatusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  instStatusText: { fontSize: 11, fontWeight: '700' },
  showMoreBtn: { alignItems: 'center', paddingTop: 14 },
  showMoreText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },

  // Actions
  actionBtnPrimary: { borderRadius: 14 },
});
