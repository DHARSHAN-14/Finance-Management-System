import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { loanApi } from '../../../../services/api';
import { Button, Input } from '../../../../components/ui';
import { DatePickerInput } from '../../../../components/DatePickerInput';
import { LiveClock } from '../../../../components/LiveClock';
import { Colors, Spacing, Typography, Shadow, Radius } from '../../../../constants/theme';

export default function DisburseLoan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ disbursedAmount: '', startDate: null as Date | null });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.disbursedAmount || parseFloat(form.disbursedAmount) <= 0) e.disbursedAmount = 'Enter the disbursed amount';
    if (!form.startDate) e.startDate = 'Select the loan start date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleDisburse = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await loanApi.disburse(id, {
        disbursedAmount: parseFloat(form.disbursedAmount),
        startDate: form.startDate!.toISOString(),
      });
      Alert.alert('Success', 'Loan disbursed and EMI schedule generated');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to disburse');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disburse Loan</Text>
        <LiveClock variant="compact" />
      </View>

      <View style={styles.form}>
        {/* Warning Notice */}
        <View style={styles.notice}>
          <View style={styles.noticeIcon}>
            <Text style={{ fontSize: 22 }}>⚡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>Important Action</Text>
            <Text style={styles.noticeText}>
              Disbursing will generate the full EMI schedule and activate the loan. This action cannot be undone.
            </Text>
          </View>
        </View>

        {/* Form Fields */}
        <Text style={styles.sectionLabel}>DISBURSAL DETAILS</Text>

        <Input
          label="Disbursed Amount (₹) *"
          placeholder="98000"
          value={form.disbursedAmount}
          onChangeText={(v) => setForm((p) => ({ ...p, disbursedAmount: v }))}
          keyboardType="numeric"
          error={errors.disbursedAmount}
        />

        <DatePickerInput
          label="Start Date *"
          value={form.startDate}
          onChange={(date) => setForm((p) => ({ ...p, startDate: date }))}
          placeholder="Select loan start date"
          error={errors.startDate}
          minimumDate={new Date(2020, 0, 1)}
          maximumDate={new Date(2030, 11, 31)}
        />

        <Button
          title={saving ? 'Processing...' : 'Confirm Disbursal'}
          onPress={handleDisburse}
          loading={saving}
          style={styles.submitBtn}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: 20,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.white + '18', borderRadius: 10 },
  backText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  headerTitle: { color: Colors.white, fontSize: 20, fontWeight: '800' },
  form: { padding: Spacing.lg, paddingBottom: 40 },

  notice: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.warning + '12',
    borderRadius: 16, padding: 16, marginBottom: 24,
    borderWidth: 1.5, borderColor: Colors.warning + '30',
  },
  noticeIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.warning + '20',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: Colors.warning, marginBottom: 4 },
  noticeText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 1, marginBottom: 16,
  },

  submitBtn: { marginTop: 10, borderRadius: 14, height: 54 },
});
