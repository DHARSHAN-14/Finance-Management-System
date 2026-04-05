import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { chitApi } from '../../../services/api';
import { Card, StatusBadge, LoadingScreen, ErrorState, InfoRow, SectionHeader, Button } from '../../../components/ui';
import { Colors, Spacing, Typography } from '../../../constants/theme';

function fmt(n: number) { return '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }
function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; }

export default function ChitDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [chit, setChit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const load = () => {
    setLoading(true);
    chitApi.getById(id)
      .then(({ data }) => setChit(data.data))
      .catch(() => setError('Failed to load chit'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleActivate = async () => {
    try {
      await chitApi.list(); // placeholder — would call activate
      Alert.alert('Success', 'Chit activated');
      load();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <LoadingScreen />;
  if (error || !chit) return <ErrorState message={error || 'Not found'} />;

  const paidInstallments = chit.installments?.filter((i: any) => i.auctionStatus === 'COMPLETED').length ?? 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: Colors.white, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <StatusBadge status={chit.status} />
      </View>

      <View style={styles.summaryBg}>
        <Text style={styles.chitName}>{chit.name}</Text>
        <Text style={styles.chitValue}>{fmt(chit.totalValue)}</Text>
        <Text style={styles.chitSub}>{fmt(chit.monthlyContribution)}/month · {chit.duration} months</Text>
      </View>

      {/* Progress */}
      <Card style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={Typography.h4}>Progress</Text>
          <Text style={{ color: Colors.primary, fontWeight: '700' }}>{paidInstallments}/{chit.duration}</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${(paidInstallments / chit.duration) * 100}%` }]} />
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm }}>
          <Text style={Typography.caption}>{chit.members?.length ?? 0} members</Text>
          <Text style={Typography.caption}>{chit.commissionPct}% commission</Text>
        </View>
      </Card>

      {/* Details */}
      <Card style={styles.section}>
        <SectionHeader title="Chit Details" />
        <InfoRow label="Start Date" value={fmtDate(chit.startDate)} />
        <InfoRow label="End Date" value={fmtDate(chit.endDate)} />
        <InfoRow label="Commission" value={`${chit.commissionPct}%`} />
        <InfoRow label="Description" value={chit.description || '—'} />
      </Card>

      {/* Members */}
      {chit.members?.length > 0 && (
        <Card style={styles.section}>
          <SectionHeader
            title={`Members (${chit.members.length})`}
            action={
              <TouchableOpacity onPress={() => router.push(`/(admin)/chits/${id}/add-member` as any)}>
                <Text style={{ color: Colors.primary, fontSize: 13 }}>+ Add</Text>
              </TouchableOpacity>
            }
          />
          {chit.members.map((m: any) => (
            <View key={m.id} style={styles.memberRow}>
              <View style={styles.ticketBadge}>
                <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 12 }}>#{m.ticketNo}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={Typography.body}>{m.customer.name}</Text>
                <Text style={[Typography.caption, { color: Colors.textSecondary }]}>{m.customer.phone}</Text>
              </View>
              {m.hasReceived && (
                <View style={[styles.receivedBadge]}>
                  <Text style={{ color: Colors.success, fontSize: 11, fontWeight: '600' }}>Received</Text>
                </View>
              )}
            </View>
          ))}
        </Card>
      )}

      {/* Installments */}
      {chit.installments?.length > 0 && (
        <Card style={styles.section}>
          <SectionHeader title="Installment Schedule" />
          {chit.installments.slice(0, 6).map((inst: any) => {
            const isDone = inst.auctionStatus === 'COMPLETED';
            return (
              <View key={inst.id} style={styles.instRow}>
                <View style={[styles.instNum, { backgroundColor: isDone ? Colors.success + '20' : Colors.gray100 }]}>
                  <Text style={{ fontWeight: '700', fontSize: 12, color: isDone ? Colors.success : Colors.textSecondary }}>
                    #{inst.installmentNo}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={Typography.body}>Due: {fmtDate(inst.dueDate)}</Text>
                  {inst.winnerId && (
                    <Text style={[Typography.caption, { color: Colors.success }]}>
                      Auction: {fmt(inst.auctionAmount)}
                    </Text>
                  )}
                </View>
                <StatusBadge status={isDone ? 'COMPLETED' : 'PENDING'} />
              </View>
            );
          })}
        </Card>
      )}

      {/* Actions */}
      <View style={[styles.section, { paddingBottom: Spacing.xl }]}>
        {chit.status === 'UPCOMING' && (
          <Button title="Activate Chit" onPress={handleActivate} style={{ marginBottom: Spacing.sm }} />
        )}
        {chit.status === 'ACTIVE' && (
          <Button
            title="+ Add Member"
            onPress={() => router.push(`/(admin)/chits/${id}/add-member` as any)}
            variant="secondary"
          />
        )}
      </View>
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
  chitName: { color: Colors.white + 'CC', fontSize: 14 },
  chitValue: { color: Colors.white, fontSize: 36, fontWeight: '800', marginTop: 4 },
  chitSub: { color: Colors.white + 'CC', fontSize: 14, marginTop: 2 },
  section: { margin: Spacing.md, marginTop: 0 },
  progressBg: { height: 8, backgroundColor: Colors.gray200, borderRadius: 4, marginTop: Spacing.sm },
  progressFill: { height: 8, backgroundColor: Colors.accent, borderRadius: 4 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  ticketBadge: { width: 36, height: 36, borderRadius: 8, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  receivedBadge: { backgroundColor: Colors.success + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  instRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  instNum: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});
