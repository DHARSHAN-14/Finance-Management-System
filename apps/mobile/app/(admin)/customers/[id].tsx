import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { customerApi } from '../../../services/api';
import {
  Card, StatusBadge, LoadingScreen, ErrorState, InfoRow,
  SectionHeader, Divider, Button,
} from '../../../components/ui';
import { Colors, Spacing, Typography } from '../../../constants/theme';

function fmt(n: number) { return '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }

export default function CustomerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = Array.isArray(id) ? id[0] : id;
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const load = useCallback(() => {
    if (!customerId) {
      setError('Customer ID is missing');
      setLoading(false);
      return Promise.resolve();
    }

    setLoading(true);
    setError('');
    return customerApi.getById(customerId)
      .then(({ data }) => setCustomer(data.data))
      .catch(() => setError('Failed to load customer'))
      .finally(() => setLoading(false));
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeactivate = () => {
    Alert.alert('Deactivate Customer', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate', style: 'destructive',
        onPress: async () => {
          await customerApi.deactivate(customerId);
          router.back();
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen />;
  if (error || !customer) return <ErrorState message={error || 'Not found'} onRetry={load} />;

  const score = customer.honestyScores?.[0];
  const scoreColor = !score ? Colors.gray400
    : score.score >= 80 ? Colors.success
    : score.score >= 60 ? Colors.info
    : score.score >= 40 ? Colors.warning
    : Colors.danger;

  return (
    <ScrollView style={styles.container}>
      {/* Back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: Colors.white, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/(admin)/customers/${customerId}/edit` as any)}>
          <Text style={{ color: Colors.white, fontSize: 16 }}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Profile */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{customer.name[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{customer.name}</Text>
        <Text style={styles.phone}>{customer.phone}</Text>
        {!customer.isActive && <StatusBadge status="INACTIVE" />}
      </View>

      {/* Honesty Score */}
      {score && (
        <Card style={[styles.scoreCard, { borderColor: scoreColor }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={[Typography.caption, { color: Colors.textSecondary }]}>Honesty Score</Text>
              <Text style={{ fontSize: 36, fontWeight: '800', color: scoreColor }}>{score.score}</Text>
              <Text style={{ color: scoreColor, fontWeight: '600' }}>{score.category}</Text>
            </View>
            <Text style={{ fontSize: 48 }}>
              {score.score >= 80 ? '🏆' : score.score >= 60 ? '✅' : score.score >= 40 ? '⚠️' : '🚨'}
            </Text>
          </View>
        </Card>
      )}

      {/* Details */}
      <Card style={styles.section}>
        <SectionHeader title="Personal Details" />
        <InfoRow label="Email" value={customer.email || '—'} />
        <InfoRow label="Address" value={customer.address || '—'} />
        <InfoRow label="Occupation" value={customer.occupation || '—'} />
        <InfoRow label="Monthly Income" value={customer.monthlyIncome ? fmt(customer.monthlyIncome) : '—'} />
        <InfoRow label="Aadhaar" value={customer.aadhaarNo || '—'} />
        <InfoRow label="PAN" value={customer.panNo || '—'} />
        <InfoRow label="Joined" value={new Date(customer.createdAt).toLocaleDateString('en-IN')} />
      </Card>

      {/* Loans */}
      {customer.loans?.length > 0 && (
        <Card style={styles.section}>
          <SectionHeader
            title="Loans"
            action={
              <TouchableOpacity onPress={() => router.push(`/(admin)/loans?customerId=${customerId}` as any)}>
                <Text style={{ color: Colors.primary, fontSize: 13 }}>View All</Text>
              </TouchableOpacity>
            }
          />
          {customer.loans.slice(0, 3).map((loan: any) => (
            <TouchableOpacity key={loan.id} onPress={() => router.push(`/(admin)/loans/${loan.id}` as any)}>
              <View style={styles.loanRow}>
                <View style={{ flex: 1 }}>
                  <Text style={Typography.h4}>{loan.loanNo}</Text>
                  <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                    {fmt(loan.principalAmount)} · EMI {fmt(loan.emi)}
                  </Text>
                </View>
                <StatusBadge status={loan.status} />
              </View>
              <Divider />
            </TouchableOpacity>
          ))}
        </Card>
      )}

      {/* Chit Memberships */}
      {customer.chitMembers?.length > 0 && (
        <Card style={styles.section}>
          <SectionHeader title={`Chit Memberships (${customer.chitMembers.length})`} />
          {customer.chitMembers.map((m: any) => (
            <View key={m.id} style={styles.loanRow}>
              <View style={{ flex: 1 }}>
                <Text style={Typography.h4}>{m.chit.name}</Text>
                <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>
                  Ticket #{m.ticketNo} · {fmt(m.chit.monthlyContribution)}/month
                </Text>
              </View>
              <StatusBadge status={m.chit.status} />
            </View>
          ))}
        </Card>
      )}

      {/* Actions */}
      <View style={[styles.section, { paddingBottom: Spacing.xl }]}>
        <Button
          title="Record Payment"
          onPress={() => router.push(`/(admin)/payments/new?customerId=${customerId}` as any)}
          style={{ marginBottom: Spacing.sm }}
        />
        <Button
          title="Create Loan"
          onPress={() => router.push(`/(admin)/loans/new?customerId=${customerId}` as any)}
          variant="secondary"
          style={{ marginBottom: Spacing.sm }}
        />
        {customer.isActive && (
          <Button title="Deactivate Customer" onPress={handleDeactivate} variant="danger" />
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
  profileSection: { alignItems: 'center', backgroundColor: Colors.primary, paddingBottom: Spacing.xl },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.white + '30', justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: { color: Colors.white, fontWeight: '800', fontSize: 32 },
  name: { color: Colors.white, fontSize: 22, fontWeight: '700' },
  phone: { color: Colors.white + 'CC', fontSize: 15, marginTop: 2 },
  scoreCard: { margin: Spacing.md, borderWidth: 2, borderRadius: 16 },
  section: { margin: Spacing.md, marginTop: 0 },
  loanRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.sm },
});
